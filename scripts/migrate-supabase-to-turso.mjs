#!/usr/bin/env node
/**
 * One-time migration: copy site_settings, pages, and contact_messages from Supabase to Turso.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for full read), TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 *
 * Run: node scripts/migrate-supabase-to-turso.mjs
 *
 * Note: Profiles are NOT migrated (Supabase profiles have no password; use your seed admin to log in).
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient as createTurso } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY. Set them in .env to run this migration.');
  process.exit(1);
}
if (!tursoUrl || !tursoToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.');
  process.exit(1);
}

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function fetchTable(table) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

const turso = createTurso({ url: tursoUrl, authToken: tursoToken });

async function migrate() {
  console.log('Fetching from Supabase...');

  const [siteSettingsRows, pagesRows, contactRows] = await Promise.all([
    fetchTable('site_settings'),
    fetchTable('pages'),
    fetchTable('contact_messages'),
  ]);

  console.log('site_settings:', siteSettingsRows.length);
  console.log('pages:', pagesRows.length);
  console.log('contact_messages:', contactRows.length);

  if (siteSettingsRows.length > 0) {
    const row = siteSettingsRows[0];
    const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString();
    await turso.execute({
      sql: `INSERT INTO site_settings (id, band_name, logo_url, primary_color, secondary_color, footer_text, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              band_name = excluded.band_name,
              logo_url = excluded.logo_url,
              primary_color = excluded.primary_color,
              secondary_color = excluded.secondary_color,
              footer_text = excluded.footer_text,
              updated_at = excluded.updated_at`,
      args: [
        row.band_name ?? 'Westwood Community Band',
        row.logo_url ?? '/treble-clef.svg',
        row.primary_color ?? '#991b1b',
        row.secondary_color ?? '#1e3a8a',
        row.footer_text ?? '',
        updatedAt,
      ],
    });
    console.log('Migrated site_settings (id=1)');
  }

  for (const row of pagesRows) {
    const sections = typeof row.sections === 'string' ? row.sections : JSON.stringify(row.sections ?? []);
    const sidebarBlocks = row.sidebar_blocks != null
      ? (typeof row.sidebar_blocks === 'string' ? row.sidebar_blocks : JSON.stringify(row.sidebar_blocks))
      : null;
    const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();
    const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString();

    await turso.execute({
      sql: `INSERT INTO pages (id, title, slug, layout, sidebar_width, sections, sidebar_blocks, show_in_nav, nav_order, nav_label, is_archived, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              slug = excluded.slug,
              layout = excluded.layout,
              sidebar_width = excluded.sidebar_width,
              sections = excluded.sections,
              sidebar_blocks = excluded.sidebar_blocks,
              show_in_nav = excluded.show_in_nav,
              nav_order = excluded.nav_order,
              nav_label = excluded.nav_label,
              is_archived = excluded.is_archived,
              updated_at = excluded.updated_at`,
      args: [
        row.id,
        row.title,
        row.slug,
        row.layout ?? 'full',
        row.sidebar_width ?? 25,
        sections,
        sidebarBlocks,
        row.show_in_nav !== false ? 1 : 0,
        row.nav_order ?? 999,
        row.nav_label ?? null,
        row.is_archived === true ? 1 : 0,
        createdAt,
        updatedAt,
      ],
    });
  }
  console.log('Migrated', pagesRows.length, 'pages');

  for (const row of contactRows) {
    const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();
    await turso.execute({
      sql: `INSERT OR IGNORE INTO contact_messages (id, created_at, sender_name, sender_email, subject, message, recipient_label, recipient_id, user_agent, remote_ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        row.id,
        createdAt,
        row.sender_name,
        row.sender_email,
        row.subject ?? null,
        row.message,
        row.recipient_label,
        row.recipient_id,
        row.user_agent ?? null,
        row.remote_ip ?? null,
      ],
    });
  }
  console.log('Migrated', contactRows.length, 'contact_messages');

  console.log('Done. Profiles were not migrated (use your seed admin to log in).');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
