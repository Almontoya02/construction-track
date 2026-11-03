import type { AuthUser } from "@/types/auth";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * A stand-in for the real session store that records every call, so the tests
 * can assert not just what the session guards return but what they *wrote*.
 * Built inside `vi.hoisted` because `vi.mock` factories run before the module
 * body.
 */
const mocks = vi.hoisted(() => {
  const entries = new Map<
    string,
    { data: Record<string, unknown>; expiresAt: number }
  >();
  let nextId = 0;

  return {
    entries,
    reset() {
      entries.clear();
      nextId = 0;
    },
    sessionStore: {
      create: vi.fn(async (data: Record<string, unknown>, expiresAt: Date) => {
        const id = `sid-${++nextId}`;
        entries.set(id, { data, expiresAt: expiresAt.getTime() });
        return id;
      }),
      read: vi.fn(async (id: string) => entries.get(id)?.data ?? null),
      update: vi.fn(
        async (id: string, data: Record<string, unknown>, expiresAt: Date) => {
          entries.set(id, { data, expiresAt: expiresAt.getTime() });
        },
      ),
      destroy: vi.fn(async (id: string) => {
        entries.delete(id);
      }),
    },
  };
});

vi.mock("@/lib/session-store.server", () => ({
  sessionStore: mocks.sessionStore,
}));

const authMocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

vi.mock("@/lib/auth.server", () => ({
  default: { authenticate: authMocks.authenticate },
  ServiceUnavailableError: class ServiceUnavailableError extends Error {},
}));

