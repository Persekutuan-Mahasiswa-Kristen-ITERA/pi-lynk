const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

/**
 * Verify a Cloudflare Turnstile captcha token server-side.
 * 
 * In development (no keys set), bypass verification.
 * In production, always verify.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  // Development bypass: only if secret key is not set AND not in production
  if (!TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY is not set in production!');
      return false;
    }
    console.warn('Turnstile verification bypassed (development mode, no key set)');
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
}
