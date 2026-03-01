#!/usr/bin/env node
/**
 * One-time migration: convert the Media page (and optional Photos page) to the new
 * "media-hub" section layout so the tabbed Photos / Recordings / Videos UI appears.
 *
 * Run: node scripts/migrate-media-to-media-hub.mjs
 *
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN in .env
 *
 * What it does:
 * - Finds the page with slug /media and (if present) /photos
 * - Replaces the Media page's gallery + "Sample Recordings" downloads with one
 *   media-hub section containing:
 *   - mediaPhotos: photo albums from the Photos page gallery, or from Media page gallery if no Photos page
 *   - mediaRecordings: audio items built from the "Sample Recordings" download list (label → caption, url, duration)
 *   - mediaVideos: []
 * - Keeps other Media page sections (hero, Band Documents, International Music Camp text)
 * - Archives the Photos page so it no longer appears in nav (content merged into Media)
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

function findSection(sections, type, titleSubstring) {
  return sections.find(
    (s) => s && s.type === type && (!titleSubstring || (s.title && s.title.includes(titleSubstring)))
  );
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

async function migrate() {
  const { rows } = await client.execute('SELECT * FROM pages');
  if (!rows || rows.length === 0) {
    console.log('No pages in database. Nothing to migrate. Use INITIAL_PAGES (or seed) to get the new layout.');
    return;
  }

  const mediaPage = rows.find((r) => r.slug === '/media');
  const photosPage = rows.find((r) => r.slug === '/photos');

  if (!mediaPage) {
    console.log('No page with slug /media found. Add a Media page in admin or rely on fallback (INITIAL_PAGES).');
    return;
  }

  const mediaSections = parseSections(mediaPage);
  const photosSections = photosPage ? parseSections(photosPage) : [];

  // Photo albums: prefer Photos page gallery "Event Photos", else any gallery on Media
  let mediaPhotos = [];
  const photosGallery = findSection(photosSections, 'gallery') || findSection(photosSections, 'gallery', '');
  if (photosGallery && photosGallery.galleryEvents && photosGallery.galleryEvents.length > 0) {
    mediaPhotos = photosGallery.galleryEvents;
  } else {
    const mediaGallery = findSection(mediaSections, 'gallery');
    if (mediaGallery && mediaGallery.galleryEvents) {
      // Old "Featured Recordings" were recording names; only use as photo albums if they look like events
      const events = mediaGallery.galleryEvents;
      const lookLikePhotoAlbums = events.some((e) => e.title && /concert|rehearsal|event|photos|202[0-9]|20[0-9][0-9]/.test(e.title));
      if (lookLikePhotoAlbums) mediaPhotos = events;
    }
  }

  // Recordings: from "Sample Recordings" downloads section on Media page
  let mediaRecordings = [];
  const sampleRecordings = mediaSections.find(
    (s) => s && s.type === 'downloads' && s.downloadItems && (s.title || '').toLowerCase().includes('sample')
  );
  if (sampleRecordings && sampleRecordings.downloadItems) {
    mediaRecordings = sampleRecordings.downloadItems.map((item) => ({
      id: generateId(),
      type: 'audio',
      url: item.url || '#',
      caption: item.label || 'Untitled',
      duration: item.duration,
    }));
  }

  // New media-hub section
  const mediaHubSection = {
    id: 'm2',
    type: 'media-hub',
    title: '',
    content: '',
    mediaPhotos,
    mediaRecordings,
    mediaVideos: [],
  };

  // Build new Media page sections: hero, media-hub, then other non-gallery/non-sample-downloads sections
  const newSections = [];
  const hero = mediaSections.find((s) => s && s.type === 'hero');
  if (hero) {
    newSections.push({ ...hero, title: hero.title || 'Photos, Recordings & Videos', content: hero.content || 'Browse photos, listen to recordings, and watch videos of the Westwood Community Band.' });
  } else {
    newSections.push({
      id: 'm1',
      type: 'hero',
      title: 'Photos, Recordings & Videos',
      content: 'Browse photos, listen to recordings, and watch videos of the Westwood Community Band.',
      imageUrl: '/images/media.jpg',
    });
  }
  newSections.push(mediaHubSection);

  for (const s of mediaSections) {
    if (!s || s.type === 'gallery') continue;
    if (s.type === 'downloads' && (s.title || '').toLowerCase().includes('sample')) continue;
    newSections.push(s);
  }

  const sectionsJson = JSON.stringify(newSections);
  const updatedAt = new Date().toISOString();

  await client.execute({
    sql: `UPDATE pages SET sections = ?, updated_at = ? WHERE id = ?`,
    args: [sectionsJson, updatedAt, mediaPage.id],
  });
  console.log('Updated Media page (/media) with media-hub section. Sections:', newSections.length);

  if (photosPage) {
    await client.execute({
      sql: `UPDATE pages SET is_archived = 1, updated_at = ? WHERE id = ?`,
      args: [updatedAt, photosPage.id],
    });
    console.log('Archived Photos page (/photos) so nav shows only Media.');
  }

  console.log('Done. Reload the site to see the new tabbed Media layout.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
