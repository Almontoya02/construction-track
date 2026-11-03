/**
 * @fileoverview Authentication type definitions for Auth0 integration
 *
 * This module contains TypeScript type definitions for authentication-related
 * data structures used throughout the application. These types ensure type
 * safety when working with Auth0 responses and user data.
 */

/**
 * Raw Auth0 token response structure returned from the OAuth flow.
 * This represents the standard OAuth 2.0 token response format.
 *
 * @see {@link https://auth0.com/docs/api/authentication#authorization-code-flow Auth0 Authorization Code Flow}
 *
 * @example
 * ```ts
 * const tokenResponse: Auth0Response = {
 *   access_token: "eyJhbGciOiJSUzI1NiIs...",
 *   expires_in: 86400,
 *   id_token: "eyJhbGciOiJSUzI1NiIs...",
 *   token_type: "Bearer"
 * };
 * ```
 */
export type Auth0Response = {
  /** OAuth 2.0 access token for API authentication */
  access_token: string;
  /** Token expiration time in seconds from issuance */
  expires_in: number;
  /** OpenID Connect ID token containing user identity claims */
  id_token: string;
  /** Token type, typically "Bearer" for OAuth 2.0 */
  token_type: string;
};

/**
 * Authenticated user profile with application-specific permissions.
 * Combines Auth0 user profile data with role-based permissions for
 * comprehensive user session management.
 *
 * This type represents the user object stored in the session after
 * successful authentication and permission resolution.
 *
 * @see {@link https://auth0.com/docs/api/authentication#user-profile Auth0 User Profile}
 *
 * @example
 * ```ts
 * const user: AuthUser = {
 *   sub: "auth0|507f1f77bcf86cd799439011",
 *   name: "John Doe",
 *   nickname: "johndoe",
 *   given_name: "John",
 *   family_name: "Doe",
 *   picture: "https://secure.gravatar.com/avatar/...",
 *   updated_at: "2023-12-01T10:00:00.000Z",
 *   email: "john.doe@example.com",
 *   permissions: ["app:read:users", "app:write:posts"]
 * };
 * ```
 */
export type AuthUser = {
  /**
   * Unique user identifier from Auth0 (subject claim).
   * Format: "{connection}|{user_id}" (e.g., "auth0|123456789")
   */
  sub: string;

  /**
   * Full display name of the user.
   * Typically combines given_name and family_name
   */
  name: string;

  /**
   * Preferred username or handle.
   * Often used for @mentions or short identifiers
   */
  nickname: string;

  /**
   * User's first name or given name.
   * May be empty if not provided by the identity provider
   */
  given_name: string;

  /**
   * User's last name or family name.
   * May be empty if not provided by the identity provider
   */
  family_name: string;

  /**
   * URL to the user's profile picture or avatar.
   * Provided by the identity provider (Google, etc.)
   */
  picture: string;

  /**
   * ISO 8601 timestamp of when the user profile was last updated.
   * Format: "YYYY-MM-DDTHH:mm:ss.sssZ"
   */
  updated_at: string;

  /**
   * Primary email address of the user.
   * Used for notifications and account recovery
   */
  email: string;

  /**
   * Array of permission strings assigned to the user.
   * Permissions follow the format: "{prefix}:{action}:{resource}"
   *
   * @example
   * ```ts
   * permissions: [
   *   "app:read:users",    // Can view user data
   *   "app:write:posts",   // Can create/edit posts
   *   "app:admin:settings" // Can modify app settings
   * ]
   * ```
   */
  permissions: string[];

  /**
   * Identifier of the user in your own backend, as opposed to
   * {@link AuthUser.sub}, which identifies them in Auth0.
   *
   * Populated from the login-sync response when `BACKEND_LOGIN_PATH` is
   * configured, and `undefined` otherwise — the template must work with no
   * backend at all, so never assume it is set.
   *
   * The union is not laziness: it is an int on `iluma.base-api-python`
   * (`user_id` on `auth.user`) and a uuid string on the .NET backend.
   *
   * @example 42
   * @example "3f2b1c8e-7a4d-4e19-9c3f-0b6d8a5e1f27"
   */
  userId?: string | number;
};
