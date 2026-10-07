import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { verifyAdminSession } from '@/auth';
import { eq } from 'drizzle-orm';

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
    return NextResponse.json({ error: 'ID laporan tidak valid.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Status laporan tidak valid.' }, { status: 400 });
    }

    const updated = await db
      .update(reports)
      .set({
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolvedBy: status === 'resolved' ? auth.email : null,
      })
      .where(eq(reports.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status laporan.' }, { status: 500 });
  }
}
