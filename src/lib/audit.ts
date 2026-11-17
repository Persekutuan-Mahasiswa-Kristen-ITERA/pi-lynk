import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import type { LynkRole } from '@/lib/permissions';

export type AuditAction = 'link.create' | 'link.update' | 'link.delete' | 'links.import' | 'report.update';

/**
 * Appends one history row. The Neon HTTP driver has no interactive transactions, so this runs right
 * after the change; a failure is logged loudly but does not undo a change that already happened.
 */
export async function recordAudit(
  actor: { email: string; role: LynkRole },
  entry: { action: AuditAction; targetType: 'link' | 'report' | 'import'; targetId?: number | null; summary: string; details?: unknown }
) {
  try {
    await db.insert(auditLog).values({
      actorEmail: actor.email,
      actorRole: actor.role,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      summary: entry.summary.slice(0, 500),
      details: entry.details ?? null,
    });
  } catch (error) {
    console.error('AUDIT LOG WRITE FAILED', entry.action, entry.targetId, error);
  }
}
