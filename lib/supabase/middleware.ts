import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { isAllowedEmail } from '@/lib/auth/allowed-domains'

import { supabaseConfig } from './config'

/** Paths that must stay reachable while signed out. */
const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  // The design preview 404s in production on its own; this only stops the
  // redirect to /login while developing.
  ...(process.env.NODE_ENV === 'production' ? [] : ['/design-preview']),
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { url, key } = supabaseConfig()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
        // Second argument is not optional in practice. It carries
        // `Cache-Control: private, no-store` etc. Without it a CDN in front of
        // the app (Netlify, Cloudflare, Vercel Edge) can cache a response that
        // carries a Set-Cookie auth token and hand one person's session to
        // somebody else.
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        )
      },
    },
  })

  // Do not put code between createServerClient and getClaims(). Anything that
  // defers this call risks the session refresh landing after the response has
  // been committed, which silently logs people out.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (!claims && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Second line of defence for the domain gate: if the allow list is tightened
  // later, sessions minted under the old rules stop working on the next request
  // rather than lingering until they expire.
  if (
    claims &&
    !isPublic &&
    !isAllowedEmail(claims.email as string | undefined)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/not-allowed'
    return NextResponse.redirect(url)
  }

  // Return supabaseResponse itself. Building a fresh NextResponse here drops the
  // refreshed auth cookies and produces a random-logout bug that is miserable to
  // track down. If you need your own response, copy the cookies across first.
  return supabaseResponse
}
