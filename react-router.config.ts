import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: the build is static files served by Vercel, and the data lives
  // behind the Vercel functions in /api (see vite.config.ts for local dev).
  ssr: false,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
