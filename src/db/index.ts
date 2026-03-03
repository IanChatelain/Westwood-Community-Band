import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// In case .env has a malformed line like TURSO_DATABASE_URL=TURSO_DATABASE_URL=..., use only the URL part
function getDatabaseUrl(): string {
  const raw = process.env.TURSO_DATABASE_URL ?? '';
  const url = raw.replace(/^TURSO_DATABASE_URL=/, '').trim();
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL must be set in .env. Use file:.data/local.db for local dev or libsql://... for Turso cloud. ' +
        'In Vercel: Project → Settings → Environment Variables. Add TURSO_DATABASE_URL and (for cloud Turso) TURSO_AUTH_TOKEN.',
    );
  }
  // Support file: for local SQLite (e.g. file:.data/local.db or file:///abs/path/local.db)
  if (url.startsWith('file:')) return url;
  if (url.startsWith('libsql://')) {
    const token = process.env.TURSO_AUTH_TOKEN ?? '';
    if (!token.trim()) {
      throw new Error(
        'TURSO_AUTH_TOKEN must be set when using cloud Turso (libsql://). ' +
          'In Vercel: Project → Settings → Environment Variables.',
      );
    }
    return url;
  }
  throw new Error(
    'TURSO_DATABASE_URL must be file:... (local SQLite) or libsql://... (Turso cloud). ' +
      'Check Vercel environment variables if deploying.',
  );
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
