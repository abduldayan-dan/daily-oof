/**
 * Supabase connection values.
 *
 * Supabase is retiring the legacy `anon` JWT in favour of publishable keys
 * (`sb_publishable_...`). New projects show the publishable key; older ones
 * still show an anon key. We accept either, so this works with whichever your
 * dashboard is currently handing out.
 *
 * These must be read as full static `process.env.NEXT_PUBLIC_*` expressions —
 * Next inlines them into the browser bundle at build time by matching on the
 * literal text, so destructuring or dynamic lookup would yield undefined.
 *
 * Validation is deliberately lazy. Throwing at module scope would fail the
 * production build on any machine that has not set the vars yet, which is a
 * confusing way to learn that you forgot a value.
 */
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — locally in .env.local, and in ' +
        'Netlify under Site configuration > Environment variables. See SETUP.md.',
    )
  }

  return { url, key }
}
