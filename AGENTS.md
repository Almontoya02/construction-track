# AGENTS.md

Guide for AI assistants working on **Obra Clara**, a personal construction-site
tracker (projects → epics → tasks, due-date colors, daily phone reminders). The
UI is in Spanish (Colombia); keep all user-facing copy in Spanish.

## Stack

- **React Router 8, SPA mode** (`ssr: false`). No loaders/actions: data comes
  from `/api` through `app/contexts/obras-context.tsx`.
- **Vercel functions** in `api/` (Web-standard `export const GET/POST/…`
  handlers). `vite.config.ts` mounts them during `pnpm dev`.
- **Supabase Postgres**, server-side only (`server/supabase.ts`, service-role
  key). Schema in `supabase/schema.sql`; RLS on with no policies.
- **Web Push** via `web-push` (`server/push.ts`), service worker `public/sw.js`,
  daily digest from Vercel Cron → `api/cron/reminders.ts`.
- Tailwind 4 with the palette in `app/app.css` (`ink`, `ground`, `column`,
  `clay`, `font-display`), shadcn/ui primitives in `app/components/ui`.
- Vitest, Prettier, Husky (pre-commit runs typecheck + tests), commitlint
  (conventional commits).

## Rules

- `api/`, `server/` and `app/lib/due.ts` / `app/lib/types.ts` are bundled by
  Vercel without the tsconfig alias: use **relative imports with a `.js`
  extension** there (`../server/http.js`), never `@/`. Vercel runs them as
  plain Node ES modules, which crash at load on extensionless imports.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `VAPID_PRIVATE_KEY` to the
  browser; only `VITE_`-prefixed variables reach the client.
- Validate every API body with Zod (`server/http.ts` → `readBody`).
- Date logic lives in `app/lib/due.ts` and uses Bogotá time (`todayISO`); it is
  shared by the UI and the reminder cron, and covered by `test/due.test.ts`.
- Keep touch targets ≥ 44 px and the
  layout usable at 375 px wide.
- Offline-first: every mutation is an `Op` in `app/lib/offline.ts`, applied
  locally and queued in a localStorage outbox that `obras-context` flushes in
  order. New entities get client-generated UUIDs; create endpoints must stay
  idempotent (`upsert … ignoreDuplicates`) and constraint errors must be 4xx
  (`dbFail`) so a bad op never blocks the queue. Don't make a mutation wait on
  the network.
- `public/sw.js` precaches the build via `scripts/build-sw.mjs` (part of
  `pnpm build`); it never caches `/api`.
- No login by design (single user). Don't add auth unless asked.

## Layout

```
app/routes/layout.tsx    shell: sidebar / mobile top bar, header, providers
app/routes/home.tsx      projects, stats, notification banner, due list
app/routes/project.tsx   board / list by epic, filters, search
app/components/obra/     domain components (task cards, dialogs, alerts)
app/lib/obras.ts         derived views: stats, alerts, filters, tag colors
app/lib/push.ts          browser push subscription
```
