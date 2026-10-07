import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { verifyAdminSession } from '@/auth';
import { validateDestinationUrl } from '@/lib/validation';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Tidak memiliki hak akses administrator.' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID tautan tidak valid.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: Partial<typeof links.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.destinationUrl !== undefined) {
      const urlResult = validateDestinationUrl(body.destinationUrl, BASE_URL);
      if (!urlResult.valid) {
        return NextResponse.json({ error: urlResult.error }, { status: 400 });
      }
      updateData.destinationUrl = urlResult.url!;
    }

    if (body.title !== undefined) {
      updateData.title = body.title ? body.title.trim() : null;
    }

    if (body.status !== undefined) {
      if (!['active', 'inactive', 'blocked'].includes(body.status)) {
        return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (body.statusReason !== undefined) {
      updateData.statusReason = body.statusReason ? body.statusReason.trim() : null;
    }

    if (body.isOfficial !== undefined) {
      updateData.isOfficial = Boolean(body.isOfficial);
    }

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === '') {
        updateData.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Format tanggal kedaluwarsa tidak valid.' }, { status: 400 });
        }
        updateData.expiresAt = d;
      }
    }

    const updated = await db
      .update(links)
      .set(updateData)
      .where(eq(links.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating admin link:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tautan.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Tidak memiliki hak akses administrator.' }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID tautan tidak valid.' }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(links)
      .where(eq(links.id, id))
      .returning({ id: links.id, slug: links.slug });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Tautan berhasil dihapus.', link: deleted[0] });
  } catch (error) {
    console.error('Error deleting admin link:', error);
    return NextResponse.json({ error: 'Gagal menghapus tautan.' }, { status: 500 });
  }
}
