import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Root proxy — refreshes Supabase auth session on every request.
 * 
 * NEXT.JS 16 BREAKING CHANGE: middleware.ts is renamed to proxy.ts.
 * The export must be named 'proxy', not 'middleware'.
 * Route protection logic lives in lib/supabase/middleware.ts.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets (images, etc.)
     * - API health check (public endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health).*)',
  ],
}
