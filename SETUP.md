# Setup

## Current state

Supabase project **`lvahxlekhanratmbgcug`** is live and configured:

- [x] 1. Supabase project created
- [x] 2. Schema run — `tasks` and `projects` exist, RLS verified as blocking
      anonymous reads *and* writes
- [x] 3–5. Google OAuth client created (consent screen **Internal**, so Google
      itself refuses non-`@arbisoft.com` accounts) and enabled in Supabase
- [x] 6. `ALLOWED_EMAIL_DOMAINS=arbisoft.com`
- [x] 7. Redirect allow list configured for `http://localhost:3000`
- [ ] 9. Deploy to Netlify
- [ ] 10. Add the production URL to Google and Supabase

Steps 1–8 below are kept for reference, and for anyone rebuilding this from
scratch. Jump to step 9 to deploy.

**Housekeeping:** disable the **Email** provider in Supabase if it is still on.
The app only uses Google, and leaving email signup enabled lets anyone holding
the (public) publishable key create accounts in the project. RLS means they see
nothing, but there is no reason to allow it.

---

Roughly 30 minutes. **Do these in order.** Steps 3 and 4 reference values
produced by steps 1 and 2, and doing them out of sequence is where the time goes.

There is one genuine chicken-and-egg problem: Google and Supabase both need your
production URL, which does not exist until you deploy. So local setup comes
first, deploy second, then you come back and add the production URLs in step 10.

---

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick any name and a strong database password. Choose the region closest to
   your team.
3. When it finishes provisioning, go to **Project Settings → API Keys** and note:
   - **Project URL** — `https://<project-ref>.supabase.co`
   - **Publishable key** — starts with `sb_publishable_`

> If your project only shows an **anon** key (a long `eyJ...` JWT), that is the
> older format and still works. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your env
> file instead. Supabase is retiring these by the end of 2026.

**Never copy the `service_role` or secret key into this app.** It bypasses Row
Level Security, and everything here runs where a browser can reach it.

## 2. Create the tables

Open **SQL Editor → New query**, paste the entire contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it.

It is safe to re-run if you need to.

Confirm it worked: **Table Editor** should now show `tasks` and `projects`, each
with a green **RLS enabled** badge. If that badge is missing, stop and fix it —
without RLS, every user can read every other user's tasks.

## 3. Copy the Supabase callback URL

Go to **Authentication → Sign In / Providers → Google**. Do not enable it yet.

Copy the **Callback URL** shown there. It looks like:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

You need this in the next step. Note it is a **Supabase** URL, not one of yours.

## 4. Create the Google OAuth client

In the [Google Cloud Console](https://console.cloud.google.com):

1. Create or select a project.
2. **APIs & Services → OAuth consent screen.**
   - **Choose User Type: Internal.** Arbisoft runs Google Workspace, so this
     should be available on a work Google account. Google then refuses sign-in
     for anyone outside `@arbisoft.com` before the request ever reaches this
     app — a far stronger gate than any check in application code. Use it
     together with `ALLOWED_EMAIL_DOMAINS`, not instead of it.
   - If Internal is greyed out, you are signed into the console with a personal
     account rather than your Arbisoft one. Switch accounts.
   - Fill in app name and support email. No scopes beyond the defaults.
3. **Credentials → Create Credentials → OAuth client ID → Web application.**
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** the Supabase callback URL from step 3.

> This is the single most common thing to get wrong. The redirect URI is the
> **Supabase** `.../auth/v1/callback` URL — *not* your app's `/auth/callback`.
> Google talks to Supabase, and Supabase then talks to your app.

4. Copy the **Client ID** and **Client secret**.

## 5. Enable Google in Supabase

Back in **Authentication → Sign In / Providers → Google**: paste the Client ID
and Client secret, toggle it **enabled**, and save.

## 6. Configure local environment

```bash
cp .env.local.example .env.local
```

Fill in your Project URL and publishable key.

`ALLOWED_EMAIL_DOMAINS` is already set to `arbisoft.com`, so only
`@arbisoft.com` accounts can sign in.

Leave it blank and **anyone with any Google account** who finds the URL can sign
up. Their data stays separate from yours because of RLS, but you would be
running an open sign-up page on a work tool.

## 7. Set the redirect allow list

**Authentication → URL Configuration:**

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/callback`

Supabase rejects any `redirectTo` that is not on this list. When it does, the
symptom is a silent bounce back to the login page with no error, which is
extremely annoying to debug.

## 8. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and
capture a task. If the list survives a refresh, the whole chain works.

---

## 9. Deploy to Netlify

Netlify's free plan permits commercial use, which is why this is not on Vercel —
Vercel's Hobby plan is restricted to non-commercial personal use, and that
explicitly includes a tool built by a paid employee.

1. Push this repo to GitHub.
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → pick the repo. Leave the build settings alone;
   `netlify.toml` already sets them.
3. Before the first deploy finishes, go to **Site configuration → Environment
   variables** and add all three:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `ALLOWED_EMAIL_DOMAINS`
4. Trigger a redeploy if the first one ran without them.
5. Note your site URL, e.g. `https://your-site.netlify.app`.

## 10. Add the production URLs

Sign-in will fail until you do this. Two places:

**Google Cloud Console → Credentials → your OAuth client:**
- Add `https://your-site.netlify.app` to **Authorized JavaScript origins**.
- Leave the redirect URI alone. It stays the Supabase one.

**Supabase → Authentication → URL Configuration:**
- Set **Site URL** to `https://your-site.netlify.app`
- Add `https://your-site.netlify.app/auth/callback` to **Redirect URLs**
- Keep the localhost entries so local development still works.

Neither change needs a redeploy. Google can take a few minutes to propagate.

---

## Things worth knowing

**Free Supabase projects pause after 7 days of no activity** and need a manual
restore from the dashboard. Daily use never triggers it. If it does trigger,
that is information about adoption, not a bug to paper over with a cron ping.

**Free tier ceilings:** Supabase gives 500MB database and 50,000 monthly active
users; Netlify gives 100GB bandwidth and 300 build minutes a month. A text-only
task app used by a team is nowhere near any of these. Add no payment method to
either account and there is no path to a surprise bill.

**Adding someone to the experiment** is just sending them the URL, provided
their email matches `ALLOWED_EMAIL_DOMAINS`. Everyone sees only their own tasks —
this is deliberately not a shared team board.

**To lock it down further later**, tighten `ALLOWED_EMAIL_DOMAINS` and redeploy.
Existing sessions on now-disallowed domains are rejected on their next request
by the middleware, rather than lingering until the token expires.
