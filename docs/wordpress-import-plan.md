# WordPress WXR to Supabase Content Import (with asset download and re-host)

## Overview

Parse the WordPress WXR export, **download every attachment** (images, audio, video, PDFs), **upload them to Supabase Storage**, then map pages and the **new Storage URLs** into the Supabase database so content appears in the correct website sections.

## Current state

- **Supabase**: `site_settings` (single row) and `pages` (id, title, slug, layout, sections JSONB, nav_order, etc.). Content lives in `pages.sections`.
- **WordPress export**: Channel metadata, attachments (images, MP3s, MP4s, PDFs), pages (Home, Contact, Performances, Photos, IMC, Media, Documents, Join Us), nav_menu_item.

## Asset flow: download → Storage → DB

1. **Parse WXR** and collect all items with `wp:post_type` = `attachment`: extract `wp:attachment_url`, title, alt text, `wp:post_parent`, and MIME/type from URL or meta.
2. **Download** each attachment from the WordPress URL (e.g. `https://www.westwoodcommunityband.ca/wp-content/uploads/...`) to a temp file or buffer. Handle failures (e.g. 404, timeout) with retries or skip and log.
3. **Upload to Supabase Storage**:
   - Use an **import bucket** (e.g. `cms-uploads` or a dedicated `imported-media` bucket). If using `cms-uploads`, ensure bucket allows the MIME types needed (images, audio/mpeg, video/mp4, application/pdf) and a reasonable file-size limit (videos are ~50–150 MB each).
   - Path convention: e.g. `imported/YYYY/MM/filename.ext` to mirror WP’s `uploads/YYYY/MM/` so paths are readable and unique.
   - Upload the downloaded buffer/file; get the **public URL** (e.g. `supabase.storage.from('cms-uploads').getPublicUrl(path)`).
4. **Build a URL map**: `oldWordPressUrl → newSupabaseStorageUrl` for every successfully uploaded attachment.
5. **Build section JSON** for each page: when inserting image URLs, video URLs, or audio URLs into hero, image-text, gallery (media), or any other section, use the **new Supabase Storage URL** from the map instead of the WordPress URL. Any attachment that failed to download/upload keeps the old URL (or is omitted) and can be logged for manual fix.

Result: all referenced media in the DB and on the site point to Supabase Storage; the site does not depend on the WordPress server for assets.

## Mapping summary (unchanged, URLs now from Storage)

| WP item | Supabase target | Action |
|--------|------------------|--------|
| Channel title/description | `site_settings` | Update |
| Attachments | Download → Storage; add URLs to URL map | Used when building sections below |
| Page Home (6) | `pages` id `home` | Hero + text sections; hero/any image uses Storage URL from map |
| Page Contact (8) | `pages` id `contact` | Contact + executive text |
| Page Performances (10) | `pages` id `performances` | Hero (poster image from map) + performanceItems |
| Page Photos (12) | `pages` id `photos` | Hero + text with legacy links; any embedded images from map |
| Page IMC (14) | `pages` id `imc` (new) | Insert page; any images from map |
| Page Media (16) | `pages` id `media` | Hero + gallery: videos and recordings; each `media[].url` = Storage URL from map |
| Page Documents (20) | `pages` id `documents` (new) | Text + links; PDFs if any from map |
| Page Join Us (22) | `pages` id `join` | Text + image-text (director image = Storage URL from map) |

## Implementation: import script

Single script (e.g. `scripts/import-wordpress-wxr.ts`) that:

1. **Parse WXR** (XML) → channel + items (pages, attachments, nav).
2. **For each attachment item**:
   - Download from `wp:attachment_url` (with timeout and retry).
   - Determine path: `imported/YYYY/MM/sanitized-filename.ext` (use attachment date or current date).
   - Upload to Supabase Storage bucket; store `oldUrl → newPublicUrl` in a map.
3. **Build site_settings** from channel (band_name, footer_text).
4. **Build pages**:
   - For each target page, build `sections` (hero, text, image-text, gallery, contact, performances, etc.).
   - For any field that should reference an attachment (imageUrl, media[].url, etc.), resolve the WordPress URL via the map and use the Storage URL; if not in map, keep WP URL or omit and log.
5. **Output**: either generate a migration SQL file that updates `site_settings` and upserts `pages` with the final section JSON, or call Supabase client to upsert directly. Section JSON must contain only the new Storage URLs where attachments were used.

**Dependencies**: Node script needs `@supabase/supabase-js` (upload + getPublicUrl), an HTTP client (e.g. `node-fetch` or `axios`) for downloading, and an XML parser (e.g. `fast-xml-parser`). Run with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so uploads are allowed.

## Storage bucket and policies

- **Bucket**: Use `cms-uploads` or create `imported-media`. Allow MIME types: image/jpeg, image/png, image/gif, image/webp, image/png, audio/mpeg, video/mp4, application/pdf. Increase file size limit if needed (e.g. 200 MB) for large videos.
- **Policies**: Public read for the bucket; script uses service role for insert. (Existing comment in initial_schema.sql describes cms-uploads; extend or add bucket for imports.)

## Files to add/change

- **New**: `scripts/import-wordpress-wxr.ts` – parse WXR, download attachments, upload to Storage, build URL map, build sections with Storage URLs, emit SQL or Supabase upsert.
- **New**: `scripts/wordpress-export.xml` – WXR content (or path via CLI).
- **New**: Migration generated by script (e.g. `supabase/migrations/YYYYMMDD_import_wordpress_content.sql`) – updates `site_settings` and `pages` with section JSON that references only Supabase Storage URLs.
- **Optional**: Migration or docs to create/configure the import bucket and policies if not using `cms-uploads` as-is.

## Execution order

1. Save WXR to `scripts/wordpress-export.xml` (or pass path to script).
2. Ensure Supabase Storage bucket exists and allows required MIME types and size.
3. Run import script (with Supabase env vars); it downloads attachments, uploads to Storage, then generates migration or upserts DB.
4. If using generated migration: run `supabase db push` (or apply migration).
5. Verify site: all images, audio, video, and PDFs load from Supabase Storage and appear in the correct sections.

## Risks and notes

- **Large files**: Videos in the export are tens to hundreds of MB; download/upload will take time and may hit timeouts; consider increasing timeout and retrying.
- **Rate limits**: Avoid hammering the WordPress server; optional small delay between downloads.
- **Idempotency**: Use stable Storage paths (e.g. by original filename or WP post_id) so re-running can skip already-uploaded files or overwrite safely.
- **HTML in WP content**: Strip or sanitize HTML when building text sections; preserve links only where needed (e.g. Documents page).
