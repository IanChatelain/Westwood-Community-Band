#!/usr/bin/env node
/**
 * Backfill Media page video-gallery items from R2.
 *
 * Use this after running the WordPress WXR import + media-hub migrations,
 * which can leave the "Videos" tab empty even though videos exist in R2.
 *
 * What it does:
 * - Lists objects in the R2 bucket under videos/imported/
 * - Builds videoItems for the Media page video-gallery section (m2-videos)
 * - Writes updated sections JSON back to Turso
 *
 * Usage:
 *   node scripts/backfill-media-videos-from-r2.mjs
 *
 * Required env:
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN (for cloud)
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 *   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (or S3_ENDPOINT + MINIO creds for local)
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

// ─── Turso client ──────────────────────────────────────────────────────────────

const rawUrl = (process.env.TURSO_DATABASE_URL || '').replace(/^TURSO_DATABASE_URL=/, '').trim();
const tursoUrl = rawUrl || process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = tursoUrl?.startsWith('file:');

if (!tursoUrl) {
  console.error('Missing TURSO_DATABASE_URL');
  process.exit(1);
}
if (!isLocalFile && !tursoToken) {
  console.error('TURSO_AUTH_TOKEN is required for cloud Turso (libsql://...)');
  process.exit(1);
}

const turso = createClient(isLocalFile ? { url: tursoUrl } : { url: tursoUrl, authToken: tursoToken });

// ─── R2/S3 client ─────────────────────────────────────────────────────────────

const r2Bucket = process.env.R2_BUCKET_NAME || 'cms-uploads';
const r2PublicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD;
const s3Endpoint = process.env.S3_ENDPOINT || process.env.R2_LOCAL_ENDPOINT;

if (!r2PublicUrl) {
  console.error('Missing R2_PUBLIC_URL (base URL for public object access)');
  process.exit(1);
}

let s3Client;
if (s3Endpoint) {
  // Normalize endpoints that accidentally include the bucket path, e.g.
  // https://...r2.cloudflarestorage.com/cms-uploads → https://...r2.cloudflarestorage.com
  const bucketPath = `/${r2Bucket}`;
  let endpoint = s3Endpoint;
  if (endpoint.endsWith(bucketPath)) {
    endpoint = endpoint.slice(0, -bucketPath.length);
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
    },
    forcePathStyle: true,
  });
} else {
  if (!r2AccountId || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error('Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY for cloud R2');
    process.exit(1);
  }
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).substring(2, 11);
}

function titleFromKey(key) {
  const base = path.basename(key).replace(/\.[^.]+$/, '');
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseSections(row) {
  const raw = row.sections;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function listImportedVideos() {
  const prefix = 'videos/imported/';
  const items = [];
  let continuationToken;

  console.log(`Listing R2 objects in bucket "${r2Bucket}" with prefix "${prefix}" ...`);

  // Paginate in case there are many videos
  while (true) {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: r2Bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of res.Contents || []) {
      const key = obj.Key;
      if (!key) continue;
      if (key.endsWith('/')) continue;
      if (!/\.(mp4|webm|mov|m4v)$/i.test(key)) continue;
      items.push({
        id: uid(),
        type: 'video',
        url: `${r2PublicUrl}/${key}`,
        caption: titleFromKey(key),
      });
    }

    if (!res.IsTruncated || !res.NextContinuationToken) break;
    continuationToken = res.NextContinuationToken;
  }

  console.log(`Found ${items.length} video object(s) in R2.`);
  return items;
}

async function backfill() {
  console.log('Fetching /media page from Turso ...');
  const { rows } = await turso.execute({
    sql: 'SELECT id, slug, sections FROM pages WHERE slug = ? LIMIT 1',
    args: ['/media'],
  });

  if (!rows || rows.length === 0) {
    console.error('No page with slug /media found in Turso.');
    process.exit(1);
  }

  const mediaPage = rows[0];
  const sections = parseSections(mediaPage);

  const videoSection = sections.find(
    (s) => s && s.type === 'video-gallery' && (s.id === 'm2-videos' || s.tabGroup === 'media')
  );

  if (!videoSection) {
    console.error('Could not find a video-gallery section on /media (expected id "m2-videos").');
    process.exit(1);
  }

  if (Array.isArray(videoSection.videoItems) && videoSection.videoItems.length > 0) {
    console.log('Video gallery already has items; no changes made.');
    return;
  }

  const videoItems = await listImportedVideos();
  if (videoItems.length === 0) {
    console.log('No videos found in R2 under videos/imported/; nothing to backfill.');
    return;
  }

  videoSection.videoItems = videoItems;

  const updatedAt = new Date().toISOString();
  const sectionsJson = JSON.stringify(sections);

  await turso.execute({
    sql: 'UPDATE pages SET sections = ?, updated_at = ? WHERE id = ?',
    args: [sectionsJson, updatedAt, mediaPage.id],
  });

  console.log(`Updated /media page video-gallery with ${videoItems.length} video item(s).`);
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

