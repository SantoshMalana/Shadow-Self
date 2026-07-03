import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase auth middleware — refreshes the session on every request.
 * This ensures the auth token stays fresh and prevents stale sessions.
 *
 * Called from the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not remove this getUser() call.
  // It refreshes the auth token and is required for session persistence.
  // Do NOT use getSession() here — it doesn't validate the token with the server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not signed in and trying to access protected routes, redirect to login
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/train') ||
    request.nextUrl.pathname.startsWith('/clone') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/api/chat') ||
    request.nextUrl.pathname.startsWith('/api/personality') ||
    request.nextUrl.pathname.startsWith('/api/memory') ||
    request.nextUrl.pathname.startsWith('/api/account')

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user IS signed in and trying to access auth routes, redirect to clone
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/clone'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
