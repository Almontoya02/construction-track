-- Obra Clara: run once in Supabase → SQL Editor → New query → Run.
--
-- Row level security is ON with no policies, so the public (anon) key can read
-- nothing. Only the Vercel /api functions, which use the service-role key,
-- touch these tables.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  place text not null default '',
  type text not null default '',
  color text not null default '#7A8B6F',
  created_at timestamptz not null default now()
);

create table if not exists public.epics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  color text not null default '#7A8B6F',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists epics_project_idx on public.epics (project_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  epic_id uuid not null references public.epics (id) on delete cascade,
  title text not null,
  due_date date not null,
  assignee text not null default '',
  tag text not null default '',
  status text not null default 'pendiente'
    check (status in ('pendiente', 'proceso', 'hecho')),
  created_at timestamptz not null default now()
);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_epic_idx on public.tasks (epic_id);
create index if not exists tasks_due_idx on public.tasks (due_date) where status <> 'hecho';

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.epics enable row level security;
alter table public.tasks enable row level security;
alter table public.push_subscriptions enable row level security;
