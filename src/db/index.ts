import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// In case .env has a malformed line like TURSO_DATABASE_URL=TURSO_DATABASE_URL=..., use only the URL part
function getDatabaseUrl(): string {
  const raw = process.env.TURSO_DATABASE_URL ?? '';
  const url = raw.replace(/^TURSO_DATABASE_URL=/, '').trim();
  if (!url) {
    throw new Error('TURSO_DATABASE_URL must be set in .env (use file:.data/local.db for local dev or libsql://... for Turso cloud)');
  }
  // Support file: for local SQLite (e.g. file:.data/local.db or file:///abs/path/local.db)
  if (url.startsWith('file:')) return url;
  if (url.startsWith('libsql://')) return url;
  throw new Error('TURSO_DATABASE_URL must be file:... (local) or libsql://... (Turso cloud)');
}

function isLocalFile(url: string): boolean {
  return url.startsWith('file:');
}

const dbUrl = getDatabaseUrl();
const tursoClient = createClient({
  url: dbUrl,
  ...(isLocalFile(dbUrl) ? {} : { authToken: process.env.TURSO_AUTH_TOKEN }),
});

export const db = drizzle(tursoClient, { schema });
