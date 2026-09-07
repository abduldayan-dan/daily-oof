import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { supabaseConfig } from './config'

/**
 * Server client, for Server Components and Route Handlers.
 *
 * `cookies()` is async in Next 15, so this function is too.
 */
export async function createClient() {
  const { url, key } = supabaseConfig()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Components cannot write cookies. The middleware refreshes
          // the session on every request, so this is safe to swallow.
        }
      },
    },
  })
}
