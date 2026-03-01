#!/usr/bin/env node
/**
 * Seed DB (Turso cloud or local file): site_settings (id=1) and one admin profile.
 * Requires: TURSO_DATABASE_URL; TURSO_AUTH_TOKEN only for libsql://; SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

// Load .env from project root (parent of scripts/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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
  console.error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD. Set them in .env to create an admin user.');
  process.exit(1);
}

const client = createClient(isLocalFile ? { url } : { url, authToken });

async function seed() {
  const now = new Date().toISOString();

  // 1. Site settings (id=1) - insert or ignore if already exists
  await client.execute({
    sql: `INSERT OR IGNORE INTO site_settings (id, band_name, logo_url, primary_color, secondary_color, footer_text, updated_at)
          VALUES (1, 'Westwood Community Band', '/treble-clef.svg', '#991b1b', '#1e3a8a', '© 2026 Westwood Community Band. Forty-five Years of Making Music.', ?)`,
    args: [now],
  });
  console.log('Site settings: ok (id=1)');

  // 2. Admin profile - fixed id so re-run doesn't duplicate; update password if row exists
  const seedAdminId = 'seed-admin';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await client.execute({
    sql: `INSERT INTO profiles (id, username, role, email, password_hash, updated_at)
          VALUES (?, 'admin', 'ADMIN', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET email = excluded.email, password_hash = excluded.password_hash, updated_at = excluded.updated_at`,
    args: [seedAdminId, adminEmail, passwordHash, now],
  });
  console.log('Admin profile: ok (id:', seedAdminId + ', email:', adminEmail + ')');

  console.log('Seed done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
