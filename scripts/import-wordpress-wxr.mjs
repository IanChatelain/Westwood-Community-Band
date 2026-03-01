#!/usr/bin/env node
/**
 * WordPress WXR → Turso + R2 CMS Import
 *
 * Downloads every attachment, uploads it to R2 using the same folder convention
 * the CMS uses (images/, recordings/, videos/, documents/), then upserts the
 * media pages into Turso with section JSON referencing the new R2 URLs.
 *
 * Usage:
 *   node scripts/import-wordpress-wxr.mjs [path-to-wxr.xml]
 *
 * Required env vars (from .env or shell):
 *   TURSO_DATABASE_URL      (libsql://... or file:.data/local.db)
 *   TURSO_AUTH_TOKEN        (required for cloud Turso; omit for file:)
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME
 *   R2_PUBLIC_URL
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@libsql/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });
const OLD_SITE_ARCHIVE_BASE = 'https://www.westwoodcommunityband.ca/old-site-archive/';

// ─── env ─────────────────────────────────────────────────────────────────────
const rawUrl = (process.env.TURSO_DATABASE_URL || '').replace(/^TURSO_DATABASE_URL=/, '').trim();
const tursoUrl = rawUrl || process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
const isLocalFile = tursoUrl?.startsWith('file:');

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME || 'cms-uploads';
const r2PublicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const s3Endpoint = process.env.S3_ENDPOINT || process.env.R2_LOCAL_ENDPOINT;

if (!tursoUrl) {
  console.error('Set TURSO_DATABASE_URL');
  process.exit(1);
}
if (!isLocalFile && !tursoToken) {
  console.error('TURSO_AUTH_TOKEN is required for cloud Turso (libsql://...)');
  process.exit(1);
}
if (!s3Endpoint && (!r2AccountId || !r2AccessKey || !r2SecretKey)) {
  console.error('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY for cloud R2');
  process.exit(1);
}
if (!r2PublicUrl) {
  console.error('Set R2_PUBLIC_URL (base URL for public object access)');
  process.exit(1);
}

// Turso client
const turso = createClient(
  isLocalFile ? { url: tursoUrl } : { url: tursoUrl, authToken: tursoToken }
);

// R2/S3 client
let s3Client;
if (s3Endpoint) {
  s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: r2AccessKey || process.env.MINIO_ROOT_USER,
      secretAccessKey: r2SecretKey || process.env.MINIO_ROOT_PASSWORD,
    },
    forcePathStyle: true,
  });
} else {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function slugify(s) {
  return s.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uid() {
  return Math.random().toString(36).substring(2, 11);
}

function cdata(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && '__cdata' in val) return String(val['__cdata']).trim();
  if (typeof val === 'object' && '#text' in val) return String(val['#text']).trim();
  return String(val).trim();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function mimeFromUrl(url) {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
    wma: 'audio/x-ms-wma', m4a: 'audio/mp4', aac: 'audio/aac', aiff: 'audio/aiff', mid: 'audio/midi', midi: 'audio/midi',
    mp4: 'video/mp4', webm: 'video/webm', m4v: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv', mkv: 'video/x-matroska', flv: 'video/x-flv',
    pdf: 'application/pdf', xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    html: 'text/html', csv: 'text/csv', txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

function folderForMime(mime) {
  if (mime.startsWith('image/'))  return 'images';
  if (mime.startsWith('audio/'))  return 'recordings';
  if (mime.startsWith('video/'))  return 'videos';
  if (['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'text/html', 'text/csv', 'text/plain'].includes(mime)) return 'documents';
  return 'imports/unassigned';
}

function isLayoutImage(filename) {
  const lower = filename.toLowerCase();
  if (
    lower === 'spacer.gif' ||
    lower === 'title.jpg' ||
    lower === 'menu_top.jpg' ||
    lower === 'menu_bottom.jpg'
  ) {
    return true;
  }
  // Old site navigation slices like mi_01_home.jpg, mi_02_photos.jpg, etc.
  if (lower.startsWith('mi_')) return true;
  return false;
}

/** Skip layout/nav images by path (for 2006–2008 pages that use same structure). */
function isLayoutImagePath(pathname) {
  const lower = pathname.toLowerCase();
  return (
    lower.includes('menu_items') ||
    lower.includes('menu_top') ||
    lower.includes('menu_bottom') ||
    lower.endsWith('spacer.gif') ||
    lower.endsWith('title.jpg')
  );
}

