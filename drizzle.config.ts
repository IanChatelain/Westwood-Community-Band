import { defineConfig } from 'drizzle-kit';

const url = process.env.TURSO_DATABASE_URL?.replace(/^TURSO_DATABASE_URL=/, '').trim() ?? '';
const isLocalFile = url.startsWith('file:');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: url || 'file:.data/local.db',
    ...(isLocalFile ? {} : { authToken: process.env.TURSO_AUTH_TOKEN }),
  },
});
