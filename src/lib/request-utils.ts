import { headers } from 'next/headers';

/**
 * Get the client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  
  // Vercel
  const xForwardedFor = headersList.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnecting = headersList.get('cf-connecting-ip');
  if (cfConnecting) {
    return cfConnecting;
  }
  
  // Standard
  const xRealIp = headersList.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  return '127.0.0.1';
}

/**
 * Verify Origin header for CSRF protection.
 * Returns true if the request origin matches the expected origin.
 */
export async function verifyCsrf(): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  
  if (!origin) {
    // No origin header - could be same-origin request or non-browser client
    // Be lenient: only block if we also have a referer that doesn't match
    const referer = headersList.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }
    return true; // No origin, no referer - allow (server-to-server or same-origin)
  }
  
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
