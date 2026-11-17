import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/auth';
import type { LynkRole } from '@/lib/permissions';

type Caller = { email: string; name: string; role: LynkRole };

/** API guard: 401 without a PI-LYNK role, 403 when `min` is admin and the caller is pengurus. */
export async function requireLynkRole(
  min: LynkRole
): Promise<{ ok: true; caller: Caller } | { ok: false; response: NextResponse }> {
  const auth = await verifyAdminSession();
  if (!auth.authorized) {
    return { ok: false, response: NextResponse.json({ error: 'Silakan masuk dengan akun PI-CORE yang punya akses PI-LYNK.' }, { status: 401 }) };
  }
  if (min === 'admin' && auth.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Hanya admin PI-LYNK yang bisa melakukan ini.' }, { status: 403 }) };
  }
  return { ok: true, caller: { email: auth.email, name: auth.name, role: auth.role } };
}
