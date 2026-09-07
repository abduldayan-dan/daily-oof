import { createBrowserClient } from '@supabase/ssr'

import { supabaseConfig } from './config'

/**
 * Browser client. All task CRUD runs through this — Row Level Security is the
 * ownership boundary, so server actions would add plumbing without adding safety.
 */
export function createClient() {
  const { url, key } = supabaseConfig()
  return createBrowserClient(url, key)
}
