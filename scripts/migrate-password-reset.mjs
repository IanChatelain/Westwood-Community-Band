import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('TURSO_DATABASE_URL is not set');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function columnExists(table, column) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => row.name === column);
}

async function migrate() {
  const columns = [
    { name: 'password_reset_token_hash', sql: "ALTER TABLE profiles ADD COLUMN password_reset_token_hash TEXT" },
    { name: 'password_reset_token_expires_at', sql: "ALTER TABLE profiles ADD COLUMN password_reset_token_expires_at TEXT" },
    { name: 'must_change_password', sql: "ALTER TABLE profiles ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0" },
  ];

  for (const col of columns) {
    if (await columnExists('profiles', col.name)) {
      console.log(`Column '${col.name}' already exists — skipping.`);
    } else {
      await client.execute(col.sql);
      console.log(`Added column '${col.name}'.`);
    }
  }

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
