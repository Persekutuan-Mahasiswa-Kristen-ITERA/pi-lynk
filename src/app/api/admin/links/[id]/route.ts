import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { requireLynkRole } from '@/lib/api-auth';
import { validateDestinationUrl } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { canManageLink, forbiddenLinkChange, isAdmin } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

async function findLink(id: number) {
  const rows = await db.select().from(links).where(eq(links.id, id)).limit(1);
  return rows[0] ?? null;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireLynkRole('pengurus');
  if (!guard.ok) return guard.response;
  const auth = guard.caller;

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID tautan tidak valid.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const existing = await findLink(id);
    if (!existing) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }
    if (!canManageLink(auth.role, auth.email, existing)) {
      return NextResponse.json({ error: 'Anda hanya bisa mengubah tautan buatan Anda sendiri.' }, { status: 403 });
    }
    const forbidden = forbiddenLinkChange(auth.role, { status: body.status, isOfficial: body.isOfficial }, existing);
    if (forbidden) {
      return NextResponse.json({ error: forbidden }, { status: 403 });
    }

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

    if (body.isOfficial !== undefined && isAdmin(auth.role)) {
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

    const after = updated[0];
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of ['destinationUrl', 'title', 'status', 'statusReason', 'isOfficial', 'expiresAt'] as const) {
      const from = existing[key] instanceof Date ? (existing[key] as Date).toISOString() : existing[key];
      const to = after[key] instanceof Date ? (after[key] as Date).toISOString() : after[key];
      if (from !== to) changed[key] = { from, to };
    }
    if (Object.keys(changed).length > 0) {
      await recordAudit(auth, {
        action: 'link.update',
        targetType: 'link',
        targetId: after.id,
        summary: `Mengubah /${after.slug}: ${Object.keys(changed).join(', ')}`,
        details: changed,
      });
    }

    return NextResponse.json(after);
  } catch (error) {
    console.error('Error updating admin link:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tautan.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const guard = await requireLynkRole('pengurus');
  if (!guard.ok) return guard.response;
  const auth = guard.caller;

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID tautan tidak valid.' }, { status: 400 });
  }

  try {
    const existing = await findLink(id);
    if (!existing) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }
    if (!canManageLink(auth.role, auth.email, existing)) {
      return NextResponse.json({ error: 'Anda hanya bisa menghapus tautan buatan Anda sendiri.' }, { status: 403 });
    }

    const deleted = await db
      .delete(links)
      .where(eq(links.id, id))
      .returning({ id: links.id, slug: links.slug });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Tautan tidak ditemukan.' }, { status: 404 });
    }

    await recordAudit(auth, {
      action: 'link.delete',
      targetType: 'link',
      targetId: existing.id,
      summary: `Menghapus /${existing.slug} → ${existing.destinationUrl}`,
      details: { slug: existing.slug, destinationUrl: existing.destinationUrl, createdBy: existing.createdBy, clickCount: existing.clickCount },
    });

    return NextResponse.json({ message: 'Tautan berhasil dihapus.', link: deleted[0] });
  } catch (error) {
    console.error('Error deleting admin link:', error);
    return NextResponse.json({ error: 'Gagal menghapus tautan.' }, { status: 500 });
  }
}
