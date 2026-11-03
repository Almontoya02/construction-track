import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import authenticator from "@/lib/auth.server";
import { cn } from "@/lib/utils";
import { AlertCircleIcon } from "lucide-react";
import { Form, useSearchParams } from "react-router";
import type { Route } from "./+types/login";

export function meta() {
  return [
    { title: "Login" },
    { name: "description", content: "Login to your account" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  return await authenticator.authenticate("auth0", request);
}

/**
 * Messages for the `?error=` codes set by `app/routes/(auth)/callback.ts`.
 * An outage and a missing grant are not the user's problem in the same way,
 * so they must not read the same.
 */
const LOGIN_ERRORS = {
  forbidden: {
    title: "You are not authorized",
    description:
      "Your account signed in successfully, but no permissions have been granted to it. Ask an administrator for access.",
  },
  unavailable: {
    title: "Sign-in is temporarily unavailable",
    description:
      "We couldn't reach the service needed to complete sign-in. This is not a problem with your account — please try again in a few minutes.",
  },
  expired: {
    title: "Your session expired",
    description:
      "You were signed out because your session is no longer valid. Sign in again to pick up where you left off.",
  },
} as const;

export default function Login() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");
  // Unrecognised codes (including the legacy `?error=true`) fall back to the
  // authorization message, which is what they used to mean. `Object.hasOwn`
  // rather than a plain lookup: `?error=constructor` would otherwise resolve
  // to an inherited property and render an empty alert.
  const error = errorCode
    ? Object.hasOwn(LOGIN_ERRORS, errorCode)
      ? LOGIN_ERRORS[errorCode as keyof typeof LOGIN_ERRORS]
      : LOGIN_ERRORS.forbidden
    : null;
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <img
              src="/iluma-dark.webp"
              className="hidden dark:block"
              width={100}
              alt="Iluma"
              loading="lazy"
            />
            <img
              src="/iluma-white.webp"
              width={100}
              className="dark:hidden"
              alt="Iluma"
              loading="lazy"
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Form className="flex flex-col gap-8" method="post">
              <FieldGroup>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      strokeWidth={2}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-muted-foreground text-balance leading-relaxed">
                    Sign in to your account to continue
                  </p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription>{error.description}</AlertDescription>
                  </Alert>
                )}
                <div
                  className={cn({
                    "mt-8": !error,
                  })}
                >
                  <Button type="submit" size="lg" className="w-full">
                    <svg
                      className="mr-3 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                      />
                    </svg>
                    Sign in with SSO
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    By signing in, you agree to our{" "}
                    <a
                      href="#"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </FieldGroup>
            </Form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/login-background.webp"
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
}
