-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- Safe to re-run: every statement guards against already existing.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  color      text not null default 'slate',
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Nullable on purpose. A task with no project is valid and common; forcing a
  -- project at capture time is what kills the two-second target.
  project_id   uuid references public.projects(id) on delete set null,
  title        text not null check (char_length(title) between 1 and 500),
  notes        text,
  due_date     date,
  priority     text check (priority in ('high','medium','low')),
  -- History lives here, not in a separate table. "What did I finish last month"
  -- is therefore a query, not a feature to build later.
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists tasks_user_idx    on public.tasks (user_id, completed_at, due_date);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists projects_user_idx on public.projects (user_id);

-- RLS is the security boundary for this app, not application code. Every query
-- runs from the browser with the publishable key, so these policies are the
-- only thing standing between one person's tasks and another's.
alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
