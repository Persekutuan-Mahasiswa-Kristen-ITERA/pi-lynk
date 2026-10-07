/**
 * Daftar domain pemendek link yang diblokir.
 * Ditolak untuk mencegah redirect chain.
 */
export const BLOCKED_SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd',
  'v.gd',
  'buff.ly',
  'rebrand.ly',
  'bl.ink',
  'short.io',
  'tiny.cc',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'surl.li',
  'lnkd.in',
  'youtu.be',
  's.id',
  'link.id',
  'linktr.ee',
  'dub.sh',
  'dub.co',
] as const;

/**
 * Daftar domain lain yang diblokir (phishing, malware, dll.)
 * Tambahkan domain di sini sesuai kebutuhan.
 */
export const BLOCKED_DOMAINS: string[] = [];

/**
 * Slug yang direservasi karena merupakan route sistem.
 * Tidak boleh dipakai oleh siapa pun, termasuk admin.
 */
export const RESERVED_SLUGS = [
  'admin',
  'login',
  'api',
  'laporkan',
  'ketentuan',
  '_next',
  'static',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'logo-pmk.png',
  'logo-pmk.avif',
  'opengraph-image',
  'manifest.json',
] as const;

/**
 * Kata-kata yang dilindungi.
 * Slug yang MENGANDUNG kata-kata ini hanya boleh dibuat oleh admin.
 */
export const PROTECTED_KEYWORDS = [
  'pmk',
  'itera',
  'resmi',
  'official',
  'admin',
] as const;
