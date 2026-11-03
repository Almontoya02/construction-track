import logger from "@/lib/logger.server";
import type { Permission } from "@/lib/permissions";
import type { AuthUser } from "@/types/auth";
import { ManagementClient, UserInfoClient } from "auth0";
import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { destroySession, getAuthSession, getSession } from "@/sessions.server";

/**
 * Raised when an upstream this app depends on to complete a login could not
 * be reached: our backend (network failure or 5xx) or the Auth0 Management
 * API used to read permissions.
 *
 * Distinguished from an ordinary failure so the login page can tell the user
 * the service is temporarily down instead of implying their account lacks
 * access — the two used to be indistinguishable, and users reported outages
 * as "it says I'm not authorized".
 */
export class ServiceUnavailableError extends Error {
  readonly name = "ServiceUnavailableError";
}

/**
 * The shape of the login data stored in the session after successful authentication.
 * Contains both user information and the access token for API calls.
 */
type LoginType = {
  user: AuthUser;
  /** The Auth0 **access token** used for API authentication. It must be the access token, not the ID token. */
  tokenId: string;
};

/**
 * Main authenticator instance using Remix Auth for handling authentication flows.
 * Configured with Auth0 strategy for OAuth-based authentication.
 *
 * @example
 * ```tsx
 * // In a loader or action
 * const loginData = await authenticator.authenticate("auth0", request);
 * const user = loginData.user;
 * ```
 */
const authenticator = new Authenticator<LoginType>();
export const auth0Strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    redirectURI: `${process.env.BASE_URL}/auth/callback`,
    audience: process.env.AUTH0_AUDIENCE!,
    scopes: ["openid", "email", "profile"],
  },
  /**
   * Verify callback executed after successful Auth0 authentication.
   * This function processes the Auth0 tokens and user profile to create
   * the session data that will be stored and available throughout the app.
   *
   * @param tokens - Auth0 tokens object containing access, ID, and refresh tokens
   * @returns Promise resolving to LoginType object for session storage
   */
  async ({ tokens }) => {
    // Fetch detailed user profile using the access token
    const userInfo = await getUserInfo(tokens.accessToken());

    // Retrieve user's permissions from Auth0 Management API.
    //
    // Read once and stored in the session: revoking access in Auth0 does not
    // take effect until the session expires, up to SESSION_MAX_AGE (1 day).
    // Accepted deliberately — re-reading would put a Management API call on
    // every loader — but it means these checks guard the UI only. The backend
    // must enforce authorization itself. See the README, "Route Protection".
    const permissions = await getUserPermissions(userInfo.sub);

    // Extract the access token for API authentication
    const tokenId = tokens.accessToken();

    // Tell the backend about the login so it can create/update its own user
    // record. Skipped entirely when BACKEND_LOGIN_PATH is unset, so the
    // template runs against no backend at all.
    //
    // This runs before the caller checks whether the user has any permissions,
    // so a record is created even for users who are then turned away —
    // deliberately, so an administrator has someone to grant access to.
    const backendUser = await loginToBackend({
      token: tokenId,
      email: userInfo.email,
      name: userInfo.name,
    });

    // Return the complete login data for session storage
    return {
      user: {
        ...userInfo,
        permissions,
        userId: backendUser?.userId,
      },
      tokenId,
    } as LoginType;
  },
);

// Configure Auth0 OAuth strategy
authenticator.use(auth0Strategy);

/**
 * Retrieves user permissions from Auth0 Management API.
 * Handles pagination to ensure all permissions are fetched and filters
 * permissions based on the configured prefix to scope to the application.
 *
 * Throws rather than degrading to "no permissions" on failure. Returning an
 * empty array would send the user to `/login?error=forbidden`, which reads as
 * "your account has no access" — indistinguishable from a genuine denial and
 * badly misleading during an Auth0 outage. Login is blocked either way, so
 * throwing costs no availability and makes the cause diagnosable.
 *
 * @param userId - The Auth0 user ID (sub claim from JWT)
 * @returns Promise resolving to array of permission names
 * @throws {ServiceUnavailableError} When the Management API call fails
 *
 * @example
 * ```ts
 * const permissions = await getUserPermissions("auth0|123456789");
 * // Returns: ["app:read:users", "app:write:posts"]
 * ```
 */
