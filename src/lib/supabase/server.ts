import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { createClient as createSbClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

type CookieEntry = { name: string; value: string; options?: CookieOptions }

/** Typed read client — uses session cookies for RLS. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieEntry[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookie writes are no-ops
          }
        },
      },
    }
  )
}

/**
 * Service-role admin client — bypasses RLS.
 * Uses the raw @supabase/supabase-js client so it is free from
 * the postgrest-js PostgrestVersion generic constraint that
 * hand-rolled Database types cannot satisfy in v2.45+.
 */
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  )
}
