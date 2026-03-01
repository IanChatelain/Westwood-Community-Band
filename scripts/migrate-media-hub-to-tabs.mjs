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

  const defaultRecordings = [
    { id: 'r-liberty-bell', type: 'audio', url: '#', caption: 'Liberty Bell', duration: '2:47' },
    { id: 'r-big-band-showcase', type: 'audio', url: '#', caption: 'Big Band Showcase', duration: '8:20' },
    { id: 'r-it-dont-mean-a-thing', type: 'audio', url: '#', caption: "It Don't Mean a Thing", duration: '3:25' },
    { id: 'r-count-basie-salute', type: 'audio', url: '#', caption: 'Count Basie Salute', duration: '4:17' },
    { id: 'r-themes-like-old-times', type: 'audio', url: '#', caption: 'Themes Like Old Times', duration: '5:35' },
    { id: 'r-caravan', type: 'audio', url: '#', caption: 'Caravan', duration: '2:46' },
    { id: 'r-swing-the-mood', type: 'audio', url: '#', caption: 'Swing the Mood', duration: '3:38' },
    { id: 'r-blues-brothers-revue', type: 'audio', url: '#', caption: 'Blues Brothers Revue', duration: '5:12' },
  ];

  const defaultPhotos = [
    { id: 'ph-spring-2025', title: 'Spring Concert 2025', slug: 'spring-concert-2025', description: 'Photos from our Spring 2025 concert.', media: [] },
    { id: 'ph-holiday-2024', title: 'Holiday Concert 2024', slug: 'holiday-concert-2024', description: 'Festive moments from our Holiday 2024 concert.', media: [] },
    { id: 'ph-spring-2024', title: 'Spring Concert 2024', slug: 'spring-concert-2024', description: 'Highlights from our Spring 2024 performance.', media: [] },
    { id: 'ph-holiday-2023', title: 'Holiday Concert 2023', slug: 'holiday-concert-2023', description: 'Scenes from our Holiday 2023 concert.', media: [] },
    { id: 'ph-rehearsals', title: 'Rehearsals', slug: 'rehearsals', description: 'Behind the scenes at our Thursday night rehearsals.', media: [] },
    { id: 'ph-community-events', title: 'Community Events', slug: 'community-events', description: 'The band out and about in the community.', media: [] },
  ];

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
      downloadItems: [
        { label: 'Music List (Excel)', url: '#', description: 'Complete listing of music available in the Westwood Music Library.', fileSize: '39.5 KB' },
        { label: 'Music List (HTML)', url: '#', description: 'View the music list in your browser.' },
      ],
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