const getUserPermissions = async (userId: string) => {
  // Initialize Auth0 Management API client with machine-to-machine credentials
  const management = new ManagementClient({
    clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID!,
    clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!,
    audience: process.env.AUTH0_MANAGEMENT_AUDIENCE!,
    domain: process.env.AUTH0_DOMAIN!,
  });

  try {
    // Fetch first page of user permissions
    let response = await management.users.permissions.list(userId);
    let permissions = response.data;

    // Handle pagination - Auth0 may split permissions across multiple pages
    while (response.hasNextPage()) {
      response = await response.getNextPage();
      permissions = permissions.concat(response.data);
    }

    // Filter permissions by application prefix and extract permission names.
    // `flatMap` rather than filter+map so the result is `string[]` — Auth0
    // types `permission_name` as optional, and a filter doesn't narrow it.
    return permissions.flatMap((p) =>
      p.permission_name?.startsWith(process.env.PERMISSIONS_PREFIX ?? "")
        ? [p.permission_name]
        : [],
    );
  } catch (ex) {
    logger.error(ex, "Failed to retrieve user permissions from Auth0");
    throw new ServiceUnavailableError(
      "Could not read permissions from the Auth0 Management API",
    );
  }
};

/**
 * Resolves an endpoint path against `BACKEND_URL`.
 *
 * Plain `new URL(path, base)` treats a leading slash as "go to the origin
 * root", so with `BACKEND_URL=https://api.example.com/api` the call
 * `new URL("/todos", base)` silently yields `https://api.example.com/todos`
 * and drops the `/api` prefix. Normalising both sides means `"/todos"` and
 * `"todos"` resolve identically and a base path is always preserved.
 *
 * @param path - API endpoint path, with or without a leading slash
 * @returns Absolute URL to call
 */
function backendUrl(path: string): URL {
  const base = process.env.BACKEND_URL;

  if (!base) throw new Error("BACKEND_URL is not configured");

  return new URL(
    path.replace(/^\/+/, ""),
    base.endsWith("/") ? base : `${base}/`,
  );
}

/**
 * @param url - API endpoint path (relative to BACKEND_URL)
 * @param init - Fetch configuration; pass an `Authorization` header here for
 * authenticated calls, or omit it for anonymous ones like login
 */
async function backendFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const uri = backendUrl(url);

  try {
    return await fetch(uri, init);
  } catch (ex) {
    logger.error(ex, "Network error while calling backend");
    throw new ServiceUnavailableError("Backend request failed");
  }
}

/**
 * Endpoint to notify when a user signs in, so the backend can create or update
 * its own user record. Configurable because the path differs per backend:
 *
 * - `iluma.base-api-python` → `/api/auth/login`
 * - the .NET backend        → `/User/login`
 *
 * Leave `BACKEND_LOGIN_PATH` unset to skip the sync entirely, which is what
 * lets this template run against no backend at all.
 */
const BACKEND_LOGIN_PATH = process.env.BACKEND_LOGIN_PATH;

/**
 * What the login sync sends.
 *
 * Deliberately a superset of what either backend needs, so one body serves
 * both: the Python `LoginModel` requires all three fields and 422s without
 * them, while the .NET endpoint only reads `token` and ignores the rest.
 */
type BackendLoginRequest = {
  /** Auth0 access token. The backend resolves the user by verifying it. */
  token: string;
  email: string;
  name: string;
};

/**
 * The part of the login response this app reads.
 *
 * Everything is optional because the two backends disagree on shape, and the
 * template must not require either. Notably `userId` is an int on the Python
 * backend (`user_id` on `auth.user`) and a uuid string on the .NET one, hence
 * the union. Both also return `permissions`, which this app ignores in favour
 * of the Auth0 Management API — see {@link getUserPermissions}.
 */
type BackendLoginResponse = {
  userId?: string | number;
};

/**
 * Notifies the backend of a successful Auth0 login. No-op when
 * `BACKEND_LOGIN_PATH` is unset.
 *
 * The call is anonymous — there is no session yet — so the Auth0 access token
 * travels in the body and the backend verifies it against Auth0 itself.
 *
 * Errors raised here propagate cleanly: `remix-auth` awaits `verify` without a
 * try/catch, so `(auth)/callback.ts` can still tell a
 * {@link ServiceUnavailableError} apart from a denial and word the login page
 * accordingly.
 *
 * @param credentials - Access token plus the profile fields the backend needs
 * @returns The backend's user record, or `null` when the sync is disabled
 * @throws {ServiceUnavailableError} On a network failure or a 5xx response
 * @throws {Error} On a 4xx response, i.e. the backend refused this user
 */
