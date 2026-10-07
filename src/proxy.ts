import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy convention:
 * 1. Add X-Robots-Tag: noindex to slug redirect responses
 * 2. Block admin pages from indexing
 * 3. Handle HEAD requests for slug redirects (no click counting)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add X-Robots-Tag for slug pages (not system routes)
  const isSystemRoute = [
    '/',
    '/admin',
    '/login',
    '/api',
    '/laporkan',
    '/ketentuan',
    '/_next',
    '/static',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ].some(route => pathname === route || pathname.startsWith(route + '/'));

  if (!isSystemRoute && pathname !== '/') {
    response.headers.set('X-Robots-Tag', 'noindex');
  }

  // Block admin from indexing
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Pass request method info for click tracking
  if (request.method === 'HEAD') {
    response.headers.set('x-invoke-method', 'HEAD');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo-pmk|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
