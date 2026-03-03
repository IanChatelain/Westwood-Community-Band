#!/usr/bin/env node
/**
 * Seed the role_permissions table with sensible defaults for each role.
 * Safe to re-run — uses INSERT OR IGNORE so existing rows are not overwritten.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const rawUrl = process.env.TURSO_DATABASE_URL?.replace(/^TURSO_DATABASE_URL=/, '').trim();
const url = rawUrl || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = url?.startsWith('file:');

if (!url) { console.error('Missing TURSO_DATABASE_URL'); process.exit(1); }

const client = createClient(isLocalFile ? { url } : { url, authToken });

const DEFAULTS = [
  { role: 'ADMIN',  access: 1, users: 1, pages: 1, archive: 1, settings: 1 },
  { role: 'EDITOR', access: 1, users: 0, pages: 1, archive: 1, settings: 0 },
  { role: 'MEMBER', access: 0, users: 0, pages: 0, archive: 0, settings: 0 },
  { role: 'GUEST',  access: 0, users: 0, pages: 0, archive: 0, settings: 0 },
];

async function seed() {
  const now = new Date().toISOString();

  // Ensure table exists
  await client.execute(`CREATE TABLE IF NOT EXISTS role_permissions (
    role text PRIMARY KEY,
    can_access_admin integer NOT NULL DEFAULT 0,
    can_manage_users integer NOT NULL DEFAULT 0,
    can_manage_pages integer NOT NULL DEFAULT 0,
    can_manage_archive integer NOT NULL DEFAULT 0,
    can_manage_settings integer NOT NULL DEFAULT 0,
    updated_at text NOT NULL DEFAULT (datetime('now'))
  )`);

  for (const d of DEFAULTS) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO role_permissions
            (role, can_access_admin, can_manage_users, can_manage_pages, can_manage_archive, can_manage_settings, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [d.role, d.access, d.users, d.pages, d.archive, d.settings, now],
    });
    console.log(`  ${d.role}: ok`);
  }

  // Verify
  const rows = await client.execute('SELECT role, can_access_admin, can_manage_users, can_manage_pages, can_manage_archive, can_manage_settings FROM role_permissions ORDER BY role');
  console.log('\nVerification:');
  for (const r of rows.rows) {
    console.log(`  ${r.role}: access=${r.can_access_admin} users=${r.can_manage_users} pages=${r.can_manage_pages} archive=${r.can_manage_archive} settings=${r.can_manage_settings}`);
  }
  console.log('\nDone.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