const loginToBackend = async (
  credentials: BackendLoginRequest,
): Promise<BackendLoginResponse | null> => {
  if (!BACKEND_LOGIN_PATH) return null;

  const response = await backendFetch(BACKEND_LOGIN_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    // Capture the body too — a bare status turns every login failure into a
    // guessing game, and this is the one place the backend explains itself.
    const body = await response.text().catch(() => "<unreadable>");

    logger.error(
      {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body,
      },
      "Backend rejected login request",
    );

    // A 5xx means "try again later"; a 4xx means this user is not welcome.
    // The login page words those two very differently.
    if (response.status >= 500) {
      throw new ServiceUnavailableError(
        `Backend login failed with status ${response.status}`,
      );
    }

    throw new Error(`Backend login failed with status ${response.status}`);
  }

  // A backend may legitimately answer 200 with no body.
  return (await response
    .json()
    .catch(() => null)) as BackendLoginResponse | null;
};

/**
 * Fetches detailed user profile information from Auth0 UserInfo endpoint.
 * Uses the access token to retrieve the user's profile data including
 * email, name, picture, and other profile attributes.
 *
 * @param accessToken - OAuth2 access token from Auth0 authentication
 * @returns Promise resolving to user profile data
 *
 * @example
 * ```ts
 * const userInfo = await getUserInfo(accessToken);
 * // Returns: { sub: "auth0|123", email: "user@example.com", name: "John Doe", ... }
 * ```
 */
const getUserInfo = async (accessToken: string) => {
  // Initialize UserInfo client for profile data retrieval
  const userInfo = new UserInfoClient({
    domain: process.env.AUTH0_DOMAIN!,
  });

  // Fetch user profile using the access token
  const userProfile = await userInfo.getUserInfo(accessToken);
  return userProfile.data;
};

/**
 * Default export of the configured authenticator instance.
 * Use this in route loaders and actions to handle authentication.
 *
 * Available methods:
 * - `authenticate(strategy, request)` - Authenticate a request
 * - `isAuthenticated(request)` - Check if request is authenticated
 * - `logout(request, options)` - Log out the current user
 *
 * @example
 * ```tsx
 * // In a route loader
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const loginData = await authenticator.isAuthenticated(request, {
 *     failureRedirect: "/login",
 *   });
 *   return json({ user: loginData.user });
 * }
 *
 * // In an auth route action
 * export async function action({ request }: ActionFunctionArgs) {
 *   return await authenticator.authenticate("auth0", request, {
 *     successRedirect: "/dashboard",
 *     failureRedirect: "/login",
 *   });
 * }
 * ```
 */
export default authenticator;

/**
 * Standard error response structure for API communication.
 * Used to maintain consistent error formatting across the application.
 */
export type ErrorResponse = {
  /** Human-readable error message describing what went wrong */
  message: string;
};

/**
 * Generic response wrapper for API calls that includes both data and error states.
 * Provides a consistent structure for handling successful responses and errors.
 *
 * @template T - The type of data expected in successful responses
 *
 * @example
 * ```ts
 * const response: AppResponse<User[]> = await fetcher("/api/users");
 * if (response.error) {
 *   console.error("API Error:", response.error);
 * } else {
 *   console.log("Users:", response.data);
 * }
 * ```
 */
export type AppResponse<T> = {
  /** The response data on success, null on error or empty responses */
  data: T | null;
  /** Error message if the request failed, undefined on success */
  error?: string;
};

/**
 * Type-safe authenticated API client with one method per HTTP verb. `post`
 * and `put` take a plain body value and take care of JSON-encoding it and
 * setting `Content-Type`, so callers never repeat that boilerplate.
 */
