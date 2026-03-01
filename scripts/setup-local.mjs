#!/usr/bin/env node
/**
 * One-time local dev setup: create .data, .env.local from example, push DB schema, optionally create MinIO bucket.
 * Run from repo root: node scripts/setup-local.mjs  (or npm run setup:local)
 * Prerequisites: For MinIO, run first: docker compose up -d
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Load .env then .env.local so local overrides (override: true so .env.local wins)
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

const envLocalPath = path.join(root, '.env.local');
const envLocalExamplePath = path.join(root, '.env.local.example');
const dataDir = path.join(root, '.data');

function step(msg) {
  console.log('\n►', msg);
}

// 1. Ensure .data exists
step('Ensuring .data directory exists');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('  Created .data');
} else {
  console.log('  .data exists');
}

// 2. Create .env.local from example if missing
if (!existsSync(envLocalPath)) {
  if (!existsSync(envLocalExamplePath)) {
    console.error('  .env.local.example not found. Create .env.local manually with local Turso + MinIO vars.');
    process.exit(1);
  }
  step('Creating .env.local from .env.local.example');
  copyFileSync(envLocalExamplePath, envLocalPath);
  console.log('  Created .env.local — edit if needed (AUTH_SECRET, SEED_ADMIN_*)');
  // Reload so next steps see local vars (override so file: URL is used)
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.log('  .env.local exists');
}

// 3. Resolve DB URL for this process (drizzle-kit will read from env)
const dbUrl = (process.env.TURSO_DATABASE_URL || '').replace(/^TURSO_DATABASE_URL=/, '').trim() || 'file:.data/local.db';
if (!dbUrl.startsWith('file:')) {
  console.log('  TURSO_DATABASE_URL is not file: — skipping local DB init (using Turso cloud).');
} else {
  step('Pushing schema to local DB (drizzle-kit push)');
  const push = spawnSync('npx', ['drizzle-kit', 'push'], {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, TURSO_DATABASE_URL: dbUrl },
  });
  if (push.status !== 0) {
    console.error('  drizzle-kit push failed');
    process.exit(1);
  }
  console.log('  Schema pushed.');
}

// 4. Optional: create MinIO bucket
const s3Endpoint = process.env.S3_ENDPOINT || process.env.R2_LOCAL_ENDPOINT;
const bucket = process.env.R2_BUCKET_NAME || 'cms-uploads';
const accessKey = process.env.R2_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER;
const secretKey = process.env.R2_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD;

if (s3Endpoint && accessKey && secretKey) {
  step('Creating MinIO bucket if missing');
  try {
    const { S3Client, CreateBucketCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'us-east-1',
      endpoint: s3Endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log('  Bucket', bucket, 'already exists');
    } catch (e) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log('  Created bucket', bucket);
      } else {
        console.warn('  Could not create bucket:', e.message);
      }
    }
  } catch (err) {
    console.warn('  MinIO bucket check skipped (is MinIO running? docker compose up -d):', err.message);
  }
} else {
  console.log('  S3_ENDPOINT not set — skipping MinIO bucket (use cloud R2 or start MinIO and set .env.local).');
}

step('Done');
console.log(`
  Next steps:
  1. If using MinIO: docker compose up -d  (then re-run this script to create bucket)
  2. (Optional) Seed admin: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local, then npm run db:seed
  3. Start app: npm run dev
`);
