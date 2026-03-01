import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// In case .env has a malformed line like TURSO_DATABASE_URL=TURSO_DATABASE_URL=libsql://..., use only the URL part
function getTursoUrl(): string {
  const raw = process.env.TURSO_DATABASE_URL ?? '';
  const url = raw.replace(/^TURSO_DATABASE_URL=/, '').trim();
  if (!url.startsWith('libsql://')) {
    throw new Error('TURSO_DATABASE_URL must be set to a libsql:// URL in .env (e.g. TURSO_DATABASE_URL=libsql://your-db.turso.io)');
  }
  return url;
}

const tursoClient = createClient({
  url: getTursoUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient, { schema });