vi.mock("@/lib/logger.server", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const { commitSession, getAuthSession, getSession, getUser, rotateSession } =
  await import("@/sessions.server");
const { createMemorySessionStore } = await vi.importActual<
  typeof import("@/lib/session-store.server")
>("@/lib/session-store.server");
const { loader: callbackLoader } = await import("@/routes/(auth)/callback");

const user: AuthUser = {
  sub: "auth0|123",
  email: "someone@example.com",
  permissions: ["ae:create:clients"],
} as AuthUser;

/** Turns a `Set-Cookie` value into something usable as a request `Cookie`. */
const asRequestCookie = (setCookie: string) => setCookie.split(";")[0];

/** A signed cookie for a fully populated session. */
const signedSessionCookie = async () => {
  const session = await getSession(null);
  session.set("user", user);
  session.set("token", "an-access-token");
  return asRequestCookie(await commitSession(session));
};

beforeEach(() => {
  mocks.reset();
  vi.clearAllMocks();
});

describe("session guards", () => {
  test("an unauthenticated request creates no session entry", async () => {
    const request = new Request("https://app.test/clients");

    const thrown = await getUser(request).catch((error) => error);

    expect(thrown).toBeInstanceOf(Response);
    expect(thrown.status).toBe(302);
    expect(thrown.headers.get("Location")).toBe("/login");

    // The regression this guards: committing an id-less session sends
    // react-router down the `createData` branch, so every unauthenticated
    // request used to write a throwaway entry that only an hourly sweep
    // reclaimed.
    expect(mocks.sessionStore.create).not.toHaveBeenCalled();
    expect(mocks.entries.size).toBe(0);
  });

  test("an unauthenticated redirect sets no cookie", async () => {
    const request = new Request("https://app.test/clients");

    const thrown = await getUser(request).catch((error) => error);

    expect(thrown.headers.get("Set-Cookie")).toBeNull();
  });

  test("a request bearing an unknown session id creates no entry either", async () => {
    const session = await getSession(null);
    session.set("user", user);
    session.set("token", "an-access-token");
    const cookie = asRequestCookie(await commitSession(session));

    // The cookie is valid and signed, but the store no longer holds it —
    // exactly what a restart, or a replica that never saw the login, sees.
    mocks.reset();
    vi.clearAllMocks();

    const thrown = await getUser(
      new Request("https://app.test/clients", { headers: { cookie } }),
    ).catch((error) => error);

    expect(thrown.status).toBe(302);
    expect(mocks.sessionStore.create).not.toHaveBeenCalled();
  });

  test("a populated session passes through", async () => {
    const cookie = await signedSessionCookie();

    await expect(
      getUser(new Request("https://app.test/clients", { headers: { cookie } })),
    ).resolves.toMatchObject({ sub: user.sub });
  });
});

describe("getAuthSession", () => {
  test("returns user, permissions and token from one store read", async () => {
    const cookie = await signedSessionCookie();
    vi.clearAllMocks();

    const context = await getAuthSession(
      new Request("https://app.test/clients", { headers: { cookie } }),
    );

    expect(context.user.sub).toBe(user.sub);
    expect(context.permissions).toEqual(["ae:create:clients"]);
    expect(context.token).toBe("an-access-token");

    // The point of the helper: one read, not one per field.
    expect(mocks.sessionStore.read).toHaveBeenCalledTimes(1);
  });

  test("redirects to /login when the session has no token", async () => {
    const cookie = await signedSessionCookie();
    const [storedId] = [...mocks.entries.keys()];
    mocks.entries.set(storedId, {
      data: { user },
      expiresAt: Date.now() + 1e6,
    });

    const thrown = await getAuthSession(
      new Request("https://app.test/clients", { headers: { cookie } }),
    ).catch((error) => error);

    expect(thrown).toBeInstanceOf(Response);
    expect(thrown.headers.get("Location")).toBe("/login");
    // A real session id was present, so this one *should* be cleared.
    expect(mocks.sessionStore.destroy).toHaveBeenCalledWith(storedId);
  });
});

describe("session fixation", () => {
  test("rotateSession issues a new id and drops the old entry", async () => {
    const planted = await getSession(null);
    planted.set("token", "attacker-planted");
    const cookie = asRequestCookie(await commitSession(planted));
    const [plantedId] = [...mocks.entries.keys()];

    const incoming = await getSession(cookie);
    expect(incoming.id).toBe(plantedId);

    const fresh = await rotateSession(incoming);
    // An id-less session is what forces `commitSession` down `createData`.
    expect(fresh.id).toBe("");

    fresh.set("user", user);
    fresh.set("token", "victim-token");
    await commitSession(fresh);

    // The id the caller arrived with must be gone, not overwritten.
    expect(mocks.entries.has(plantedId)).toBe(false);
    expect(mocks.sessionStore.destroy).toHaveBeenCalledWith(plantedId);

    const [survivingId] = [...mocks.entries.keys()];
    expect(survivingId).not.toBe(plantedId);
  });

  test("logging in does not write into a visitor-supplied session id", async () => {
    // Simulate what an attacker plants: a signed cookie for an id they know.
    const attacker = await getSession(null);
    attacker.set("token", "attacker-token");
    const attackerCookie = asRequestCookie(await commitSession(attacker));
    const [attackerId] = [...mocks.entries.keys()];

    // The victim authenticates while carrying that cookie.
    const victimSession = await getSession(attackerCookie);
    expect(victimSession.id).toBe(attackerId); // react-router keeps the id

    const fresh = await rotateSession(victimSession);
    fresh.set("user", user);
    fresh.set("token", "victim-access-token");
    await commitSession(fresh);

    // The attacker's id must not hold the victim's session.
    expect(mocks.entries.get(attackerId)).toBeUndefined();
  });
});

describe("callback route", () => {
  test("does not store the authenticated user under a planted session id", async () => {
    // What an attacker plants in a victim's browser: a signed cookie naming an
    // id they already know. Signing one costs nothing — log in, copy the value.
    const planted = await getSession(null);
    planted.set("token", "attacker-token");
    const plantedCookie = asRequestCookie(await commitSession(planted));
    const [plantedId] = [...mocks.entries.keys()];

    authMocks.authenticate.mockResolvedValue({
      user,
      tokenId: "victim-access-token",
    });

    const response = await callbackLoader({
      request: new Request("https://app.test/auth/callback?code=x", {
        headers: { cookie: plantedCookie },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");

    // The victim's session must NOT be reachable via the attacker's id.
    expect(mocks.entries.get(plantedId)).toBeUndefined();

    // A brand-new id was minted, and the cookie handed back names that one.
    const [issuedId] = [...mocks.entries.keys()];
    expect(issuedId).not.toBe(plantedId);
    expect(mocks.entries.get(issuedId)?.data).toMatchObject({
      token: "victim-access-token",
    });
    expect(response.headers.get("Set-Cookie")).not.toContain(plantedId);
  });
});

describe("production cookie hardening", () => {
  // These paths only run when NODE_ENV=production, so without re-importing
  // the module under a stubbed env they would ship entirely unexercised.
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test("uses the __Host- prefix, Secure, HttpOnly and no Domain", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "a-real-secret");
    vi.resetModules();

    const prod = await import("@/sessions.server");
    const session = await prod.getSession(null);
    session.set("token", "t");
    const cookie = await prod.commitSession(session);

    // `__Host-` is only honoured by browsers when all three hold; getting any
    // of them wrong makes the browser drop the cookie and login loop forever.
    expect(cookie).toMatch(/^__Host-session=/);
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toMatch(/Domain=/i);
  });

  test("refuses to load in production without SESSION_SECRET", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.resetModules();

    await expect(import("@/sessions.server")).rejects.toThrow(/SESSION_SECRET/);
  });

  test("keeps the plain cookie name outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();

    const dev = await import("@/sessions.server");
    const session = await dev.getSession(null);
    session.set("token", "t");
    const cookie = await dev.commitSession(session);

    // `__Host-` requires Secure, which the HTTP dev server cannot set.
    expect(cookie).toMatch(/^__session=/);
    expect(cookie).not.toContain("Secure");
  });
});

describe("memory session store", () => {
  test("round-trips create, read, update and destroy", async () => {
    const store = createMemorySessionStore();
    const expires = new Date(Date.now() + 60_000);

    const id = await store.create({ hello: "world" }, expires);
    expect(await store.read(id)).toEqual({ hello: "world" });

    await store.update(id, { hello: "again" }, expires);
    expect(await store.read(id)).toEqual({ hello: "again" });

    await store.destroy(id);
    expect(await store.read(id)).toBeNull();
  });

  test("reads an expired session as missing", async () => {
    const store = createMemorySessionStore();

    const id = await store.create({ hello: "world" }, new Date(Date.now() - 1));

    expect(await store.read(id)).toBeNull();
  });

  test("destroying an unknown id is a no-op", async () => {
    const store = createMemorySessionStore();

    await expect(store.destroy("never-existed")).resolves.toBeUndefined();
  });

  test("updating an unknown id does not create it", async () => {
    const store = createMemorySessionStore();

    // react-router keeps the cookie's id even when the store had no entry, so
    // a creating `update` would let a signed cookie resurrect any id.
    await store.update(
      "never-issued",
      { user: "victim" },
      new Date(Date.now() + 60_000),
    );

    expect(await store.read("never-issued")).toBeNull();
  });

  test("updating a destroyed id does not resurrect it", async () => {
    const store = createMemorySessionStore();
    const expires = new Date(Date.now() + 60_000);

    const id = await store.create({ hello: "world" }, expires);
    await store.destroy(id);
    await store.update(id, { hello: "back" }, expires);

    expect(await store.read(id)).toBeNull();
  });
});
