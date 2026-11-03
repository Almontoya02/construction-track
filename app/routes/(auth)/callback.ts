import authenticator, { ServiceUnavailableError } from "@/lib/auth.server";
import logger from "@/lib/logger.server";
import {
  commitSession,
  destroySession,
  getSession,
  rotateSession,
} from "@/sessions.server";
import { redirect } from "react-router";
import type { Route } from "./+types/callback";

/**
 * Why a sign-in attempt did not produce a session. Surfaced to `/login` as
 * `?error=` so the page can distinguish "your account has no access" from
 * "the service is down" — see `app/routes/(auth)/login.tsx`.
 */
type LoginError = "forbidden" | "unavailable";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const failed = async (error: LoginError) =>
    redirect(`/login?error=${error}`, {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });

  try {
    const loginResponse = await authenticator.authenticate("auth0", request);

    if (
      !loginResponse.user ||
      (loginResponse.user && loginResponse.user.permissions.length === 0) ||
      !loginResponse.tokenId
    ) {
      logger.info(
        { sub: loginResponse.user?.sub },
        "Sign-in rejected: no permissions granted",
      );
      return failed("forbidden");
    }

    // Never reuse the id the browser arrived with — see `rotateSession`.
    // Storing the authenticated user under a visitor-chosen id is a session
    // fixation, and this is the boundary where it would happen.
    const fresh = await rotateSession(session);

    fresh.set("user", loginResponse.user);
    fresh.set("token", loginResponse.tokenId);

    logger.info({ sub: loginResponse.user.sub }, "user logged in");

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(fresh),
      },
    });
  } catch (error) {
    logger.error(error, "Error in callback route");

    return failed(
      error instanceof ServiceUnavailableError ? "unavailable" : "forbidden",
    );
  }
}
