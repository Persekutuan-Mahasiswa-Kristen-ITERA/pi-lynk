import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { requireLynkRole } from '@/lib/api-auth';
import { count, desc, ilike, or } from 'drizzle-orm';

/** GET /api/admin/audit?q=&page= : history of admin actions, newest first (admins only). */
export async function GET(request: NextRequest) {
  const guard = await requireLynkRole('admin');
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = 30;
  const where = q ? or(ilike(auditLog.actorEmail, `%${q}%`), ilike(auditLog.summary, `%${q}%`)) : undefined;

  try {
    const [{ total }] = await db.select({ total: count() }).from(auditLog).where(where);
    const items = await db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    return NextResponse.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json({ error: 'Gagal memuat riwayat.' }, { status: 500 });
  }
}
