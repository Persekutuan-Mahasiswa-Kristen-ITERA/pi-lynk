import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin pages and APIs use the PI-CORE session (PI-CORE D-16). Refresh it here so Server Components
 * (which cannot write cookies) always see a valid access token. Access itself is decided per request
 * by getAccessStatus() in src/auth.ts.
 */
async function refreshPicoreSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_PICORE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try {
    await supabase.auth.getClaims();
  } catch {
    // An unusable session simply means "signed out"; the page or API answers accordingly.
  }
}

/**
 * Next.js 16 Proxy convention:
 * 1. Add X-Robots-Tag: noindex to slug redirect responses
 * 2. Block admin pages from indexing
 * 3. Handle HEAD requests for slug redirects (no click counting)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    await refreshPicoreSession(request, response);
  }

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
