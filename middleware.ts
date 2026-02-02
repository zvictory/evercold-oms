import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported locales
const LOCALES = ['ru', 'en', 'uz-Latn', 'uz-Cyrl']

// Public route patterns that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/403',
  '/driver/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/driver/login',
]

// Driver-only routes
const DRIVER_ROUTES = ['/driver']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public assets and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/.well-known') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Check if pathname matches any public route (including locale-prefixed versions)
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    // Match exact route
    if (pathname === route) return true
    // Match locale-prefixed route (e.g., /ru/login)
    if (LOCALES.some((locale) => pathname === `/${locale}${route}`)) return true
    return false
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For driver routes, skip middleware (handled by API-level auth)
  if (DRIVER_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for authentication token in cookies or headers
  const authToken = request.cookies.get('authToken')?.value
  const authHeader = request.headers.get('authorization')

  // Extract token from Bearer header or cookie
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authToken

  if (!token) {
    // No token, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists - allow request to proceed
  // Actual role-based validation happens at API/route handler level
  // This keeps middleware lightweight for edge runtime

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
