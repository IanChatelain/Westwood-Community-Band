#!/usr/bin/env node
/**
 * Diagnostic: dump profiles and role_permissions rows from the configured Turso DB.
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

async function run() {
  console.log('--- Database URL:', url, '---\n');

  // 1. Check profiles
  console.log('=== profiles ===');
  try {
    const profiles = await client.execute('SELECT id, username, role, email FROM profiles ORDER BY username');
    if (profiles.rows.length === 0) {
      console.log('  (no rows)');
    } else {
      for (const r of profiles.rows) {
        console.log(`  id=${r.id}  username=${r.username}  role=${r.role}  email=${r.email}`);
      }
    }
    console.log(`  Total: ${profiles.rows.length} row(s)\n`);
  } catch (err) {
    console.error('  ERROR querying profiles:', err.message, '\n');
  }

  // 2. Check role_permissions
  console.log('=== role_permissions ===');
  try {
    const perms = await client.execute('SELECT * FROM role_permissions');
    if (perms.rows.length === 0) {
      console.log('  (no rows — table exists but is empty)');
    } else {
      for (const r of perms.rows) {
        console.log(`  role=${r.role}  access_admin=${r.can_access_admin}  manage_users=${r.can_manage_users}  manage_pages=${r.can_manage_pages}  manage_archive=${r.can_manage_archive}  manage_settings=${r.can_manage_settings}`);
      }
    }
    console.log(`  Total: ${perms.rows.length} row(s)\n`);
  } catch (err) {
    console.error('  ERROR querying role_permissions:', err.message);
    if (err.message.includes('no such table')) {
      console.error('  >>> The role_permissions table does not exist! You need to run: npx drizzle-kit push');
    }
    console.log();
  }

  // 3. List all tables with DDL
  console.log('=== all tables ===');
  try {
    const tables = await client.execute("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name");
    for (const r of tables.rows) {
      console.log(`  ${r.name}`);
    }
    // Check specifically for role_permissions DDL
    const rp = tables.rows.find(r => r.name === 'role_permissions');
    if (rp) {
      console.log('\n=== role_permissions DDL ===');
      console.log(rp.sql);
    } else {
      console.log('\n  role_permissions NOT in table list');
    }
  } catch (err) {
    console.error('  ERROR listing tables:', err.message);
  }

  // 4. Try creating the table manually if it doesn't exist
  console.log('\n=== Attempting to create role_permissions if not exists ===');
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS role_permissions (
      role text PRIMARY KEY,
      can_access_admin integer NOT NULL DEFAULT 0,
      can_manage_users integer NOT NULL DEFAULT 0,
      can_manage_pages integer NOT NULL DEFAULT 0,
      can_manage_archive integer NOT NULL DEFAULT 0,
      can_manage_settings integer NOT NULL DEFAULT 0,
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`);
    console.log('  Table created (or already existed).');

    // Verify
    const check = await client.execute('SELECT COUNT(*) as cnt FROM role_permissions');
    console.log(`  Row count: ${check.rows[0].cnt}`);
  } catch (err) {
    console.error('  ERROR creating table:', err.message);
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
