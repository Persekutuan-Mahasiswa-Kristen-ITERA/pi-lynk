import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { validateDestinationUrl, validateSlug, generateRandomSlug } from '@/lib/validation';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIP, verifyCsrf } from '@/lib/request-utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const PUBLIC_CREATION_ENABLED = process.env.PUBLIC_CREATION_ENABLED !== 'false';

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    const csrfValid = await verifyCsrf();
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Permintaan tidak valid (CSRF).' },
        { status: 403 }
      );
    }

    // Check if public creation is enabled
    if (!PUBLIC_CREATION_ENABLED) {
      return NextResponse.json(
        { error: 'Pembuatan link sementara ditutup oleh admin.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { destinationUrl, customSlug, turnstileToken } = body;

    // Verify captcha
    const ip = await getClientIP();
    const captchaValid = await verifyTurnstile(turnstileToken || '', ip);
    if (!captchaValid) {
      return NextResponse.json(
        { error: 'Verifikasi captcha gagal. Silakan coba lagi.' },
        { status: 400 }
      );
    }

    // Rate limit check
    const rateLimitResult = await checkRateLimit(ip, 'create_link');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Validate destination URL
    const urlResult = validateDestinationUrl(destinationUrl, BASE_URL);
    if (!urlResult.valid) {
      return NextResponse.json(
        { error: urlResult.error },
        { status: 400 }
      );
    }

    // Validate or generate slug
    let slug: string;
    if (customSlug && customSlug.trim()) {
      const slugResult = validateSlug(customSlug, false); // not admin
      if (!slugResult.valid) {
        return NextResponse.json(
          { error: slugResult.error },
          { status: 400 }
        );
      }
      slug = slugResult.slug!;
    } else {
      // Generate random slug with collision handling
      let attempts = 0;
      const maxAttempts = 5;
      slug = await generateRandomSlug();
      
      while (attempts < maxAttempts) {
        try {
          // Try to insert - unique constraint will catch collisions
          await db.insert(links).values({
            slug,
            destinationUrl: urlResult.url!,
            isOfficial: false,
            status: 'active',
          });

          const shortUrl = `${BASE_URL}/${slug}`;
          return NextResponse.json({
            slug,
            shortUrl,
            destinationUrl: urlResult.url!,
          }, { status: 201 });
        } catch (error: unknown) {
          const dbError = error as { code?: string };
          if (dbError.code === '23505') {
            // Unique constraint violation - try another slug
            slug = await generateRandomSlug();
            attempts++;
            continue;
          }
          throw error;
        }
      }

      return NextResponse.json(
        { error: 'Gagal membuat slug unik. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    // Insert with custom slug - let DB constraint handle uniqueness (race condition safe)
    try {
      await db.insert(links).values({
        slug,
        destinationUrl: urlResult.url!,
        isOfficial: false,
        status: 'active',
      });
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'Slug ini sudah digunakan. Pilih slug lain.' },
          { status: 409 }
        );
      }
      throw error;
    }

    const shortUrl = `${BASE_URL}/${slug}`;
    return NextResponse.json({
      slug,
      shortUrl,
      destinationUrl: urlResult.url!,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
