import { cache } from 'react';
import { LYNK_APP_KEY } from '@/lib/picore/config';
import { createPicoreServerClient } from '@/lib/picore/server';
import { lynkRoleFrom, type LynkRole } from '@/lib/permissions';

/**
 * Who is calling, from the PI-CORE session (PI-CORE D-16). The session cookie belongs to PI-CORE's
 * Supabase Auth (set on this domain); the role comes from PI-CORE's my_app_roles('lynk').
 */
export type AccessStatus =
  | { kind: 'signed_out' }
  | { kind: 'no_access'; email: string; reason: 'no_role' | 'temporary_password' | 'inactive' }
  | { kind: 'ok'; email: string; name: string; role: LynkRole };

/** One evaluation per request. */
export const getAccessStatus = cache(async (): Promise<AccessStatus> => {
  const supabase = await createPicoreServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) return { kind: 'signed_out' };
  const email = user.email.toLowerCase();

  const [{ data: appRoles, error }, { data: member }] = await Promise.all([
    supabase.rpc('my_app_roles', { p_app: LYNK_APP_KEY }),
    supabase.from('members').select('full_name, is_active, must_change_password').eq('user_id', user.id).maybeSingle(),
  ]);
  if (error) throw new Error(`PI-CORE my_app_roles: ${error.message}`);

  const role = lynkRoleFrom(appRoles as string[] | null);
  if (!role) {
    const reason = !member || !member.is_active ? 'inactive' : member.must_change_password ? 'temporary_password' : 'no_role';
    return { kind: 'no_access', email, reason };
  }
  return { kind: 'ok', email, name: (member?.full_name as string | undefined) ?? email, role };
});

/**
 * For pages and API routes. `authorized` = any PI-LYNK role; check `role` (or lib/permissions) for
 * what the caller may do.
 */
export async function verifyAdminSession(): Promise<
  | { authorized: true; email: string; name: string; role: LynkRole }
  | { authorized: false; email: string | null; role: null }
> {
  const status = await getAccessStatus();
  if (status.kind === 'ok') return { authorized: true, email: status.email, name: status.name, role: status.role };
  return { authorized: false, email: status.kind === 'no_access' ? status.email : null, role: null };
}

/** Ends the PI-CORE session on this site only. */
export async function signOutHere() {
  const supabase = await createPicoreServerClient();
  await supabase.auth.signOut({ scope: 'local' });
}
