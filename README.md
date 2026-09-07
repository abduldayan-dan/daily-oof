# Tasks

A personal task and project tracker. Each person signs in with Google and sees
only their own data. Not a team board, not shared visibility.

Primary job: **capture a task in under two seconds.** Everything else in the
interface is secondary to that.

**Setup instructions are in [SETUP.md](SETUP.md).** Start there.
The original product brief is in [BRIEF.md](BRIEF.md).

## Stack

- Next.js 15, App Router, TypeScript
- Supabase for Postgres and auth, `@supabase/ssr` for cookie sessions
- Google OAuth via Supabase Auth, PKCE flow
- Plain CSS with custom properties, no Tailwind
- Deployed on Netlify

No ORM. The Supabase client is used directly, and **Row Level Security is the
security boundary, not application code.**

## Layout

```
app/
  page.tsx              Server component. Redirects to /login, else the workspace.
  workspace.tsx         Client state container: all task and project CRUD.
  capture.tsx           The input at the top. The most important control here.
  task-row.tsx          One row; expands in place for notes and edits.
  sidebar.tsx           Views (All / Today / Done) and the project list.
  globals.css           Every style in the app. Tokens live in :root.
  login/                Google sign-in.
  auth/callback/        Exchanges the OAuth code for a session, applies the domain gate.
lib/
  supabase/             Browser, server, and middleware clients.
  auth/                 Email domain allow list.
  sort.ts               View selection and sort order.
  dates.ts              Due-date handling. Read the comment before editing.
  types.ts
middleware.ts           Refreshes the session cookie on every request.
supabase/schema.sql     Run once in the Supabase SQL editor.
```

## Editing the design

```bash
npm run dev
```

Then open **[localhost:3000/design-preview](http://localhost:3000/design-preview)**
— the full interface with fixed mock data, no sign-in and no database needed.
Edit CSS, save, watch it reload. Nothing saves there; completing a task rolls
back and shows the error state, which is a useful thing to be able to see on
purpose. The route 404s in production.

All styling is in [`app/globals.css`](app/globals.css). Every value worth
changing is a custom property at the top of the file — edit the tokens rather
than the rules and the whole app moves together.

The visual language is **Nurture by Arbisoft**, defined in [DESIGN.md](DESIGN.md).
The rules that are easiest to break by accident:

- **0px radius on everything interactive.** Buttons, inputs, cards, and the
  checkbox. The checkbox is a square for this reason, not an oversight.
- **2px strokes.** Not 1px, not 3px.
- **Hard offset shadows only** (`4px 4px 0`), and only on hover or focus —
  never at rest. No blur, ever.
- **Lowercase UI copy** for nav, labels, buttons and tags. Intentional.
- **DM Serif for headings, Roboto Mono for everything else.** Do not introduce a
  sans-serif; the mono/serif pairing is the system.

Two constraints carried over from the brief, which DESIGN.md does not cover:

- **Priority is a thin colour bar on the row's leading edge, never a badge.**
  Badges make every row shout, and then none of them do.
- **Only completion animates.** It is the one moment that needs confirmation
  that something changed. If you add a second animation, the first stops meaning
  anything.

### Known deviations

- **No dark theme.** DESIGN.md does not define one, and inventing a dark palette
  would take the product off-brand for anyone whose OS is set to dark. The
  system does sanction an inverted mode (pastel on `brand-navy`), so one could
  be built deliberately — it has not been.
- **Labels are lowercase, not uppercase.** DESIGN.md's typography section says
  labels are "uppercase tracking-wide" while its tone rules say all UI copy is
  lowercase. The tone rule wins here; it is stated more emphatically.
- **The logo is a DM Serif wordmark**, not the leaf mark. See
  [`app/brand.tsx`](app/brand.tsx) for how to drop the real asset in.

## Notes on the data model

- History is `completed_at`, not a separate table. "What did I finish last
  month" is a query, not a feature to build later.
- `project_id` is nullable. A task without a project is valid and common —
  forcing a project at capture time is what kills the two-second target.
- Deleting a project sets its tasks' `project_id` to null rather than cascading.
  Losing tasks because someone tidied up their projects is the worst possible
  bug in a tool people are learning to trust.

## Later, not now

Deliberately not built, but kept cheap to add:

- An MCP server so Claude can read and write tasks. Supabase already exposes a
  PostgREST API, so this is a thin wrapper plus a token. Keep the schema stable
  and it stays cheap.
- Calendar writes. Needs a separate Google OAuth scope and consent step.
- Recurring tasks. Real complexity in the data model. Only if people ask twice.