function getFullSizeCandidates(imgUrl) {
  const candidates = [];
  try {
    const u = new URL(imgUrl);
    const patterns = [
      // WW1s.jpg → WW1.jpg
      { re: /^(.*?)([sS])(\.[^.]+)$/, replace: '$1$3' },
      // photo_s.jpg → photo.jpg
      { re: /^(.*?)_[sS](\.[^.]+)$/, replace: '$1$2' },
      // photo_thumb.jpg → photo.jpg
      { re: /^(.*?)_thumb(\.[^.]+)$/i, replace: '$1$2' },
      // photo-thumbnail.jpg → photo.jpg
      { re: /^(.*?)-thumbnail(\.[^.]+)$/i, replace: '$1$2' },
      // photo-small.jpg → photo.jpg
      { re: /^(.*?)-small(\.[^.]+)$/i, replace: '$1$2' },
    ];
    for (const { re, replace } of patterns) {
      const m = u.pathname.match(re);
      if (m) {
        const c = new URL(u.href);
        c.pathname = u.pathname.replace(re, replace);
        candidates.push(c.href);
      }
    }
  } catch { /* not a valid URL */ }
  return candidates;
}

async function downloadBuffer(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      console.warn(`  ⚠ download attempt ${i + 1}/${retries} failed for ${url}: ${err.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

async function uploadToStorage(buffer, storagePath, contentType) {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: storagePath,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return `${r2PublicUrl}/${storagePath}`;
  } catch (err) {
    console.error(`  ✗ upload failed ${storagePath}: ${err.message}`);
    return null;
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 120);
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── WXR parse ───────────────────────────────────────────────────────────────

function parseWXR(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    textNodeName: '#text',
    isArray: (name) => ['item', 'wp:postmeta', 'wp:category', 'wp:term', 'wp:author'].includes(name),
  });
  const doc = parser.parse(xmlString);
  const channel = doc.rss.channel;

  const items = (channel.item || []).map(it => {
    const metas = {};
    for (const m of (it['wp:postmeta'] || [])) {
      const key = cdata(m['wp:meta_key']);
      const val = cdata(m['wp:meta_value']);
      if (key) metas[key] = val;
    }
    return {
      title: cdata(it.title),
      link: it.link,
      content: cdata(it['content:encoded']),
      postId: it['wp:post_id'],
      postDate: cdata(it['wp:post_date']),
      postName: cdata(it['wp:post_name']),
      status: cdata(it['wp:status']),
      postType: cdata(it['wp:post_type']),
      postParent: it['wp:post_parent'],
      menuOrder: it['wp:menu_order'],
      attachmentUrl: cdata(it['wp:attachment_url']),
      metas,
    };
  });

  return {
    siteTitle: channel.title,
    siteDescription: channel.description,
    items,
  };
}

// ─── crawl old-site-archive photo pages ──────────────────────────────────────

function isImageUrl(url) {
  try {
    const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  } catch { return false; }
}

async function crawlPhotoPage(pageUrl) {
  console.log(`  Crawling ${pageUrl} ...`);
  try {
    const res = await fetch(pageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) { console.warn(`  ⚠ HTTP ${res.status} for ${pageUrl}`); return []; }
    const html = await res.text();
    const $ = cheerio.load(html);
    const baseUrl = pageUrl.startsWith(OLD_SITE_ARCHIVE_BASE) ? OLD_SITE_ARCHIVE_BASE : pageUrl;
    const seen = new Set();
    const results = [];

    $('img').each((_, el) => {
      let src = $(el).attr('src');
      if (!src) return;
      if (src.startsWith('/') || !src.startsWith('http')) {
        try { src = new URL(src, baseUrl).href; } catch { return; }
      }
      if (seen.has(src)) return;
      seen.add(src);

      let fullUrl = null;
      const parentA = $(el).closest('a');
      if (parentA.length) {
        let href = parentA.attr('href');
        if (href) {
          if (href.startsWith('/') || !href.startsWith('http')) {
            try { href = new URL(href, baseUrl).href; } catch { href = null; }
          }
          if (href && isImageUrl(href)) {
            fullUrl = href;
          }
        }
      }

      results.push({ src, fullUrl });
    });
    return results;
  } catch (err) {
    console.warn(`  ⚠ Failed to crawl ${pageUrl}: ${err.message}`);
    return [];
  }
}

// ─── main import logic ──────────────────────────────────────────────────────

async function main() {
  const wxrPath = process.argv[2] || path.join('scripts', 'wordpress-export.xml');
  if (!fs.existsSync(wxrPath)) {
    console.error(`WXR file not found: ${wxrPath}`);
    process.exit(1);
  }
  console.log(`Reading WXR from ${wxrPath} ...`);
  const xmlString = fs.readFileSync(wxrPath, 'utf-8');
  const { siteTitle, siteDescription, items } = parseWXR(xmlString);

  // ── classify items ──
  const attachments = items.filter(i => i.postType === 'attachment' && i.attachmentUrl);
  const pages = items.filter(i => i.postType === 'page' && i.status === 'publish');

  console.log(`Found ${attachments.length} attachments, ${pages.length} published pages.\n`);

  // ── build attachment URL → item map ──
  const attachmentByUrl = new Map();
  for (const a of attachments) attachmentByUrl.set(a.attachmentUrl, a);

  // Maps: oldUrl → newPublicUrl
  const urlMap = new Map();
  const unassigned = [];

  // ── categorise attachments by destination ──
  const imageAttachments  = attachments.filter(a => mimeFromUrl(a.attachmentUrl).startsWith('image/'));
  const audioAttachments  = attachments.filter(a => mimeFromUrl(a.attachmentUrl).startsWith('audio/'));
  const videoAttachments  = attachments.filter(a => mimeFromUrl(a.attachmentUrl).startsWith('video/'));
  const docAttachments    = attachments.filter(a => {
    const m = mimeFromUrl(a.attachmentUrl);
    return !m.startsWith('image/') && !m.startsWith('audio/') && !m.startsWith('video/') && m !== 'application/octet-stream';
  });

  // ── download & upload function ──
  async function processAttachment(att, folderOverride) {
    const url = att.attachmentUrl;
    if (urlMap.has(url)) return urlMap.get(url);

    const mime = mimeFromUrl(url);
    const folder = folderOverride || folderForMime(mime);
    const filename = sanitizeFilename(path.basename(new URL(url).pathname));
    const storagePath = `${folder}/imported/${filename}`;

    console.log(`  ↓ ${url}`);
    const buf = await downloadBuffer(url);
    if (!buf) {
      console.error(`  ✗ Could not download ${url}`);
      return null;
    }

    console.log(`  ↑ ${storagePath} (${formatFileSize(buf.length)})`);
    const publicUrl = await uploadToStorage(buf, storagePath, mime);
    if (publicUrl) urlMap.set(url, publicUrl);
    return publicUrl;
  }

  // ─── Download & upload ALL attachments ──────────────────────────────────

  console.log('═══ Uploading images ═══');
  for (const a of imageAttachments) {
    await processAttachment(a, 'images');
  }

  console.log('\n═══ Uploading recordings (MP3) ═══');
  for (const a of audioAttachments) {
    await processAttachment(a, 'recordings');
  }

  console.log('\n═══ Uploading videos (MP4) ═══');
  for (const a of videoAttachments) {
    await processAttachment(a, 'videos');
  }

  console.log('\n═══ Uploading documents ═══');
  for (const a of docAttachments) {
    await processAttachment(a, 'documents');
  }

  // ─── Crawl old-site-archive photo pages ──────────────────────────────────

  console.log('\n═══ Crawling old-site-archive photo pages ═══');

  const photoArchivePages = [
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2014-12-00.html', title: '2014 Christmas Bus Trip', slug: '2014-christmas-bus-trip' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2013-06-02.html', title: '2013 Forks Concert', slug: '2013-forks-concert' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2013-05-30.html', title: '2013 Spring Concert with Stonewall Collegiate Jazz Band', slug: '2013-spring-concert' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2012-05-24.html', title: '2012 CMHA Benefit Concert', slug: '2012-cmha-benefit' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2011-12-04.html', title: '2011 Old Fashioned Christmas Concert', slug: '2011-christmas-concert' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_20062007_practice.html', title: '2006/2007 Rehearsal', slug: '2006-2007-rehearsal' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2006_christmasRockwoodANAF.html', title: '2006 Christmas Concert at Rockwood ANAF', slug: '2006-christmas-rockwood' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2006_IMC.html', title: '2006 International Music Camp', slug: '2006-imc' },
    { url: 'https://www.westwoodcommunityband.ca/old-site-archive/photos_2006_forks.html', title: '2006 Year End Concert at the Forks', slug: '2006-forks-concert' },
  ];

  const photoGalleryEvents = [];

  for (const archivePage of photoArchivePages) {
    const crawled = await crawlPhotoPage(archivePage.url);
    console.log(`  Found ${crawled.length} images for "${archivePage.title}"`);

    const mediaItems = [];
    for (const { src: imgUrl, fullUrl: parentFullUrl } of crawled) {
      if (urlMap.has(imgUrl)) {
        mediaItems.push({ id: uid(), type: 'image', url: urlMap.get(imgUrl), caption: '' });
        continue;
      }

      const parsed = new URL(imgUrl);
      const rawThumbFilename = path.basename(parsed.pathname);
      if (isLayoutImage(rawThumbFilename) || isLayoutImagePath(parsed.pathname)) continue;

      // Build priority list: parent <a href> first, then naming-heuristic candidates, then original src
      const candidates = [];
      if (parentFullUrl) candidates.push(parentFullUrl);
      candidates.push(...getFullSizeCandidates(imgUrl));

      let downloadUrl = imgUrl;
      let buf = null;

      for (const candidate of candidates) {
        console.log(`    ↓ (full) ${candidate}`);
        buf = await downloadBuffer(candidate);
        if (buf) {
          downloadUrl = candidate;
          break;
        }
      }

      if (!buf) {
        console.log(`    ↓ ${imgUrl}`);
        buf = await downloadBuffer(imgUrl);
        if (!buf) continue;
      }

      const finalFilename = sanitizeFilename(path.basename(new URL(downloadUrl).pathname));
      const storagePath = `images/imported/photos-${archivePage.slug}/${finalFilename}`;
      const mime = mimeFromUrl(downloadUrl);

      console.log(`    ↑ ${storagePath}`);
      const publicUrl = await uploadToStorage(buf, storagePath, mime);
      if (publicUrl) {
        urlMap.set(imgUrl, publicUrl);
        mediaItems.push({ id: uid(), type: 'image', url: publicUrl, caption: '' });
      }
    }

    if (mediaItems.length > 0) {
      photoGalleryEvents.push({
        id: `ph-${archivePage.slug}`,
        title: archivePage.title,
        slug: archivePage.slug,
        description: `Photos from ${archivePage.title}.`,
        coverImageUrl: mediaItems[0]?.url,
        media: mediaItems,
      });
    }
  }

  // Also add WXR image attachments that are concert posters / event photos to gallery events
  const wpImageEvents = new Map();
  for (const att of imageAttachments) {
    const url = att.attachmentUrl;
    const publicUrl = urlMap.get(url);
    if (!publicUrl) continue;

    const title = att.title;
    const alt = att.metas['_wp_attachment_image_alt'] || '';

    // Concert posters, welcome-back, christmas concert images → group by broad category
    const lowerTitle = (title || '').toLowerCase();
    let eventKey = null;
    let eventTitle = null;

    if (lowerTitle.includes('forks') || alt.toLowerCase().includes('forks')) {
      eventKey = 'wp-forks-concert';
      eventTitle = 'Forks Concert Photos';
    } else if (lowerTitle.includes('welcome back') || lowerTitle.includes('welcome-back')) {
      eventKey = 'wp-welcome-back';
      eventTitle = 'Welcome Back 2022';
    } else if (lowerTitle.includes('christmas') || lowerTitle.includes('holiday')) {
      eventKey = 'wp-holiday-concerts';
      eventTitle = 'Holiday Concert Posters';
    }

    if (eventKey) {
      if (!wpImageEvents.has(eventKey)) {
        wpImageEvents.set(eventKey, {
          id: eventKey,
          title: eventTitle,
          slug: slugify(eventTitle),
          description: '',
          media: [],
        });
      }
      wpImageEvents.get(eventKey).media.push({
        id: uid(), type: 'image', url: publicUrl, caption: alt || title || '',
      });
    }
  }
  for (const ev of wpImageEvents.values()) {
    if (ev.media.length > 0) {
      ev.coverImageUrl = ev.media[0].url;
      photoGalleryEvents.push(ev);
    }
  }

  // ─── Build page sections ──────────────────────────────────────────────────

  console.log('\n═══ Building page sections ═══');

  // Helper: find a WP page by post_name (slug)
  const wpPage = (name) => pages.find(p => p.postName === name);

  // ── Home ──
  const homeWP = wpPage('home');
  const heroImageUrl = urlMap.get('https://www.westwoodcommunityband.ca/wp-content/uploads/2018/06/2018-forks-concert-crop.jpg') || '/images/band-hero.jpg';

  const homeSections = [
    { id: 'h1', type: 'hero', title: 'Forty-five Years of Making Music', content: 'The Westwood Community Band is based in Winnipeg, Manitoba, Canada. Since 1980, we have been bringing quality music to our local community.', imageUrl: heroImageUrl },
    { id: 'h2', type: 'text', title: 'Our History', content: 'In 1980, the band director of Sansome School challenged the parents of his band students to form their own group, with the purpose of leading by example. A number of these parents responded and their on-going dedication, boosted by a steady input of new members, has blossomed into the Westwood Community Band. Some of those original parents are still enthusiastic members!' },
    { id: 'h3', type: 'text', title: 'Our Mission', content: "The Band\u2019s objectives are to play good music and offer musical entertainment to the wider community. The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. We practice from September \u2013 June, Thursday nights at John Taylor Collegiate." },
    { id: 'h4', type: 'text', title: 'Join Us', content: 'This is a friendly environment. New members are welcome to sit in for a couple of nights with no commitment necessary. You will soon feel at home! If you are considering joining us or if you would like to book Westwood Community Band to play at an event, please contact us.' },
  ];

  // ── Join ──
  const directorImageUrl = urlMap.get('https://www.westwoodcommunityband.ca/wp-content/uploads/2024/09/Ginny-mugshot.jpg') || '/images/director.jpg';

  const joinSections = [
    { id: 'j1', type: 'text', title: 'Welcome New Members', content: 'The Band welcomes adults, beginners through to accomplished musicians, who play woodwind, brass, or percussion instruments. This is a friendly environment, and new members are welcome to sit-in for a couple of nights with no commitment necessary. You will soon feel at home!' },
    { id: 'j2', type: 'text', title: 'Rehearsals', content: 'Thursday Evenings, 7:15 to 9:15 p.m.\n\nThe Band Room\nJohn Taylor Collegiate\n470 Hamilton Avenue\nWinnipeg, Manitoba' },
    { id: 'j3', type: 'text', title: 'Membership', content: 'The Band averages 40+ members from all parts of Winnipeg and from all walks of life: ages range from 18 to 80+.\n\nBand Season is from September to June.\nAnnual fee $100.00\nStudents $50.00\nWestwood Community Band Polo Shirt $15.00' },
    { id: 'j4', type: 'image-text', title: 'Musical Director', content: "Virginia Helmer was a music teacher in the Pembina Trails School Division for 38 years, working with students from grades 5-9. She has been a member of the Winnipeg Wind Ensemble since 1986, has guest conducted the group on several occasions and was appointed Artistic Director in 2020. She conducted the Manitoba Junior Provincial Honour Band in 2019 and the Intermediate Honour Band in 2024. Ginny has been the music director of the Westwood Community Band since 2017.\n\nGinny holds a Bachelor\u2019s degree in Music Performance from the University of Western Ontario, and a Masters\u2019 Degree in Education from the University of Manitoba. She has participated in conducting workshops with Glenn Price, Craig Kirchoff and Eugene Corporan, and successfully completed the Canadian Wind Conductors\u2019 Development Program.", imageUrl: directorImageUrl },
  ];

  // ── Contact ──
  const contactSections = [
    { id: 'c1', type: 'contact', title: 'Contact the Band', content: 'If you have questions about the band, use the form to contact us!', contactRecipients: [{ id: 'president', label: 'President' }, { id: 'music-director', label: 'Music Director' }, { id: 'booking', label: 'Booking' }] },
    { id: 'c2', type: 'text', title: 'Executive Committee', content: 'President: Duncan Hasker\nMusical Director: Ginny Helmer\nVice President: Sherry Aubin\nSecretary: Doug Gibb\nTreasurer: David Patrick\nPast President: Greg McLean\nLibrarian: Mikaila Hardy\nGigs: Greg Barratt\nGigs: Ray Vance\nSocial Rep: Wendy Chapman\nSocial Rep: Shelley Greaves' },
  ];

  // ── Photos ──
  const photosSections = [
    { id: 'ph1', type: 'hero', title: 'Photo Gallery', content: 'Browse photos from our concerts, rehearsals, and special events over the years.', imageUrl: heroImageUrl },
    {
      id: 'ph2', type: 'gallery', title: 'Event Photos', content: '',
      galleryColumns: 3, galleryCardSize: 'md', galleryThumbnailAspect: 'landscape', galleryShowDescription: true,
      galleryEvents: photoGalleryEvents,
    },
  ];

  // ── Media page: videos gallery + recording downloads ──
  const videoMediaItems = [];
  for (const v of videoAttachments) {
    const pub = urlMap.get(v.attachmentUrl) || v.attachmentUrl;
    videoMediaItems.push({ id: uid(), type: 'video', url: pub, caption: v.title || '' });
  }

  const recordingDownloadItems = audioAttachments.map(a => {
    const pub = urlMap.get(a.attachmentUrl);
    const meta = a.metas['_wp_attachment_metadata'] || '';
    let duration = '';
    let fileSize = '';
    const durMatch = meta.match(/"length_formatted";s:\d+:"([^"]+)"/);
    if (durMatch) duration = durMatch[1];
    const sizeMatch = meta.match(/"filesize";i:(\d+)/);
    if (sizeMatch) fileSize = formatFileSize(parseInt(sizeMatch[1], 10));
    else if (a.attachmentUrl && urlMap.has(a.attachmentUrl)) {
      // use the content description for size if available
      const csMatch = a.content.match(/Released: (\d{4})/);
    }
    return {
      label: a.title || path.basename(a.attachmentUrl),
      url: pub || '#',
      description: a.content ? stripHtml(a.content) : '',
      fileSize,
      duration,
    };
  });

  const mediaSections = [
    { id: 'm1', type: 'hero', title: 'Media & Resources', content: 'Browse photos, watch concert videos, and listen to recordings from the Westwood Community Band.', imageUrl: heroImageUrl },
  ];

  if (videoMediaItems.length > 0) {
    mediaSections.push({
      id: 'm-vid', type: 'gallery', title: 'Concert Videos', content: '',
      galleryColumns: 2, galleryCardSize: 'lg', galleryThumbnailAspect: 'landscape', galleryShowDescription: true,
      galleryEvents: [{
        id: 'vid-concert-2018',
        title: '2018 Concert Videos',
        slug: '2018-concert-videos',
        description: 'Video recordings from the 2018 concert season.',
        media: videoMediaItems,
      }],
    });
  }

  if (recordingDownloadItems.length > 0) {
    mediaSections.push({
      id: 'm3', type: 'downloads', title: 'Sample Recordings',
      content: "Tracks recorded during Westwood\u2019s 25th Anniversary Concert on July 30th, 2006 at the International Music Camp.",
      downloadItems: recordingDownloadItems,
    });
  }

  if (photoGalleryEvents.length > 0) {
    const highlightEvents = photoGalleryEvents.slice(0, 6).map(ev => ({
      ...ev,
      id: `m-photo-${ev.slug}`,
    }));
    mediaSections.push({
      id: 'm-photos', type: 'gallery', title: 'Photo Highlights', content: 'A selection of photos from our events. Visit the Photos page for the full gallery.',
      galleryColumns: 3, galleryCardSize: 'md', galleryThumbnailAspect: 'landscape', galleryShowDescription: true,
      galleryEvents: highlightEvents,
    });
  }

  mediaSections.push({
    id: 'm5', type: 'text', title: 'International Music Camp',
    content: 'The <a href="http://www.internationalmusiccamp.com/" target="_blank" rel="noopener noreferrer">International Music Camp</a> is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota.\n\nThe adult camp is a 4-day event. Every year a significant number of Westwood Band members make the trek to attend. In 2006, Westwood were guest performers at IMC for our 25th anniversary. We loved performing for such an amazing audience. The performance was recorded and several of the tracks are available above in our Sample Recordings section.',
  });

  // ── Performances (keep existing structure, add poster images if available) ──
  const posterUrl = urlMap.get('https://www.westwoodcommunityband.ca/wp-content/uploads/2025/03/Screenshot-2025-03-20-140322.jpg') || '/images/performance.jpg';

  const performancesSections = [
    { id: 'p1', type: 'hero', title: 'Upcoming Performances', content: 'Join us at our upcoming concerts and events throughout the 2024/25 season.', imageUrl: posterUrl },
    {
      id: 'p2', type: 'performances', title: 'Concert Schedule', content: '',
      performanceItems: [
        { id: 'perf-1', date: 'March 15, 2025', title: 'Spring Concert', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Join us for an evening of classic and contemporary concert band music.' },
        { id: 'perf-2', date: 'May 20, 2025', title: 'Community Showcase', venue: 'Assiniboine Park Bandstand', time: '2:00 PM', description: 'A free outdoor performance for the whole community.' },
        { id: 'perf-3', date: 'June 12, 2025', title: 'Season Finale', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Celebrate the end of our 2024/25 season with a grand finale concert.' },
        { id: 'perf-4', date: 'December 14, 2024', title: 'Holiday Concert', venue: 'John Taylor Collegiate', time: '7:00 PM', description: 'Our annual holiday concert featuring seasonal favourites and festive classics.' },
        { id: 'perf-5', date: 'October 26, 2024', title: 'Fall Harvest Concert', venue: 'Community Centre', time: '2:00 PM', description: 'An afternoon of autumnal tunes and classic marches.' },
      ],
    },
  ];

  // ── IMC / Other Opportunities ──
  const imcSections = [
    { id: 'imc1', type: 'text', title: 'International Music Camp', content: 'The International Music Camp (internationalmusiccamp.com) is an annual event for students and adults that takes place at the International Peace Gardens on the border between Manitoba and North Dakota on Highway 10 (Canada) and Highway 3 (United States).\n\nThe adult camp is a 4-day event starting on Saturday and ending Tuesday. If you go, you will be surprised at the number of people from the Winnipeg band community, including Westwood Community Band.' },
    { id: 'imc2', type: 'text', title: 'Millennium Band (Summer)', content: "The Manitoba Millennium Band is the only community concert band that runs through the summer months in Winnipeg. There are musicians from most of the community bands in Winnipeg who want to keep their playing skills up over the summer break.\n\nThe Millennium Band welcomes members of all levels, and plays an intermediate level of music. They try to make sure there's something for everyone, so there are some easier pieces and as well as some more challenging music.\n\nMembership Dues for the summer are $20/person.\n\nWebsite: www.mbmillenniumband.com\nEmail: info@mbmillenniumband.com" },
  ];

  // ── Documents ──
  const documentDownloadItems = docAttachments.map(a => {
    const pub = urlMap.get(a.attachmentUrl);
    return {
      label: a.title || path.basename(a.attachmentUrl),
      url: pub || '#',
      description: '',
      fileSize: '',
    };
  });

  const documentsSections = [
    { id: 'doc1', type: 'hero', title: 'Documents', content: 'Download band resources and documents.', imageUrl: '/images/band-hero.jpg' },
    {
      id: 'doc2', type: 'downloads', title: 'Band Documents', content: 'A collection of band resources including the complete music library listing.',
      downloadItems: documentDownloadItems.length > 0 ? documentDownloadItems : [
        { label: 'Music List (Excel)', url: '#', description: 'Complete listing of music available in the Westwood Music Library.', fileSize: '87.5 KB' },
        { label: 'Music List (HTML)', url: '#', description: 'View the music list in your browser.' },
      ],
    },
  ];

  // ─── Handle unassigned attachments ──────────────────────────────────────────

  console.log('\n═══ Processing unassigned attachments ═══');
  for (const att of attachments) {
    if (urlMap.has(att.attachmentUrl)) continue;

    const url = att.attachmentUrl;
    const mime = mimeFromUrl(url);
    const filename = sanitizeFilename(path.basename(new URL(url).pathname));
    const parentId = att.postParent || 0;
    const storagePath = `imports/unassigned/${att.postType}/${parentId}/${att.postId}/${filename}`;

    console.log(`  ↓ (unassigned) ${url}`);
    const buf = await downloadBuffer(url);
    if (!buf) continue;

    console.log(`  ↑ ${storagePath}`);
    const publicUrl = await uploadToStorage(buf, storagePath, mime);
    if (publicUrl) urlMap.set(url, publicUrl);
    unassigned.push({
      wpPostId: att.postId,
      wpPostParent: parentId,
      title: att.title,
      originalUrl: url,
      storagePath,
      publicUrl,
      reason: 'Could not confidently map to a page section',
    });
  }

  // Write manifest
  if (unassigned.length > 0) {
    const manifestPath = path.join('scripts', 'import-unassigned-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(unassigned, null, 2));
    console.log(`\nWrote unassigned manifest: ${manifestPath} (${unassigned.length} items)`);
  }

  // ─── Upsert into Turso ─────────────────────────────────────────────────────

  console.log('\n═══ Upserting media pages into Turso ═══');

  // IMPORTANT:
  // Only upsert pages whose primary content is media (photos, media, documents).
  // Do NOT touch text-heavy pages (home, join, contact, imc, performances),
  // so that any edits made through the CMS are preserved.
  const pageUpserts = [
    { id: 'media', title: 'Media', slug: '/media', layout: 'full', sidebar_width: 25, sections: mediaSections, show_in_nav: 1, nav_order: 2, nav_label: null },
    { id: 'photos', title: 'Photos', slug: '/photos', layout: 'full', sidebar_width: 25, sections: photosSections, show_in_nav: 1, nav_order: 4, nav_label: null },
    { id: 'documents', title: 'Documents', slug: '/documents', layout: 'full', sidebar_width: 25, sections: documentsSections, show_in_nav: 0, nav_order: 9, nav_label: null },
  ];

  const now = new Date().toISOString();
  for (const page of pageUpserts) {
    try {
      const sectionsJson = JSON.stringify(page.sections);
      await turso.execute({
        sql: `INSERT INTO pages (id, title, slug, layout, sidebar_width, sections, show_in_nav, nav_order, nav_label, is_archived, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
              ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                slug = excluded.slug,
                layout = excluded.layout,
                sidebar_width = excluded.sidebar_width,
                sections = excluded.sections,
                show_in_nav = excluded.show_in_nav,
                nav_order = excluded.nav_order,
                nav_label = excluded.nav_label,
                updated_at = excluded.updated_at`,
        args: [
          page.id,
          page.title,
          page.slug,
          page.layout,
          page.sidebar_width,
          sectionsJson,
          page.show_in_nav,
          page.nav_order,
          page.nav_label,
          now,
        ],
      });
      console.log(`  ✓ ${page.id} (${page.title})`);
    } catch (err) {
      console.error(`  ✗ Failed to upsert page "${page.id}": ${err.message}`);
    }
  }

  // Note: we intentionally do NOT change sidebar_blocks or site_settings here.
  // Those are considered editorial content managed via the CMS, not by this import.

  // ─── Summary ───────────────────────────────────────────────────────────────

  console.log('\n═══ Import complete ═══');
  console.log(`  Total attachments processed: ${urlMap.size}`);
  console.log(`  Unassigned: ${unassigned.length}`);
  console.log(`  Photo gallery events: ${photoGalleryEvents.length}`);
  console.log(`  Video items: ${videoMediaItems.length}`);
  console.log(`  Recording downloads: ${recordingDownloadItems.length}`);
  console.log(`  Document downloads: ${documentDownloadItems.length}`);
  console.log(`  Pages upserted: ${pageUpserts.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
