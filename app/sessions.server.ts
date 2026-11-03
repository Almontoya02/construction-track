import { sessionStore } from "@/lib/session-store.server";
import type { AuthUser } from "@/types/auth";
import { createSessionStorage, redirect, type Session } from "react-router";

type SessionData = {
  user: AuthUser;
  token: string;
};

const production = process.env.NODE_ENV === "production";

const SESSION_MAX_AGE = 60 * 60 * 24 * 1; // 1 day in seconds

/** Fallback expiry for the rare commit that carries neither maxAge nor expires. */
const defaultExpiry = () => new Date(Date.now() + SESSION_MAX_AGE * 1000);

/**
 * The key the session cookie is signed with.
 *
 * Fails closed in production rather than falling back to a constant: a
 * publicly-known signing key lets anyone mint a validly-signed cookie for a
 * session id of their choosing, which is the precondition for fixating a
 * session on a victim (see the rotation note in `app/routes/(auth)/callback.ts`).
 */
const sessionSecret = process.env.SESSION_SECRET;

if (production && !sessionSecret) {
  throw new Error(
    "SESSION_SECRET must be set in production. Refusing to sign session " +
      "cookies with a default key.",
  );
}

/**
 * `__Host-` binds the cookie to this exact origin: browsers reject it unless
 * it is `Secure`, `Path=/` and carries no `Domain`, which means a sibling
 * subdomain cannot write it (cookie tossing) and no other path can shadow it.
 *
 * The prefix requires `Secure`, so it is only usable where the cookie is
 * marked secure — hence the plain name outside production, where the dev
 * server is served over HTTP.
 */
const COOKIE_NAME = production ? "__Host-session" : "__session";

const { getSession, commitSession, destroySession } =
  createSessionStorage<SessionData>({
    cookie: {
      name: COOKIE_NAME,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      secrets: [sessionSecret ?? "insecure-development-only-secret"],
      secure: production,
    },
    createData: (data, expires) =>
      sessionStore.create(data, expires ?? defaultExpiry()),
    readData: (id) => sessionStore.read(id),
    updateData: (id, data, expires) =>
      sessionStore.update(id, data, expires ?? defaultExpiry()),
    deleteData: (id) => sessionStore.destroy(id),
  });

/**
 * Discards `previous` and returns a brand-new, id-less session.
 *
 * **Call this at every authentication boundary**, before storing the
 * authenticated user. React Router's `commitSession` writes into
 * `session.id` whenever one is present, and keeps that id even when the store
 * had no entry for it — so committing the session parsed from the request
 * would file the freshly-authenticated user under an id the *visitor* chose.
 *
 * That is a session fixation (CWE-384): an attacker who can plant a
 * validly-signed cookie in someone's browser — via a sibling subdomain, or
 * any XSS — holds a live session for that person the moment they log in,
 * inheriting their permissions and their Auth0 access token. Signing a cookie
 * costs the attacker nothing; they only have to log in themselves and copy
 * their own.
 *
 * An id-less session takes the `createData` branch instead, minting an
 * unpredictable id the attacker has never seen.
 */
const rotateSession = async (previous: Session<SessionData>) => {
  if (previous.id) await destroySession(previous);

  return getSession(null);
};

/**
 * Sends an unauthenticated visitor to the login page, clearing any session.
 *
 * The `Set-Cookie` header is only attached when the session actually exists
 * server-side. Committing a brand-new (id-less) session would send React
 * Router down the `createData` branch of `commitSession` and write a fresh
 * store entry for *every* unauthenticated request — and `getAuthContext` fans
 * out to three of these guards per loader, so an unauthenticated page load
 * would have created up to six throwaway sessions.
 */
const redirectToLogin = async (
  session: Session<SessionData>,
): Promise<never> => {
  if (!session.id) throw redirect("/login");

  throw redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

/**
 * Reads user, permissions and token from a single session lookup.
 *
 * Prefer this over calling {@link getUser}, {@link getPermissions} and
 * {@link getToken} together: each of those decodes the cookie and hits the
 * store again, which is cheap against a `Map` and stops being cheap the
 * moment the store is anything else.
 *
 * @throws {Response} Redirect to `/login` when the session is missing or incomplete
 */
const getAuthSession = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  const token = session.get("token");

  if (!user || !Object.hasOwn(user, "permissions") || !token) {
    await redirectToLogin(session);
  }

  return { user: user!, permissions: user!.permissions, token: token! };
};

const getPermissions = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || !Object.hasOwn(user, "permissions")) {
    await redirectToLogin(session);
  }

  return user!.permissions;
};

const getToken = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!token) await redirectToLogin(session);

  return token!;
};

const getUser = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) await redirectToLogin(session);

  return user!;
};

export {
  commitSession,
  destroySession,
  getAuthSession,
  getPermissions,
  getSession,
  getToken,
  getUser,
  rotateSession,
};
