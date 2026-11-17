import { pgTable, text, timestamp, boolean, integer, varchar, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';

export const links = pgTable('links', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar('slug', { length: 50 }).notNull(),
  destinationUrl: text('destination_url').notNull(),
  title: varchar('title', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, blocked
  statusReason: text('status_reason'),
  isOfficial: boolean('is_official').notNull().default(false),
  createdBy: varchar('created_by', { length: 255 }), // admin email or null for public
  clickCount: integer('click_count').notNull().default(0),
  lastClickedAt: timestamp('last_clicked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  uniqueIndex('links_slug_unique').on(table.slug),
  index('links_status_idx').on(table.status),
  index('links_is_official_idx').on(table.isOfficial),
  index('links_created_at_idx').on(table.createdAt),
]));

export const reports = pgTable('reports', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  slugOrUrl: text('slug_or_url').notNull(),
  reason: text('reason').notNull(),
  contactInfo: varchar('contact_info', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, resolved
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  index('reports_status_idx').on(table.status),
  index('reports_created_at_idx').on(table.createdAt),
]));

export const rateLimits = pgTable('rate_limits', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  ipHash: varchar('ip_hash', { length: 128 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'create_link', 'report', 'admin_login'
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  index('rate_limits_ip_action_window_idx').on(table.ipHash, table.action, table.windowStart),
]));

/**
 * Who did what in the admin area (owner request 2026-11-18). Written by the API routes after each
 * change; read by admins in the dashboard ("Riwayat"). Actor = PI-CORE account email.
 */
export const auditLog = pgTable('audit_log', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  actorEmail: varchar('actor_email', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 20 }).notNull(), // admin | pengurus
  action: varchar('action', { length: 40 }).notNull(), // link.create, link.update, link.delete, links.import, report.update
  targetType: varchar('target_type', { length: 20 }).notNull(), // link | report | import
  targetId: integer('target_id'),
  summary: text('summary').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  index('audit_log_created_at_idx').on(table.createdAt),
  index('audit_log_actor_idx').on(table.actorEmail),
]));

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type AuditEntry = typeof auditLog.$inferSelect;
