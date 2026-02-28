import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey().$defaultFn(() => 1),
  bandName: text('band_name').notNull().default('Westwood Community Band'),
  logoUrl: text('logo_url').notNull().default('/treble-clef.svg'),
  primaryColor: text('primary_color').notNull().default('#991b1b'),
  secondaryColor: text('secondary_color').notNull().default('#1e3a8a'),
  footerText: text('footer_text').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  layout: text('layout', { enum: ['full', 'sidebar-left', 'sidebar-right'] }).notNull().default('full'),
  sidebarWidth: integer('sidebar_width').notNull().default(25),
  sections: text('sections', { mode: 'json' }).notNull().$type<unknown[]>().default([]),
  sidebarBlocks: text('sidebar_blocks', { mode: 'json' }).$type<unknown[] | null>(),
  showInNav: integer('show_in_nav', { mode: 'boolean' }).default(true),
  navOrder: integer('nav_order').default(999),
  navLabel: text('nav_label'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  role: text('role').notNull().default('GUEST'),
  email: text('email'),
  passwordHash: text('password_hash'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  recipientLabel: text('recipient_label').notNull(),
  recipientId: text('recipient_id').notNull(),
  userAgent: text('user_agent'),
  remoteIp: text('remote_ip'),
});
