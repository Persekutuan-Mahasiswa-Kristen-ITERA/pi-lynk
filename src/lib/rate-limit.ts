import { db } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

const RATE_LIMIT_SALT = process.env.RATE_LIMIT_SALT || 'default-dev-salt';
const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || '10', 10);
const RATE_LIMIT_PER_DAY = parseInt(process.env.RATE_LIMIT_PER_DAY || '30', 10);

/**
 * Hash an IP address with a salt for privacy.
 * Never stores the raw IP.
 */
function hashIP(ip: string): string {
  return createHash('sha256')
    .update(RATE_LIMIT_SALT + ip)
    .digest('hex');
}

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  /** Remaining attempts in the hourly window */
  remainingHour?: number;
  /** Remaining attempts in the daily window */
  remainingDay?: number;
}

/**
 * Check and increment rate limit for an action.
 * Uses Postgres for storage (serverless-compatible).
 */
export async function checkRateLimit(
  ip: string,
  action: string = 'create_link'
): Promise<RateLimitResult> {
  const ipHash = hashIP(ip);
  const now = new Date();

  // Calculate window starts
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  try {
    // Check hourly count
    const hourlyRows = await db
      .select({ count: sql<number>`COALESCE(SUM(${rateLimits.count}), 0)` })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.ipHash, ipHash),
          eq(rateLimits.action, action),
          gte(rateLimits.windowStart, hourStart)
        )
      );

    const hourlyCount = Number(hourlyRows[0]?.count ?? 0);

    // Check daily count
    const dailyRows = await db
      .select({ count: sql<number>`COALESCE(SUM(${rateLimits.count}), 0)` })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.ipHash, ipHash),
          eq(rateLimits.action, action),
          gte(rateLimits.windowStart, dayStart)
        )
      );

    const dailyCount = Number(dailyRows[0]?.count ?? 0);

    if (hourlyCount >= RATE_LIMIT_PER_HOUR) {
      return {
        allowed: false,
        error: `Batas pembuatan link per jam tercapai (${RATE_LIMIT_PER_HOUR}). Silakan coba lagi nanti.`,
        remainingHour: 0,
        remainingDay: Math.max(0, RATE_LIMIT_PER_DAY - dailyCount),
      };
    }

    if (dailyCount >= RATE_LIMIT_PER_DAY) {
      return {
        allowed: false,
        error: `Batas pembuatan link per hari tercapai (${RATE_LIMIT_PER_DAY}). Silakan coba lagi besok.`,
        remainingHour: Math.max(0, RATE_LIMIT_PER_HOUR - hourlyCount),
        remainingDay: 0,
      };
    }

    // Increment counter - use upsert pattern
    await db.insert(rateLimits).values({
      ipHash,
      action,
      windowStart: hourStart,
      count: 1,
    });

    return {
      allowed: true,
      remainingHour: Math.max(0, RATE_LIMIT_PER_HOUR - hourlyCount - 1),
      remainingDay: Math.max(0, RATE_LIMIT_PER_DAY - dailyCount - 1),
    };
  } catch (error) {
    // Don't block the request if rate limiting fails
    console.error('Rate limit check failed:', error);
    return { allowed: true };
  }
}

/**
 * Clean up old rate limit records.
 * Call this periodically (e.g., via cron or admin action).
 */
export async function cleanupRateLimits(): Promise<void> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await db.delete(rateLimits).where(
    sql`${rateLimits.windowStart} < ${twoDaysAgo}`
  );
}
