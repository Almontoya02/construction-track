import type { AuthUser } from "@/types/auth";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * These tests cover the gate that stands between a user and data they are not
 * entitled to. They stub the session layer so the wrappers can be exercised
 * directly, and stub `fetch` so no request leaves the process.
 */
const authed = vi.hoisted(() => ({ getAuthSession: vi.fn() }));

vi.mock("@/sessions.server", () => ({
  getAuthSession: authed.getAuthSession,
  getSession: vi.fn(async () => ({ id: "sid-1" })),
  destroySession: vi.fn(async () => "__session=; Max-Age=0"),
}));

vi.mock("@/lib/logger.server", () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const {
  AuthorizedLoaderWithFetcher,
  AuthorizedActionWithFetcher,
  AuthorizedLoader,
} = await import("@/lib/auth.server");

const user = {
  sub: "auth0|123",
  email: "someone@example.com",
} as AuthUser;

/** Signs the caller in with exactly these permissions. */
const signedInWith = (permissions: string[]) =>
  authed.getAuthSession.mockResolvedValue({
    user: { ...user, permissions },
    permissions,
    token: "an-access-token",
  });

const loaderArgs = (url = "https://app.test/clients") =>
  ({
    request: new Request(url, { headers: { cookie: "__session=abc" } }),
    params: {},
    context: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const actionArgs = (url = "https://app.test/clients") =>
  ({
    request: new Request(url, {
      method: "POST",
      headers: { cookie: "__session=abc" },
    }),
    params: {},
    context: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const originalBackend = process.env.BACKEND_URL;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BACKEND_URL = "https://api.example.test";
});

afterEach(() => {
  process.env.BACKEND_URL = originalBackend;
  vi.unstubAllGlobals();
});

describe("AuthorizedLoaderWithFetcher — permission gate", () => {
  test("runs the loader when the user holds the permission", async () => {
    signedInWith(["ae:create:clients"]);
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("ae:create:clients", body);

    await expect(loader(loaderArgs())).resolves.toEqual({ ok: true });
    expect(body).toHaveBeenCalledOnce();
  });

  test("redirects to /unauthorized when the permission is missing", async () => {
    signedInWith(["ae:read:something-else"]);
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("ae:create:clients", body);
    const thrown = await loader(loaderArgs()).catch((error) => error);

    expect(thrown).toBeInstanceOf(Response);
    expect(thrown.status).toBe(302);
    expect(thrown.headers.get("Location")).toBe("/unauthorized");
    // The gate must run *before* the body, not alongside it.
    expect(body).not.toHaveBeenCalled();
  });

  test("redirects when the user holds no permissions at all", async () => {
    signedInWith([]);
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("ae:create:clients", body);
    const thrown = await loader(loaderArgs()).catch((error) => error);

    expect(thrown.headers.get("Location")).toBe("/unauthorized");
    expect(body).not.toHaveBeenCalled();
  });

  test("does not treat a permission as a prefix match", async () => {
    // Holding `ae:create:clients-archive` must not grant `ae:create:clients`.
    signedInWith(["ae:create:clients-archive"]);
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("ae:create:clients", body);
    const thrown = await loader(loaderArgs()).catch((error) => error);

    expect(thrown.headers.get("Location")).toBe("/unauthorized");
    expect(body).not.toHaveBeenCalled();
  });

  test('the "" opt-out skips the check but still requires a session', async () => {
    signedInWith([]);
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("", body);

    await expect(loader(loaderArgs())).resolves.toEqual({ ok: true });
    expect(authed.getAuthSession).toHaveBeenCalledOnce();
  });

  test("propagates the /login redirect when there is no session", async () => {
    authed.getAuthSession.mockRejectedValue(
      new Response(null, { status: 302, headers: { Location: "/login" } }),
    );
    const body = vi.fn(async () => ({ ok: true }));

    const loader = AuthorizedLoaderWithFetcher("ae:create:clients", body);
    const thrown = await loader(loaderArgs()).catch((error) => error);

    expect(thrown).toBeInstanceOf(Response);
    expect(thrown.headers.get("Location")).toBe("/login");
    expect(body).not.toHaveBeenCalled();
  });
});

describe("AuthorizedActionWithFetcher — permission gate", () => {
  test("runs the action when the user holds the permission", async () => {
    signedInWith(["ae:create:clients"]);
    const body = vi.fn(async () => ({ created: true }));

    const action = AuthorizedActionWithFetcher("ae:create:clients", body);

    await expect(action(actionArgs())).resolves.toEqual({ created: true });
  });

  test("redirects to /unauthorized without running the action", async () => {
    signedInWith([]);
    const body = vi.fn(async () => ({ created: true }));

    const action = AuthorizedActionWithFetcher("ae:create:clients", body);
    const thrown = await action(actionArgs()).catch((error) => error);

    expect(thrown.headers.get("Location")).toBe("/unauthorized");
    // A mutation must never run for an unauthorized caller.
    expect(body).not.toHaveBeenCalled();
  });
});

describe("AuthorizedLoader", () => {
  test("passes user and permissions through without gating", async () => {
    signedInWith(["ae:create:clients"]);

    const loader = AuthorizedLoader(async (_args, u, permissions) => ({
      email: u.email,
      permissions,
    }));

    await expect(loader(loaderArgs())).resolves.toEqual({
      email: user.email,
      permissions: ["ae:create:clients"],
    });
  });
});

describe("fetcher — expired token handling", () => {
  test("a 401 ends the session and redirects to /login?error=expired", async () => {
    signedInWith(["ae:create:clients"]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    const loader = AuthorizedLoaderWithFetcher(
      "ae:create:clients",
      async (_args, fetcher) => fetcher.get("/todos"),
    );

    const thrown = await loader(loaderArgs()).catch((error) => error);

    // Without the `error instanceof Response` re-throw in the fetcher's catch,
    // this redirect would be swallowed and returned as a generic error object,
    // stranding the user on a page of errors with no way back to login.
    expect(thrown).toBeInstanceOf(Response);
    expect(thrown.status).toBe(302);
    expect(thrown.headers.get("Location")).toBe("/login?error=expired");
    expect(thrown.headers.get("Set-Cookie")).toContain("__session=");
  });

  test("a non-401 error is returned as data, not thrown", async () => {
    signedInWith(["ae:create:clients"]);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Nope" }), { status: 400 }),
      ),
    );

    const loader = AuthorizedLoaderWithFetcher(
      "ae:create:clients",
      async (_args, fetcher) => fetcher.get("/todos"),
    );

    await expect(loader(loaderArgs())).resolves.toEqual({
      data: null,
      error: "Nope",
    });
  });
});
