/**
 * Auth0 permission strings this app enforces, grouped by domain.
 *
 * Declared once so the sidebar entry and the route loader that guards the same
 * section can't drift apart — a mismatch would show a menu link that bounces
 * the user straight to /unauthorized.
 *
 * Only add a permission here once something actually enforces it. Auth0 owns
 * the full catalog; mirroring all of it would create a second list that goes
 * stale without anything failing.
 */
export const PERMISSIONS = {
  clients: {
    create: "ae:create:clients",
  },
} as const;

type Permissions = typeof PERMISSIONS;

/**
 * Union of every permission string declared above, so a typo is a compile
 * error instead of a silent redirect to /unauthorized.
 */
export type Permission = {
  [Domain in keyof Permissions]: Permissions[Domain][keyof Permissions[Domain]];
}[keyof Permissions];
