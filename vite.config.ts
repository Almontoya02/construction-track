/// <reference types="vitest/config" />
import { existsSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Serves the Vercel functions in /api during `pnpm dev`, so the app works
 * locally without `vercel dev`. `/api/tasks` → `api/tasks.ts`, calling the
 * export named after the HTTP method, exactly as Vercel does.
 */
function vercelApi(): Plugin {
  return {
    name: "vercel-api-dev",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const file = path.join(process.cwd(), "api", `${url.pathname}.ts`);
        if (!existsSync(file)) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end();
          }
          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const request = new Request(`http://localhost/api${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
            // @ts-expect-error Node needs this for streamed request bodies.
            duplex: "half",
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make .env visible to the /api handlers (process.env), as Vercel does.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      tailwindcss(),
      !process.env.VITEST && reactRouter(),
      !process.env.VITEST && vercelApi(),
      tsconfigPaths(),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./test/setup.ts"],
    },
  };
});
