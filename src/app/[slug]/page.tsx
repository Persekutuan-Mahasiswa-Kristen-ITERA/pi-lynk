import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { isBot } from '@/lib/bot-detection';
import GonePage from '@/components/gone-page';
import InterstitialPage from '@/components/interstitial-page';

export const instant = false;

const PUBLIC_LINK_INTERSTITIAL = process.env.PUBLIC_LINK_INTERSTITIAL === 'true';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();

  let link = null;

  try {
    // Single indexed query for slug lookup with cold-start retry protection
    const rows = await db
      .select()
      .from(links)
      .where(eq(links.slug, normalizedSlug))
      .limit(1);

    link = rows[0] ?? null;
  } catch (error) {
    console.error('Database query error on slug lookup:', error);
    // On unexpected database connectivity error during cold start, show friendly error instead of crashing
    return (
      <GonePage reason="Sistem sedang menghubungkan ke basis data. Silakan muat ulang halaman dalam beberapa detik." />
    );
  }

  // Slug not found
  if (!link) {
    notFound();
  }

  // Check expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return <GonePage reason="Link ini sudah kedaluwarsa." />;
  }

  // Check status
  if (link.status === 'inactive') {
    return <GonePage reason={link.statusReason || 'Link ini telah dinonaktifkan oleh administrator.'} />;
  }

  if (link.status === 'blocked') {
    return <GonePage reason={link.statusReason || 'Link ini telah diblokir karena melanggar ketentuan penggunaan.'} />;
  }

  // Record click (non-blocking) - skip bots and HEAD requests
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    const method = headersList.get('x-invoke-method') || 'GET';

    if (method !== 'HEAD' && !isBot(userAgent)) {
      // Fire-and-forget: do not block redirect
      db.update(links)
        .set({
          clickCount: sql`${links.clickCount} + 1`,
          lastClickedAt: new Date(),
        })
        .where(eq(links.id, link.id))
        .catch((err) => console.error('Click tracking failed:', err));
    }
  } catch (err) {
    console.error('Click tracking header error:', err);
  }

  // Interstitial for non-official links (if enabled)
  if (PUBLIC_LINK_INTERSTITIAL && !link.isOfficial) {
    return <InterstitialPage destinationUrl={link.destinationUrl} />;
  }

  // Temporary redirect (307)
  redirect(link.destinationUrl);
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  return {
    title: `Mengalihkan... | PI-LYNK`,
    robots: {
      index: false,
      follow: false,
    },
    other: {
      'X-Robots-Tag': 'noindex',
    },
    description: `Shortlink PI-LYNK: ${slug}`,
  };
}
