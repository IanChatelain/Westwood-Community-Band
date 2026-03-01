#!/usr/bin/env node
/**
 * Seed DB (Turso cloud or local file): site_settings (id=1), one admin profile, and optionally initial pages.
 * Requires: TURSO_DATABASE_URL; TURSO_AUTH_TOKEN only for libsql://; SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 * Optional: SEED_INITIAL_PAGES=1 to seed pages from scripts/initial-pages.json when DB has no pages.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
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

  // 3. Optional: seed initial pages when DB has none (e.g. fresh local/production)
  const seedPages = process.env.SEED_INITIAL_PAGES === '1' || process.env.SEED_INITIAL_PAGES === 'true';
  if (seedPages) {
    const countResult = await client.execute({ sql: 'SELECT COUNT(*) as n FROM pages' });
    const pageCount = countResult.rows[0]?.n ?? 0;
    if (pageCount === 0) {
      const pagesPath = path.join(__dirname, 'initial-pages.json');
      if (fs.existsSync(pagesPath)) {
        const pages = JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
        for (const p of pages) {
          await client.execute({
            sql: `INSERT INTO pages (id, title, slug, layout, sidebar_width, sections, sidebar_blocks, show_in_nav, nav_order, nav_label, is_archived, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            args: [
              p.id,
              p.title,
              p.slug,
              p.layout || 'full',
              p.sidebarWidth ?? 25,
              JSON.stringify(p.sections || []),
              p.sidebarBlocks ? JSON.stringify(p.sidebarBlocks) : null,
              p.showInNav !== false ? 1 : 0,
              p.navOrder ?? 999,
              p.navLabel ?? null,
              now,
            ],
          });
        }
        console.log('Initial pages: ok (' + pages.length + ' pages)');
      } else {
        console.log('Initial pages: skipped (initial-pages.json not found)');
      }
    } else {
      console.log('Initial pages: skipped (pages already exist)');
    }
  }

  console.log('Seed done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
