import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIP, verifyCsrf } from '@/lib/request-utils';

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

    const body = await request.json();
    const { slugOrUrl, reason, contactInfo, turnstileToken } = body;

    // Verify captcha
    const ip = await getClientIP();
    const captchaValid = await verifyTurnstile(turnstileToken || '', ip);
    if (!captchaValid) {
      return NextResponse.json(
        { error: 'Verifikasi captcha gagal. Silakan coba lagi.' },
        { status: 400 }
      );
    }

    // Rate limit
    const rateLimitResult = await checkRateLimit(ip, 'report');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Validate inputs
    if (!slugOrUrl || !slugOrUrl.trim()) {
      return NextResponse.json(
        { error: 'Slug atau URL yang dilaporkan wajib diisi.' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Alasan pelaporan wajib diisi.' },
        { status: 400 }
      );
    }

    if (reason.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Alasan terlalu panjang (maksimal 1000 karakter).' },
        { status: 400 }
      );
    }

    if (contactInfo && contactInfo.trim().length > 255) {
      return NextResponse.json(
        { error: 'Informasi kontak terlalu panjang (maksimal 255 karakter).' },
        { status: 400 }
      );
    }

    // Insert report
    await db.insert(reports).values({
      slugOrUrl: slugOrUrl.trim(),
      reason: reason.trim(),
      contactInfo: contactInfo?.trim() || null,
    });

    return NextResponse.json(
      { message: 'Laporan berhasil dikirim. Terima kasih.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
