#!/usr/bin/env node
/**
 * One-time migration: copy all objects from Supabase Storage bucket to Cloudflare R2.
 * Preserves paths (e.g. images/photo.jpg -> images/photo.jpg in R2).
 *
 * Requires in .env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Run: node scripts/migrate-supabase-storage-to-r2.mjs
 *
 * Optional: SUPABASE_BUCKET (default: cms-uploads)
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'cms-uploads';

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME || 'cms-uploads';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!r2AccountId || !r2AccessKey || !r2SecretKey) {
  console.error('Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const supabaseHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

/**
 * List objects in Supabase Storage under a prefix.
 * Tries POST with body (storage API), then GET with query params.
 * Returns array of { name, id, metadata }.
 */
async function listSupabaseObjects(prefix) {
  const url = `${supabaseUrl}/storage/v1/object/list/${supabaseBucket}`;
  let res = await fetch(url, {
    method: 'POST',
    headers: supabaseHeaders,
    body: JSON.stringify({ prefix: prefix || '', limit: 1000 }),
  });
  if (!res.ok) {
    res = await fetch(`${url}?prefix=${encodeURIComponent(prefix || '')}&limit=1000`, {
      headers: supabaseHeaders,
    });
  }
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.files ?? data?.data ?? [];
}

/**
 * Recursively collect all file keys. For each item, if listing name/ as prefix
 * returns children, treat as folder; else treat as file.
 */
async function collectAllKeys(prefix = '', keys = []) {
  const items = await listSupabaseObjects(prefix);
  const nextPrefix = prefix.endsWith('/') ? prefix : prefix ? prefix + '/' : '';

  for (const item of items) {
    const name = item.name;
    if (!name || name.endsWith('/')) continue;
    const fullPath = nextPrefix ? nextPrefix + name : name;

    const childList = await listSupabaseObjects(fullPath + '/');
    const hasChildren = Array.isArray(childList) && childList.length > 0;
    if (hasChildren) {
      await collectAllKeys(fullPath + '/', keys);
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

/**
 * Download from Supabase. Uses authenticated endpoint so it works for private buckets.
 */
function getSupabaseDownloadUrl(objectKey) {
  const pathSegment = objectKey.split('/').map((s) => encodeURIComponent(s)).join('/');
  return `${supabaseUrl}/storage/v1/object/authenticated/${supabaseBucket}/${pathSegment}`;
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
});

async function migrate() {
  console.log('Listing objects in Supabase bucket:', supabaseBucket);

  const keys = await collectAllKeys();
  console.log('Found', keys.length, 'objects');

  let done = 0;
  let failed = 0;

  for (const key of keys) {
    try {
      const downloadUrl = getSupabaseDownloadUrl(key);
      const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${supabaseKey}` } });
      if (!res.ok) {
        console.warn('Skip (download failed):', key, res.status);
        failed++;
        continue;
      }
      const body = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';

      await r2Client.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: new Uint8Array(body),
          ContentType: contentType,
        })
      );

      done++;
      if (done % 10 === 0) console.log('Uploaded', done, '/', keys.length);
    } catch (err) {
      console.warn('Skip (error):', key, err.message);
      failed++;
    }
  }

  console.log('Done. Uploaded:', done, 'Failed:', failed);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
