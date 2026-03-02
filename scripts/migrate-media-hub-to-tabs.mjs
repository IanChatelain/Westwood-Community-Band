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
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

let url = (process.env.TURSO_DATABASE_URL ?? '').replace(/^TURSO_DATABASE_URL=/, '').trim();
const authToken = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = url.startsWith('file:');

if (!url.startsWith('libsql://') && !isLocalFile) {
  console.error('Missing or invalid TURSO_DATABASE_URL in .env / .env.local (expected libsql://... or file:...)');
  process.exit(1);
}
if (!isLocalFile && !authToken) {
  console.error('TURSO_AUTH_TOKEN is required when using Turso cloud (libsql://...)');
  process.exit(1);
}

const client = createClient(isLocalFile ? { url } : { url, authToken });

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

function hasTabGroupMedia(sections) {
  return sections.some((s) => s && s.tabGroup === 'media');
}

/** Collect existing recordings/videos/photo albums from current page sections so we don't overwrite real data. */
function collectExistingMedia(sections) {
  let audioItems = [];
  let videoItems = [];
  let galleryEvents = [];
  for (const s of sections || []) {
    if (!s) continue;
    if (s.type === 'media-hub') {
      if (s.mediaRecordings?.length) audioItems = s.mediaRecordings;
      if (s.mediaVideos?.length) videoItems = s.mediaVideos;
      if (s.mediaPhotos?.length) galleryEvents = s.mediaPhotos;
      break;
    }
    if (s.type === 'audio-playlist' && s.audioItems?.length) audioItems = s.audioItems;
    if (s.type === 'video-gallery' && s.videoItems?.length) videoItems = s.videoItems;
    if (s.type === 'gallery' && s.galleryEvents?.length) galleryEvents = s.galleryEvents;
  }
  return { audioItems, videoItems, galleryEvents };
}

/** Default Media page sections. Pass existing media to preserve it (avoid overwriting real recordings/videos). */
function getDefaultMediaPageSections(existing = {}) {
  const {
    audioItems: existingAudio = [],
    videoItems: existingVideos = [],
    galleryEvents: existingPhotos = [],
  } = existing;

  const defaultRecordings = [];

  const defaultPhotos = [];

  return [
    {
      id: 'm1',
      type: 'hero',
      title: 'Photos, Recordings & Videos',
      content: 'Browse photos from our concerts, listen to recordings, and watch videos of the Westwood Community Band.',
      imageUrl: '/images/media.jpg',
    },
    {
      id: 'm2-photos',
      type: 'gallery',
      title: 'Photos',
      content: '',
      tabGroup: 'media',
      tabLabel: 'Photos',
      galleryEvents: existingPhotos.length > 0 ? existingPhotos : defaultPhotos,
    },
    {
      id: 'm2-recordings',
      type: 'audio-playlist',
      title: 'Recordings',
      content: '',
      tabGroup: 'media',
      tabLabel: 'Recordings',
      audioItems: existingAudio.length > 0 ? existingAudio : defaultRecordings,
    },
    {
      id: 'm2-videos',
      type: 'video-gallery',
      title: 'Videos',
      content: '',
      tabGroup: 'media',
      tabLabel: 'Videos',
      videoItems: existingVideos.length > 0 ? existingVideos : [],
    },
    {
      id: 'm3',
      type: 'text',
      title: 'International Music Camp',
      content: 'The <a href="http://www.internationalmusiccamp.com/" target="_blank" rel="noopener noreferrer">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience. The performance was recorded and several of the tracks are available in the Recordings tab above.',
    },
    {
      id: 'm4',
      type: 'downloads',
      title: 'Band Documents',
      content: 'Download band resources including the complete music library listing.',
      downloadItems: [],
    },
  ];
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

  if (totalReplaced > 0) {
    console.log('Replaced', totalReplaced, 'media-hub section(s) with tab-grouped sections.');
  }

  // If no media-hub was found, ensure the Media page has the new tab-grouped layout
  let mediaPageUpdated = false;
  const mediaPage = rows.find((r) => r.slug === '/media');
  if (mediaPage) {
    const sections = parseSections(mediaPage);
    if (!hasTabGroupMedia(sections)) {
      const existing = collectExistingMedia(sections);
      const newSections = getDefaultMediaPageSections(existing);
      const sectionsJson = JSON.stringify(newSections);
      const updatedAt = new Date().toISOString();
      await client.execute({
        sql: 'UPDATE pages SET sections = ?, updated_at = ? WHERE id = ?',
        args: [sectionsJson, updatedAt, mediaPage.id],
      });
      console.log('Updated /media page to use tab-grouped layout (Photos, Recordings, Videos).');
      mediaPageUpdated = true;
    }
  } else if (totalReplaced === 0) {
    console.log('No media-hub sections found and no /media page in DB. Nothing to migrate.');
  }

  if (totalReplaced > 0 || mediaPageUpdated) {
    console.log('Done. Reload the site to see the tabbed Media layout.');
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
