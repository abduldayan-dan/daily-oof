# Build brief: personal task app

Drop this in the repo root and point Claude Code at it.

## What this is

A personal task and project tracker. Each person signs in with Google and sees only their own data. Not a team board, not shared visibility. The point is that everyone has a reliable place for their own work, and later an AI layer can read and act on it.

Primary job: capture a task in under two seconds. Everything else in the interface is secondary to that.

## Stack

- Next.js 15, App Router, TypeScript
- Supabase for Postgres and auth
- `@supabase/ssr` for cookie-based sessions (not the deprecated auth-helpers package)
- Google OAuth via Supabase Auth, PKCE flow
- Plain CSS with custom properties, no Tailwind. The owner is a designer and will edit styles directly.
- Deploy target: Vercel (see Known issues)

No ORM. Use the Supabase client directly. Row Level Security is the security boundary, not application code.

## Setup order

This order matters. Doing it out of sequence is where the hour goes.

1. Create the Supabase project. Note the project ref, URL, and anon key.
2. In Supabase, go to Authentication > Providers > Google. Copy the callback URL it shows you. It looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In the Google Auth Platform console, create an OAuth client, application type "Web application". Paste the Supabase callback URL into Authorized redirect URIs. Add `http://localhost:3000` to Authorized JavaScript origins for local dev, and the Vercel URL once it exists.
4. Paste the Google client ID and secret back into the Supabase Google provider settings and enable it.
5. In Supabase, Authentication > URL Configuration: set Site URL and add both `http://localhost:3000/auth/callback` and the production `/auth/callback` to the redirect allow list. Supabase's docs are explicit that the `redirectTo` URL passed to `signInWithOAuth` must be on the allow list.
6. Run the schema SQL below in the Supabase SQL editor.
7. Set env vars locally and in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nothing else. Never put the service role key in this app.

Reference docs, both current as of this brief:
- Server-side auth for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Sign in with Google: https://supabase.com/docs/guides/auth/social-login/auth-google

Follow the current version of those pages over anything in this brief. Supabase changes the client setup roughly annually and stale tutorials are the main failure mode here.

## Schema

```sql
create extension if not exists "pgcrypto";

create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  color      text not null default 'slate',
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  title        text not null check (char_length(title) between 1 and 500),
  notes        text,
  due_date     date,
  priority     text check (priority in ('high','medium','low')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tasks_user_idx    on public.tasks (user_id, completed_at, due_date);
create index tasks_project_idx on public.tasks (project_id);
create index projects_user_idx on public.projects (user_id);

alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
```

Notes on the model:

- History is `completed_at`, not a separate table. Tasks are never hard deleted on completion, so "what did I finish last month" is a query, not a feature to build later.
- `project_id` is nullable. A task without a project is valid and common. Do not force project selection on capture, it kills the two-second target.
- Deleting a project sets its tasks' `project_id` to null rather than cascading. Losing tasks because someone tidied up their projects is the worst possible bug in a tool people are learning to trust.
- Priority is nullable. Most tasks have no priority and that is fine.

## Routes

```
/                   server component, redirect to /login if no session, else the workspace
/login              Google sign-in only
/auth/callback      route handler, exchanges the code for a session
middleware.ts       refreshes the session cookie on every request
```

Do all task CRUD from the browser client. RLS enforces ownership, so server actions add plumbing without adding safety here.

## Interface

Three regions.

- **Capture.** A single text input at the top, autofocused on load. Enter creates the task. Optional attributes (project, due date, priority) sit in a row beneath it that stays collapsed until used. No modal, ever, for creating a task.
- **List.** The current view's tasks. Sort: overdue first, then by due date, then undated by creation. A task row is checkbox, title, and quiet metadata. Clicking the row expands it in place for notes and edits.
- **Views.** All, Today, Done. Then the project list below, with open counts.

Design direction, as a starting point rather than a constraint:

- One typeface. The list is dense, so pick for small-size legibility and clear numerals, not for personality.
- Priority reads as a thin colour marker on the row edge, not a badge. Badges make every row shout.
- Completing a task is the one moment worth animating, because it is the only feedback that confirms something changed. Nothing else animates.
- Empty states say what to do, not that there is nothing here.

## Known issues to decide on, not silently work around

**Vercel Hobby prohibits commercial use.** Vercel's fair use guidelines restrict Hobby teams to non-commercial personal use, and define commercial usage as any deployment used for the financial gain of anyone involved in producing it, including a paid employee writing the code. If this is a work tool built on work time, Hobby is out of policy from day one. The risk is a takedown after people depend on it, not a bill. Cloudflare Workers is the free swap that does not carry this clause (100K requests/day, D1 gives 5GB storage and 5M reads/writes per month). Same Next.js code, different deploy target.

**Supabase free projects pause after 7 days of inactivity** and need a manual restore from the dashboard. Free tier is 500MB database, 1GB file storage, 50,000 monthly active users, unlimited API requests, 2 active projects. Commercial use is explicitly permitted. Daily use never triggers the pause. If it does trigger, that is a signal about adoption, not a bug to patch with a cron ping.

**Anyone with a Google account can sign in.** This was a deliberate choice to keep it simple. If it should be restricted later, gate on email domain in the callback route and sign out non-matching users.

## Later, not now

Do not build these yet, but do not make them hard:

- An MCP server so Claude can read and write tasks. Supabase already exposes a PostgREST API, so this is a thin wrapper plus a token, not a rebuild. Keep the schema stable and this stays cheap.
- Calendar writes. Needs a separate Google OAuth scope and consent step, so it is its own piece of work.
- Recurring tasks. Adds real complexity to the data model. Only build it if people ask twice.
