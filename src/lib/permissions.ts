/**
 * What each PI-LYNK role may do (roles come from PI-CORE, D-16). Pure functions, unit tested.
 *   admin     every link, official links and protected slugs, reports, import, history
 *   pengurus  create links (not official, no protected slugs); change or delete only their own
 */
export type LynkRole = 'admin' | 'pengurus';

/** The PI-LYNK role from PI-CORE's my_app_roles('lynk'); admin wins. Null = no access. */
export function lynkRoleFrom(appRoles: readonly string[] | null | undefined): LynkRole | null {
  if (!appRoles) return null;
  if (appRoles.includes('admin')) return 'admin';
  if (appRoles.includes('pengurus')) return 'pengurus';
  return null;
}

export const isAdmin = (role: LynkRole) => role === 'admin';

/** Owner check: created_by holds the creator's email (case-insensitive). */
export function ownsLink(email: string, link: { createdBy: string | null }): boolean {
  return Boolean(link.createdBy) && link.createdBy!.toLowerCase() === email.toLowerCase();
}

export function canManageLink(role: LynkRole, email: string, link: { createdBy: string | null }): boolean {
  return isAdmin(role) || ownsLink(email, link);
}

/**
 * Fields a pengurus may not set: blocking a link (moderation) and the "official" mark are admin only.
 * Returns an error message, or null when the change is allowed.
 */
export function forbiddenLinkChange(
  role: LynkRole,
  change: { status?: unknown; isOfficial?: unknown },
  current: { status: string; isOfficial: boolean }
): string | null {
  if (isAdmin(role)) return null;
  if (current.status === 'blocked') return 'Tautan ini diblokir admin; hubungi admin PI-LYNK.';
  if (change.status === 'blocked') return 'Hanya admin yang bisa memblokir tautan.';
  if (change.isOfficial !== undefined && change.isOfficial !== current.isOfficial)
    return 'Hanya admin yang bisa mengubah tanda tautan resmi.';
  return null;
}