export type Fetcher = {
  get<TData = unknown>(
    url: string,
    init?: RequestInit,
  ): Promise<AppResponse<TData>>;
  post<TData = unknown>(
    url: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<AppResponse<TData>>;
  put<TData = unknown>(
    url: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<AppResponse<TData>>;
  delete<TData = unknown>(
    url: string,
    init?: RequestInit,
  ): Promise<AppResponse<TData>>;
};

/**
 * Complete authentication context containing user data, permissions, and token.
 * Used to optimize session data retrieval by fetching all auth data in a single operation.
 */
type AuthContext = {
  /** Authenticated user profile */
  user: AuthUser;
  /** User's permissions array */
  permissions: string[];
  /** Authentication token for API calls */
  token: string;
};

/**
 * Retrieves all authentication context data from a single session read.
 *
 * The previous `Promise.all` over three separate getters read the session
 * three times per loader, and the app layout plus the page loader each call
 * this. Cheap against the in-process store, but it scales badly with it.
 *
 * @param request - The incoming HTTP request object
 * @returns Promise resolving to complete authentication context
 *
 * @example
 * ```ts
 * const { user, permissions, token } = await getAuthContext(request);
 * ```
 */
async function getAuthContext(request: Request): Promise<AuthContext> {
  return getAuthSession(request);
}

/**
 * Creates an authenticated API fetcher with automatic token injection and error handling.
 * This factory function eliminates code duplication between loader and action wrappers.
 *
 * @param token - Authentication token to include in requests
 * @param cookieHeader - The request's `Cookie` header, needed to end the
 * session when the backend rejects the token
 * @returns Configured fetcher function with authentication and error handling
 *
 * @example
 * ```ts
 * const fetcher = createAuthenticatedFetcher(authToken, cookieHeader);
 * const response = await fetcher.get<User[]>("/api/users");
 * ```
 */
function createAuthenticatedFetcher(
  token: string,
  cookieHeader: string | null,
): Fetcher {
  /**
   * Authenticated API request that automatically includes the user's token
   * in the Authorization header and handles common response patterns.
   * Every `Fetcher` method funnels through this.
   *
   * @param url - API endpoint URL (relative to BACKEND_URL)
   * @param init - Optional fetch configuration
   * @returns Promise resolving to AppResponse with typed data
   * @throws {Response} Redirect to `/login` when the backend returns 401
   */
  const request = async <TData = unknown>(
    url: string,
    init?: RequestInit,
  ): Promise<AppResponse<TData>> => {
    // Optimize header merging - create headers object once
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    };

    try {
      const response = await backendFetch(url, { ...init, headers });

      // The session outlived the token it carries. Auth0 access tokens expire
      // on their own schedule and no refresh token is requested (the strategy
      // asks for `openid email profile`, not `offline_access`), so this is
      // reachable well before the session's own 1-day expiry. Without this
      // branch the user sits on a page of errors with no way back: every
      // loader would keep returning `{ error }` until the session lapsed.
      if (response.status === 401) {
        logger.info("Backend rejected the access token; ending the session");

        const session = await getSession(cookieHeader);
        throw redirect("/login?error=expired", {
          headers: { "Set-Cookie": await destroySession(session) },
        });
      }

      // Handle 204 No Content responses
      if (response.status === 204) return { data: null };

      if (response.ok) {
        try {
          return { data: (await response.json()) as TData };
        } catch {
          // Handle responses that aren't valid JSON
          return { data: null };
        }
      } else {
        // Handle API error responses
        try {
          const error = (await response.json()) as ErrorResponse;
          if (error?.message) {
            return { data: null, error: error.message };
          }
        } catch {
          // Handle non-JSON error responses
          return {
            data: null,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      }
    } catch (error) {
      // A thrown Response is React Router control flow — the 401 redirect
      // above, most likely. Swallowing it here would turn the redirect into a
      // generic error message and strand the user.
      if (error instanceof Response) throw error;

      // Handle network errors or other fetch failures
      logger.error(error, "Network error in authenticated fetch");
      return { data: null, error: "Ha ocurrido un error inesperado" };
    }

    // Fallback return in case none of the above branches are taken
    return { data: null, error: "Ha ocurrido un error inesperado" };
  };

  /**
   * Builds a verb-specific request that JSON-encodes `body` and sets
   * `Content-Type` automatically, so `post`/`put` callers only pass data.
   */
  const withJsonBody =
    (method: "POST" | "PUT") =>
    <TData = unknown>(
      url: string,
      body?: unknown,
      init?: RequestInit,
    ): Promise<AppResponse<TData>> =>
      request<TData>(url, {
        ...init,
        method,
        headers: { "Content-Type": "application/json", ...init?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

  return {
    get: (url, init) => request(url, init),
    post: withJsonBody("POST"),
    put: withJsonBody("PUT"),
    delete: (url, init) => request(url, { ...init, method: "DELETE" }),
  };
}

/**
 * Higher-order function that wraps a loader with authentication checks.
 * Automatically retrieves user information and permissions from the session
 * and passes them to the wrapped loader function.
 *
 * @template T - The return type of the loader function
 * @param loaderFnc - The loader function to wrap with authentication
 * @returns A new loader function with automatic auth handling
 *
 * @example
 * ```ts
 * export const loader = AuthorizedLoader(
 *   async (args, user, permissions) => {
 *     // Access authenticated user and permissions here
 *     return json({
 *       welcomeMessage: `Hello ${user.name}!`,
 *       canEdit: permissions.includes("app:edit:content")
 *     });
 *   }
 * );
 * ```
 */
export function AuthorizedLoader<T>(
  loaderFnc: (
    args: LoaderFunctionArgs,
    user: AuthUser,
    permissions: string[],
  ) => Promise<T>,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    // Optimized: fetch user and permissions in parallel
    const { user, permissions } = await getAuthContext(args.request);
    return loaderFnc(args, user, permissions);
  };
}

/**
 * Higher-order function that wraps a loader with authentication, permission checking,
 * and provides an authenticated API fetcher. This is the most comprehensive auth wrapper
 * for loaders that need to make API calls.
 *
 * @template T - The return type of the loader function
 * @param permission - Required permission string; empty string to skip permission check
 * @param loaderFnc - The loader function to wrap with auth and fetcher capabilities
 * @returns A new loader function with automatic auth handling and API fetcher
 *
 * @throws {Response} Redirects to "/" with 302 status if user lacks required permission
 *
 * @example
 * ```ts
 * export const loader = AuthorizedLoaderWithFetcher(
 *   "app:read:users", // Required permission
 *   async (args, fetcher, user, permissions) => {
 *     // Make authenticated API calls using the fetcher
 *     const usersResponse = await fetcher<User[]>("/api/users");
 *
 *     if (usersResponse.error) {
 *       throw new Error(usersResponse.error);
 *     }
 *
 *     return json({
 *       users: usersResponse.data,
 *       currentUser: user
 *     });
 *   }
 * );
 * ```
 */
export function AuthorizedLoaderWithFetcher<T>(
  permission: Permission | "",
  loaderFnc: (
    args: LoaderFunctionArgs,
    fetcher: Fetcher,
    user: AuthUser,
    permissions: string[],
  ) => Promise<T>,
) {
  return async (args: LoaderFunctionArgs): Promise<T> => {
    // Optimized: fetch all auth context in one operation
    const { user, permissions, token } = await getAuthContext(args.request);

    // Check if user has required permission (skip check if permission is empty string)
    if (permission !== "" && !permissions.includes(permission)) {
      throw redirect("/unauthorized", { status: 302 });
    }

    // Create optimized fetcher using factory function
    const fetcher = createAuthenticatedFetcher(
      token,
      args.request.headers.get("Cookie"),
    );

    return loaderFnc(args, fetcher, user, permissions);
  };
}

/**
 * Higher-order function that wraps an action with authentication and provides
 * an authenticated API fetcher for making backend requests. Ideal for form
 * submissions and other user interactions that require API calls.
 *
 * @template T - The return type of the action function
 * @param actionFnc - The action function to wrap with auth and fetcher capabilities
 * @returns A new action function with automatic auth handling and API fetcher
 *
 * @example
 * ```ts
 * export const action = AuthorizedActionWithFetcher(
 *   async (args, user, fetcher) => {
 *     const formData = await args.request.formData();
 *     const userData = {
 *       name: formData.get("name"),
 *       email: formData.get("email")
 *     };
 *
 *     // Make authenticated API call to update user
 *     const response = await fetcher<User>("/api/users", {
 *       method: "PUT",
 *       body: JSON.stringify(userData),
 *       headers: { "Content-Type": "application/json" }
 *     });
 *
 *     if (response.error) {
 *       return json({ error: response.error }, { status: 400 });
 *     }
 *
 *     return redirect("/profile");
 *   }
 * );
 * ```
 */
export function AuthorizedActionWithFetcher<T>(
  permission: Permission | "",
  actionFnc: (
    args: ActionFunctionArgs,
    fetcher: Fetcher,
    user: AuthUser,
    permissions: string[],
  ) => Promise<T>,
) {
  return async (args: ActionFunctionArgs): Promise<T> => {
    // Optimized: fetch all auth context in one operation
    const { user, permissions, token } = await getAuthContext(args.request);

    // Check if user has required permission (skip check if permission is empty string)
    if (permission !== "" && !permissions.includes(permission)) {
      throw redirect("/unauthorized", { status: 302 });
    }

    // Create optimized fetcher using factory function
    const fetcher = createAuthenticatedFetcher(
      token,
      args.request.headers.get("Cookie"),
    );

    return actionFnc(args, fetcher, user, permissions);
  };
}
