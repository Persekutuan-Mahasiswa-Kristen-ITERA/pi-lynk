/**
 * Bot detection for link preview crawlers.
 * These bots should NOT count toward click analytics.
 */

const BOT_USER_AGENTS = [
  'WhatsApp',
  'TelegramBot',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'YandexBot',
  'DuckDuckBot',
  'Baiduspider',
  'Sogou',
  'Exabot',
  'ia_archiver',
  'Applebot',
  'PetalBot',
  'SemrushBot',
  'AhrefsBot',
  'MJ12bot',
  'DotBot',
  'UptimeRobot',
  'PingdomBot',
  'StatusCakeBot',
  'curl',
  'wget',
  'httpie',
  'python-requests',
  'Go-http-client',
  'Java/',
  'libwww-perl',
  'Apache-HttpClient',
  'node-fetch',
  'axios',
];

/**
 * Check if a request is from a known bot/link-preview crawler.
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // No UA = probably a bot
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}
