#!/usr/bin/env node
/**
 * Seed ONLY the admin profile in the `profiles` table.
 *
 * Requires:
 * - TURSO_DATABASE_URL
 * - TURSO_AUTH_TOKEN (only for libsql:// URLs, not file:)
 * - SEED_ADMIN_EMAIL
 * - SEED_ADMIN_PASSWORD
 *
 * This script does NOT touch `site_settings` or `pages`.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Load .env from project root (parent of scripts/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const rawUrl = process.env.TURSO_DATABASE_URL?.replace(/^TURSO_DATABASE_URL=/, '').trim();
const url = rawUrl || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = url?.startsWith('file:');
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!url) {
  console.error('Missing TURSO_DATABASE_URL');
  process.exit(1);
}
if (!isLocalFile && !authToken) {
  console.error('TURSO_AUTH_TOKEN is required when using Turso cloud (libsql://...)');
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD. Set them in .env/.env.local to create an admin user.');
  process.exit(1);
}

const client = createClient(isLocalFile ? { url } : { url, authToken });

async function seedProfile() {
  const now = new Date().toISOString();

  // Admin profile - fixed id so re-run doesn't duplicate; update password if row exists
  const seedAdminId = 'seed-admin';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await client.execute({
    sql: `INSERT INTO profiles (id, username, role, email, password_hash, updated_at)
          VALUES (?, 'admin', 'ADMIN', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET email = excluded.email, password_hash = excluded.password_hash, updated_at = excluded.updated_at`,
    args: [seedAdminId, adminEmail, passwordHash, now],
  });

  console.log('Admin profile: ok (id:', seedAdminId + ', email:', adminEmail + ')');
  console.log('Seed profile done.');
}

seedProfile().catch((err) => {
  console.error('Seed profile failed:', err);
  process.exit(1);
});

