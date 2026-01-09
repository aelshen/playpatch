/**
 * Next.js Middleware for Route Protection
 *
 * Temporarily simplified - auth checks happen in page components
 * TODO: Re-enable middleware auth once NextAuth v5 Edge Runtime issues are resolved
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, allow all requests
  // Auth is checked in individual page components via getCurrentUser()
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
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
