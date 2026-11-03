import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "@/app.css";
import { ThemeProvider } from "@/contexts/providers/theme-provider";
import { Home } from "lucide-react";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap&display=font-swap",
  },
  {
    rel: "icon",
    type: "image/png",
    href: "/favicon.webp",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="scroll-smooth">
        <ThemeProvider attribute="class">{children}</ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  let is404 = false;

  if (isRouteErrorResponse(error)) {
    is404 = error.status === 404;
    details = is404
      ? "The page you're looking for doesn't exist."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 text-center">
        {/* Large Error Code */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-muted-foreground/30 select-none">
            {is404 ? "404" : "Error"}
          </h1>
          <div className="relative -mt-4">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/20 to-transparent h-px"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            {is404 ? "Whoops!" : "Something went wrong"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {details}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </a>
        </div>

        {/* Development Stack Trace */}
        {stack && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-4 select-none">
              Show technical details
            </summary>
            <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-auto">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                <code>{stack}</code>
              </pre>
            </div>
          </details>
        )}

        {/* Decorative Elements */}
        <div className="mt-16 text-xs text-muted-foreground/60">
          <p>Need help? Contact our support team.</p>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
