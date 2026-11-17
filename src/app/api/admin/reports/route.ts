import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { requireLynkRole } from '@/lib/api-auth';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const guard = await requireLynkRole('admin');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  try {
    const items = await db
      .select()
      .from(reports)
      .where(status ? eq(reports.status, status) : undefined)
      .orderBy(desc(reports.createdAt));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar laporan.' }, { status: 500 });
  }
}
