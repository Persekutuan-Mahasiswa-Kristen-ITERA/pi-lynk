import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { requireLynkRole } from '@/lib/api-auth';
import { validateDestinationUrl, validateSlug } from '@/lib/validation';
import { desc, eq, ilike, or, and, count, sql } from 'drizzle-orm';
import { isAdmin } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const guard = await requireLynkRole('pengurus');
  if (!guard.ok) return guard.response;
  const auth = guard.caller;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const official = searchParams.get('official') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    // Pengurus see only the links they created; admins see all.
    if (!isAdmin(auth.role)) {
      conditions.push(sql`lower(${links.createdBy}) = ${auth.email}`);
    }

    if (q) {
      conditions.push(
        or(
          ilike(links.slug, `%${q}%`),
          ilike(links.destinationUrl, `%${q}%`),
          ilike(links.title, `%${q}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(links.status, status));
    }

    if (official === 'true') {
      conditions.push(eq(links.isOfficial, true));
    } else if (official === 'false') {
      conditions.push(eq(links.isOfficial, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ total: count() })
      .from(links)
      .where(whereClause);
    const total = totalResult[0]?.total ?? 0;

    // Get items
    const items = await db
      .select()
      .from(links)
      .where(whereClause)
      .orderBy(desc(links.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin links:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar link.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireLynkRole('pengurus');
  if (!guard.ok) return guard.response;
  const auth = guard.caller;

  try {
    const body = await request.json();
    const { slug, destinationUrl, title, isOfficial = true, expiresAt } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug wajib diisi.' }, { status: 400 });
    }

    // Only admins may use protected keywords (pmk, itera, official, etc.) and mark links official.
    const slugResult = validateSlug(slug, isAdmin(auth.role));
    if (!slugResult.valid) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 });
    }

    const urlResult = validateDestinationUrl(destinationUrl, BASE_URL);
    if (!urlResult.valid) {
      return NextResponse.json({ error: urlResult.error }, { status: 400 });
    }

    let parsedExpiresAt: Date | null = null;
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt);
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json({ error: 'Format tanggal kedaluwarsa tidak valid.' }, { status: 400 });
      }
    }

    const newLink = await db
      .insert(links)
      .values({
        slug: slugResult.slug!,
        destinationUrl: urlResult.url!,
        title: title ? title.trim() : null,
        isOfficial: isAdmin(auth.role) ? Boolean(isOfficial) : false,
        createdBy: auth.email,
        status: 'active',
        expiresAt: parsedExpiresAt,
      })
      .returning();

    await recordAudit(auth, {
      action: 'link.create',
      targetType: 'link',
      targetId: newLink[0].id,
      summary: `Membuat /${newLink[0].slug} → ${newLink[0].destinationUrl}`,
      details: { slug: newLink[0].slug, destinationUrl: newLink[0].destinationUrl, isOfficial: newLink[0].isOfficial },
    });

    return NextResponse.json(newLink[0], { status: 201 });
  } catch (error: unknown) {
    const dbError = error as { code?: string };
    if (dbError.code === '23505') {
      return NextResponse.json({ error: 'Slug ini sudah digunakan.' }, { status: 409 });
    }
    console.error('Error creating admin link:', error);
    return NextResponse.json({ error: 'Gagal membuat tautan resmi.' }, { status: 500 });
  }
}
