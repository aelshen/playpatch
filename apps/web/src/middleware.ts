/**
 * Next.js Middleware for Route Protection
 *
 * Protects routes from unauthorized access:
 * - Blocks children from accessing /admin routes
 * - Additional auth checks happen in page components via getCurrentUser()
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for child session cookie
  const childSessionCookie = request.cookies.get('child-session');
  const hasChildSession = !!childSessionCookie;

  // Block children from accessing admin routes
  if (hasChildSession && pathname.startsWith('/admin')) {
    // Child is logged in - redirect to their appropriate view
    try {
      const sessionData = JSON.parse(childSessionCookie.value);
      const redirectPath = sessionData.uiMode === 'TODDLER'
        ? '/child/toddler'
        : '/child/explorer';

      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch {
      // Invalid session data - clear and redirect to profile selection
      const response = NextResponse.redirect(new URL('/profiles', request.url));
      response.cookies.delete('child-session');
      return response;
    }
  }

  // Allow all other requests to proceed
  // Additional auth checks happen in page components
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth routes)
     * - public assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
