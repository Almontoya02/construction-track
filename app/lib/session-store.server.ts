import logger from "@/lib/logger.server";
import { randomUUID } from "node:crypto";

/**
 * Arbitrary session payload as React Router hands it to the storage callbacks.
 */
export type SessionRecord = Record<string, unknown>;

/**
 * Backing store for server-side sessions.
 *
 * Sessions are kept server-side rather than in the cookie because the payload
 * (Auth0 access token plus the permissions array) comfortably exceeds the ~4KB
 * browser cookie limit. Only the opaque session id travels in the cookie.
 *
 * Only {@link createMemorySessionStore} implements this today. The interface
 * exists so that moving to a shared backend is a change to this file alone —
 * `app/sessions.server.ts` and every route stay as they are.
 */
export interface SessionStore {
  /** Persists a new session and returns its id. */
  create(data: SessionRecord, expiresAt: Date): Promise<string>;
  /** Returns the session payload, or `null` if it is missing or expired. */
  read(id: string): Promise<SessionRecord | null>;
  /**
   * Overwrites an **existing** session and refreshes its expiry.
   *
   * Must not create the entry when `id` is unknown. React Router keeps the
   * id parsed from the cookie even when the store had no data for it, so a
   * creating `update` would let anyone holding a validly-signed cookie
   * resurrect an arbitrary id — see `rotateSession` in
   * `app/sessions.server.ts`.
   */
  update(id: string, data: SessionRecord, expiresAt: Date): Promise<void>;
  /** Removes a session. Must not throw when the id is unknown. */
  destroy(id: string): Promise<void>;
}

const SWEEP_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * In-process session store.
 *
 * ⚠️ Single-instance only. The data lives in this Node process, so:
 *
 * - every restart or deploy signs all users out; and
 * - a second instance cannot read sessions created by the first, which makes
 *   the user bounce between `/login` and the app forever with nothing logged.
 *
 * Both are invisible until they bite. Before running more than one instance,
 * implement {@link SessionStore} against something shared.
 */
export function createMemorySessionStore(): SessionStore {
  const entries = new Map<string, { data: SessionRecord; expiresAt: number }>();

  // Expired entries are also dropped lazily on read; this sweep bounds the
  // memory held by sessions that are never read again.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(id);
    }
  }, SWEEP_INTERVAL_MS);

  // Don't hold the event loop open — otherwise `vitest` and graceful shutdown
  // both hang waiting on this timer.
  sweep.unref();

  return {
    async create(data, expiresAt) {
      const id = randomUUID();
      entries.set(id, { data, expiresAt: expiresAt.getTime() });
      return id;
    },
    async read(id) {
      const entry = entries.get(id);
      if (!entry) return null;

      if (entry.expiresAt <= Date.now()) {
        entries.delete(id);
        return null;
      }

      return entry.data;
    },
    async update(id, data, expiresAt) {
      // Only refresh what already exists: creating here would resurrect an
      // id that was never issued (or has since been destroyed).
      if (!entries.has(id)) return;

      entries.set(id, { data, expiresAt: expiresAt.getTime() });
    },
    async destroy(id) {
      entries.delete(id);
    },
  };
}

/**
 * The store this process uses.
 *
 * Cached on `globalThis` because Vite re-evaluates server modules on every HMR
 * update in development — without this, each edit would drop all sessions and
 * leak another sweep timer.
 */
const globalForSessionStore = globalThis as typeof globalThis & {
  __sessionStore?: SessionStore;
};

export const sessionStore: SessionStore =
  (globalForSessionStore.__sessionStore ??= createMemorySessionStore());

if (process.env.NODE_ENV === "production") {
  // Logged once per boot so that when someone eventually scales the service
  // and login starts bouncing, the reason is already in the logs.
  logger.warn(
    "Sessions are stored in this process's memory. The service must run as a " +
      "single instance: a second one cannot read the first's sessions, and " +
      "every deploy signs all users out. Implement SessionStore against a " +
      "shared backend before scaling out.",
  );
}
