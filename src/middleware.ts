import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleDashboardPath } from '@/lib/utils'
import type { UserRole } from '@/lib/supabase/types'

type CookieEntry = { name: string; value: string; options?: CookieOptions }

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieEntry[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPage = AUTH_PAGES.includes(pathname)

  // If the user must change their password, block every route except /change-password
  if (user && !isAuthPage && pathname !== '/change-password') {
    if (user.app_metadata?.must_change_password === true) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/change-password', request.url)))
    }
  }

  // Redirect unauthenticated users away from protected routes
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin')
  if (isProtectedRoute && !user) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  }

  // Redirect authenticated users away from auth pages → role-aware dashboard
  if (isAuthPage && user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profileData as { role: UserRole } | null)?.role
    const target = role ? getRoleDashboardPath(role) : '/admin/dashboard'
    return applySecurityHeaders(NextResponse.redirect(new URL(target, request.url)))
  }

  return applySecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
