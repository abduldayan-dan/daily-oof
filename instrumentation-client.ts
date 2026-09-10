/**
 * PostHog browser analytics.
 *
 * Next.js 15.3+ executes this file on the client automatically. There is no
 * provider to mount and nothing to import into the layout — do NOT wrap the app
 * in <PostHogProvider>; that is the older pattern and would initialise twice.
 *
 * https://posthog.com/docs/web-analytics/installation/nextjs
 *
 * The library is loaded with a dynamic import on purpose. A static
 * `import posthog from 'posthog-js'` is pulled into the initial bundle whether
 * or not analytics are switched on, which added ~92 kB to first load while
 * doing nothing. Inside the branch it becomes a separate chunk: never fetched
 * without a token, and deferred rather than blocking first paint with one.
 */

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const isDev = process.env.NODE_ENV === 'development'

if (token) {
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

      // PostHog's recommended preset, pinned to a date so a future release
      // cannot silently change behaviour underneath us.
      defaults: '2026-05-30',

      // Set explicitly rather than left to `defaults`. Everyone who reaches
      // this app is a signed-in colleague, so identified-only profiles would
      // lose the person-level view this is being added for.
      person_profiles: 'always',
    })

    if (isDev) {
      posthog.debug()
    }
  })
} else if (isDev) {
  // Deliberately not throwing. A missing token should disable analytics, never
  // break the app — the docs' `token!` assertion would send `undefined` into
  // init() and fail in the browser on any deploy where the var is absent.
  console.warn(
    '[posthog] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set — analytics disabled.',
  )
}
