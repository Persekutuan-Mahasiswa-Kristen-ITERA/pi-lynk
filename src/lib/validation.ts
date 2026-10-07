import { BLOCKED_SHORTENER_DOMAINS, BLOCKED_DOMAINS, RESERVED_SLUGS, PROTECTED_KEYWORDS } from '@/lib/config/blocked-domains';

// ─── URL Validation ───────────────────────────────────────────────

const MAX_URL_LENGTH = 2048;

/** Private/internal IP ranges to reject */
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
  /^::$/,
  /^0\.0\.0\.0$/,
];

/** Check if hostname looks like an IP literal (v4 or v6 bracket) */
function isIPLiteral(hostname: string): boolean {
  // IPv6 in brackets
  if (hostname.startsWith('[')) return true;
  // IPv4: all numeric with dots
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return true;
  return false;
}

/** Check if hostname is a private/internal IP */
function isPrivateIP(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

/** Check if hostname is punycode/IDN (anti-homograph) */
function isPunycode(hostname: string): boolean {
  return hostname.split('.').some((label) => label.startsWith('xn--'));
}

/** Check if URL points to PI-LYNK itself (self-referencing loop) */
function isSelfReferencing(url: URL, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    if (url.hostname === base.hostname) return true;
  } catch {
    // baseUrl not set or invalid, skip
  }
  // Also block common Vercel deployment hostnames
  const vercelHostPatterns = [
    /\.vercel\.app$/i,
    /\.vercel\.sh$/i,
  ];
  // Only block if it's OUR Vercel deployment
  const vercelProjectName = 'pi-lynk';
  if (vercelHostPatterns.some(p => p.test(url.hostname)) &&
      url.hostname.toLowerCase().includes(vercelProjectName)) {
    return true;
  }
  return false;
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  /** Sanitized URL if valid */
  url?: string;
}

/**
 * Centralized URL security check function.
 * Validates a destination URL for safety and policy compliance.
 * 
 * NOTE: Does NOT fetch the URL (prevents SSRF).
 * External services like Safe Browsing can be added here later.
 */
export function validateDestinationUrl(
  rawUrl: string,
  baseUrl: string
): UrlValidationResult {
  // Trim whitespace
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL tujuan wajib diisi.' };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL terlalu panjang (maksimal ${MAX_URL_LENGTH} karakter).` };
  }

  // Auto-prepend https:// if no scheme
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = 'https://' + urlString;
  }

  // Parse URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Format URL tidak valid.' };
  }

  // 1. Only allow http/https schemes
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: 'Hanya URL dengan skema http atau https yang diizinkan.' };
  }

  // 2. Reject userinfo (user:pass@host)
  if (url.username || url.password) {
    return { valid: false, error: 'URL dengan kredensial (user:pass@host) tidak diizinkan.' };
  }

  // 3. Reject IP literals
  if (isIPLiteral(url.hostname)) {
    return { valid: false, error: 'URL dengan alamat IP tidak diizinkan. Gunakan nama domain.' };
  }

  // 4. Reject private/internal IPs (just in case they sneak through)
  if (isPrivateIP(url.hostname)) {
    return { valid: false, error: 'URL ke jaringan internal tidak diizinkan.' };
  }

  // 5. Reject localhost
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
    return { valid: false, error: 'URL ke localhost tidak diizinkan.' };
  }

  // 6. Reject punycode/IDN (anti-homograph)
  if (isPunycode(url.hostname)) {
    return { valid: false, error: 'URL dengan domain internasional (IDN/punycode) belum didukung.' };
  }

  // 7. Reject self-referencing URLs (prevents redirect loops to PI-LYNK itself)
  if (isSelfReferencing(url, baseUrl)) {
    return { valid: false, error: 'Tidak bisa membuat shortlink yang menunjuk ke PI-LYNK sendiri.' };
  }

  // 8. Reject blocked shortener domains
  const lowerHostname = url.hostname.toLowerCase();
  const isBlockedShortener = BLOCKED_SHORTENER_DOMAINS.some(
    (domain) => lowerHostname === domain || lowerHostname.endsWith('.' + domain)
  );
  if (isBlockedShortener) {
    return { valid: false, error: 'Tidak bisa memendekkan URL dari layanan pemendek tautan lain.' };
  }

  // 9. Reject blocked domains
  const isBlockedDomain = BLOCKED_DOMAINS.some(
    (domain) => lowerHostname === domain || lowerHostname.endsWith('.' + domain)
  );
  if (isBlockedDomain) {
    return { valid: false, error: 'Domain ini diblokir.' };
  }

  // 10. Ensure hostname has at least one dot (basic domain check)
  if (!url.hostname.includes('.')) {
    return { valid: false, error: 'Nama domain tidak valid.' };
  }

  // ── Future: Add Safe Browsing / external checks here ──
  // e.g., await checkSafeBrowsing(url.toString());

  // Return the cleaned URL (preserving query string and fragment)
  return { valid: true, url: url.toString() };
}

// ─── Slug Validation ──────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
  /** Normalized slug (lowercase) if valid */
  slug?: string;
}

/**
 * Validate and normalize a slug.
 * @param rawSlug - The user-provided slug
 * @param isAdmin - Whether the requester is an admin
 */
export function validateSlug(
  rawSlug: string,
  isAdmin: boolean = false
): SlugValidationResult {
  // Normalize: trim and lowercase
  const slug = rawSlug.trim().toLowerCase();

  if (!slug) {
    return { valid: false, error: 'Slug wajib diisi.' };
  }

  if (slug.length < MIN_SLUG_LENGTH) {
    return { valid: false, error: `Slug minimal ${MIN_SLUG_LENGTH} karakter.` };
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return { valid: false, error: `Slug maksimal ${MAX_SLUG_LENGTH} karakter.` };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-). Tidak boleh diawali atau diakhiri dengan tanda hubung.',
    };
  }

  // Check reserved slugs (no one, not even admin, can use these)
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return { valid: false, error: 'Slug ini sudah digunakan oleh sistem.' };
  }

  // Check protected keywords (only admin can use these)
  if (!isAdmin) {
    const containsProtected = PROTECTED_KEYWORDS.some((keyword) =>
      slug.includes(keyword)
    );
    if (containsProtected) {
      return {
        valid: false,
        error: 'Slug yang mengandung kata resmi/terlindungi hanya bisa dibuat oleh admin.',
      };
    }
  }

  return { valid: true, slug };
}

/**
 * Generate a random slug using nanoid.
 * Uses a URL-safe alphabet without ambiguous characters.
 */
export async function generateRandomSlug(): Promise<string> {
  const { customAlphabet } = await import('nanoid');
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 7);
  return nanoid();
}
