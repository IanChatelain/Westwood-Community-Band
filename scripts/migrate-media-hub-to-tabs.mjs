#!/usr/bin/env node
/**
 * One-time migration: split each "media-hub" section into three tab-grouped sections
 * (gallery for Photos, audio-playlist for Recordings, video-gallery for Videos).
 *
 * Run: npm run db:migrate-media-hub-to-tabs
 * (or: node scripts/migrate-media-hub-to-tabs.mjs)
 *
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN in .env
 *
 * What it does:
 * - Reads all pages from Turso
 * - For each page, finds sections with type === 'media-hub'
 * - Replaces each media-hub with three sections (same order as before):
 *   - gallery: mediaPhotos -> galleryEvents, tabGroup 'media', tabLabel 'Photos'
 *   - audio-playlist: mediaRecordings -> audioItems, tabGroup 'media', tabLabel 'Recordings'
 *   - video-gallery: mediaVideos -> videoItems, tabGroup 'media', tabLabel 'Videos'
 * - Writes updated sections back. Other sections are unchanged.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

let url = process.env.TURSO_DATABASE_URL ?? '';
url = url.replace(/^TURSO_DATABASE_URL=/, '').trim();
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url.startsWith('libsql://') || !authToken) {
  console.error('Missing or invalid TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ url, authToken });

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

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Replace one media-hub section with three sections (gallery, audio-playlist, video-gallery).
 */
function expandMediaHubSection(mediaHub) {
  const photos = mediaHub.mediaPhotos ?? [];
  const recordings = mediaHub.mediaRecordings ?? [];
  const videos = mediaHub.mediaVideos ?? [];

  const result = [];

  result.push({
    id: mediaHub.id + '-photos',
    type: 'gallery',
    title: 'Photos',
    content: '',
    tabGroup: 'media',
    tabLabel: 'Photos',
    galleryEvents: photos,
  });

  result.push({
    id: mediaHub.id + '-recordings',
    type: 'audio-playlist',
    title: 'Recordings',
    content: '',
    tabGroup: 'media',
    tabLabel: 'Recordings',
    audioItems: recordings,
  });

  result.push({
    id: mediaHub.id + '-videos',
    type: 'video-gallery',
    title: 'Videos',
    content: '',
    tabGroup: 'media',
    tabLabel: 'Videos',
    videoItems: videos,
  });

  return result;
}

async function migrate() {
  const { rows } = await client.execute('SELECT * FROM pages');
  if (!rows || rows.length === 0) {
    console.log('No pages in database. Nothing to migrate.');
    return;
  }

  let totalReplaced = 0;

  for (const row of rows) {
    const sections = parseSections(row);
    const newSections = [];
    let changed = false;

    for (const section of sections) {
      if (!section) {
        newSections.push(section);
        continue;
      }
      if (section.type === 'media-hub') {
        newSections.push(...expandMediaHubSection(section));
        changed = true;
        totalReplaced++;
      } else {
        newSections.push(section);
      }
    }

    if (changed) {
      const sectionsJson = JSON.stringify(newSections);
      const updatedAt = new Date().toISOString();
      await client.execute({
        sql: 'UPDATE pages SET sections = ?, updated_at = ? WHERE id = ?',
        args: [sectionsJson, updatedAt, row.id],
      });
      console.log('Updated page:', row.slug || row.id, '- replaced media-hub with tab-grouped sections');
    }
  }

  if (totalReplaced === 0) {
    console.log('No media-hub sections found. Nothing to migrate.');
  } else {
    console.log('Done. Replaced', totalReplaced, 'media-hub section(s). Reload the site to see the tabbed layout.');
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
