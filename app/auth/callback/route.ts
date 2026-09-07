import { NextResponse } from 'next/server'

import { isAllowedEmail } from '@/lib/auth/allowed-domains'
import { createClient } from '@/lib/supabase/server'

/**
 * Only allow redirects to a path on this site. Without this check, an attacker
 * can send someone a link ending in `?next=https://evil.example` and use our
 * domain to bounce them somewhere else after a genuine login.
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  // Supabase reports provider-side failures (consent declined, misconfigured
  // client) on the query string rather than by omitting the code.
  const authError = searchParams.get('error_description') ?? searchParams.get('error')
  if (authError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authError)}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No sign-in code was returned.')}`,
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  if (!isAllowedEmail(data.user?.email)) {
    // Sign out before redirecting, otherwise the rejected account keeps a valid
    // session cookie and only the UI pretends they are logged out.
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth/not-allowed`)
  }

  // Behind Netlify the origin is the internal host, so trust the forwarded
  // host in production to avoid redirecting people to an internal URL.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'

  if (!isLocal && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  }
  return NextResponse.redirect(`${origin}${next}`)
}
