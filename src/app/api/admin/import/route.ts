import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { verifyAdminSession } from '@/auth';
import { validateDestinationUrl, validateSlug } from '@/lib/validation';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface ImportItem {
  slug: string;
  destinationUrl: string;
  title?: string;
  isOfficial?: boolean;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Tidak memiliki hak akses administrator.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: ImportItem[] = Array.isArray(body) ? body : body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data impor tidak boleh kosong.' }, { status: 400 });
    }

    if (items.length > 500) {
      return NextResponse.json({ error: 'Maksimal 500 tautan per sekali impor.' }, { status: 400 });
    }

    const imported = [];
    const skipped = [];

    for (const item of items) {
      if (!item.slug || !item.destinationUrl) {
        skipped.push({ item, reason: 'Slug atau URL tujuan kosong' });
        continue;
      }

      const slugResult = validateSlug(item.slug, true);
      if (!slugResult.valid) {
        skipped.push({ item, reason: `Slug tidak valid: ${slugResult.error}` });
        continue;
      }

      const urlResult = validateDestinationUrl(item.destinationUrl, BASE_URL);
      if (!urlResult.valid) {
        skipped.push({ item, reason: `URL tidak valid: ${urlResult.error}` });
        continue;
      }

      try {
        const result = await db
          .insert(links)
          .values({
            slug: slugResult.slug!,
            destinationUrl: urlResult.url!,
            title: item.title ? item.title.trim() : null,
            isOfficial: item.isOfficial ?? true,
            createdBy: auth.email,
            status: 'active',
          })
          .returning();

        imported.push(result[0]);
      } catch (insertError: unknown) {
        const dbError = insertError as { code?: string };
        if (dbError.code === '23505') {
          skipped.push({ item, reason: 'Slug sudah terdaftar di sistem' });
        } else {
          skipped.push({ item, reason: 'Gagal memasukkan ke database' });
        }
      }
    }

    return NextResponse.json({
      message: `Impor selesai: ${imported.length} berhasil, ${skipped.length} dilewati.`,
      successCount: imported.length,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (error) {
    console.error('Error importing links:', error);
    return NextResponse.json({ error: 'Format data impor tidak valid.' }, { status: 400 });
  }
}
