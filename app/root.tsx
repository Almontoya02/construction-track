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

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap",
  },
  { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export function meta() {
  return [
    { title: "Obra Clara · Control de obra" },
    {
      name: "description",
      content: "Obras, épicas y tareas con avisos de vencimiento.",
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#1F2A26" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Obra Clara" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** Shown in SPA mode while the app's JavaScript loads. */
export function HydrateFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ground">
      <p className="font-display text-2xl text-ink">Obra Clara</p>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Algo salió mal";
  let details = "Ocurrió un error inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Página no encontrada";
      details = "La página que buscas no existe.";
    } else {
      details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-ground p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{details}</p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-clay px-5 font-semibold text-white hover:bg-clay-dark"
        >
          Volver a mis obras
        </a>
        {stack && (
          <pre className="mt-6 max-h-80 overflow-auto rounded-xl bg-card p-4 text-left text-xs">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
