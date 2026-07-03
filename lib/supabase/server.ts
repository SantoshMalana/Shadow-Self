import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for App Router.
 * Uses cookie-based auth — reads/writes cookies via Next.js headers().
 * Use this in Server Components, Route Handlers, and Server Actions.
 *
 * IMPORTANT: This function is async because next/headers cookies() is async in Next.js 16.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This can be safely ignored if middleware is refreshing sessions.
          }
        },
      },
    }
  )
}
