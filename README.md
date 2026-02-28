# Westwood Community Band

A Next.js CMS for the Westwood Community Band website, with Supabase for auth, storage, and data, and optional deployment on Vercel with a custom domain.

## Stack

- **Next.js** (App Router)
- **Supabase** – Auth, PostgreSQL (site settings, pages, profiles), Storage (images, recordings, videos, documents)
- **Vercel** – Hosting and custom domain

## Getting Started

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/20250222000001_initial_schema.sql`
   - `supabase/migrations/20250222000002_seed.sql`
3. Create a storage bucket in **Storage**:
   - Name: `cms-uploads`
   - Public: **Yes**
   - File size limit: **250 MB** (to accommodate video uploads)
   - Allowed MIME types:
     - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
     - Audio: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`, `audio/webm`, `audio/ogg`, `audio/flac`, `audio/aac`, `audio/mp4`
     - Video: `video/mp4`, `video/webm`
     - Documents: `application/pdf`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/html`, `text/plain`, `text/csv`
   - Add policies: **Public read**; **Authenticated** insert/update/delete.

   The bucket uses these folder prefixes:
   | Folder | Content | Max size (CMS) |
   |---|---|---|
   | `images/` | Photos, hero banners, thumbnails | 5 MB |
   | `recordings/` | MP3 recordings | 50 MB |
   | `videos/` | MP4/WebM video files | 250 MB |
   | `documents/` | PDF, Excel, Word, CSV | 20 MB |
4. In **Authentication** → **Users**, create your first user (email + password).
5. In the SQL Editor or Table Editor, insert a row in `profiles` for that user:
   - `id`: the user’s UUID (from Authentication → Users)
   - `username`: display name
   - `role`: `ADMIN`
   - `email`: same as auth user

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – Project URL from Supabase → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public key from the same page

Optional:

- `SUPABASE_SERVICE_ROLE_KEY` – required only for the WordPress import script (bypasses RLS)
- `NEXT_PUBLIC_GEMINI_API_KEY` – for AI Assist in the page editor

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Member Login** and sign in with your Supabase user, then open **Admin Dashboard** (or go to `/admin`) to manage content.

## Deploy on Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com).
2. In the Vercel project, go to **Settings** → **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Optional) `NEXT_PUBLIC_GEMINI_API_KEY`
3. Deploy. The build command is `next build` (default).

## Custom domain

1. In the Vercel project, go to **Settings** → **Domains**.
2. Add your domain (e.g. `westwoodcommunityband.ca`).
3. Vercel will show the required DNS records (e.g. A record or CNAME). Add them at your domain registrar/DNS provider.
4. Use **Redirect** if you want `www` to point to the root (or the other way around).

After DNS propagates, the site will be served on your domain over HTTPS.

## WordPress Import

A one-off script migrates content from a WordPress WXR export into the Supabase database and storage bucket.

```bash
# 1. Set env vars
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 2. Place the WXR XML in the scripts folder
cp ~/Downloads/export.xml scripts/wordpress-export.xml

# 3. Run the import
npm run import-wxr
# or: node scripts/import-wordpress-wxr.mjs scripts/wordpress-export.xml
```

The script will:

1. Parse the WXR XML and classify every attachment (image/audio/video/document).
2. Crawl the `old-site-archive/photos_*.html` pages to build photo gallery events.
3. Download each file from the WordPress server and upload it to `cms-uploads/` with the CMS folder conventions.
4. Upsert all pages into Supabase with their section JSON referencing the new Storage URLs.
5. Write an `import-unassigned-manifest.json` for any attachments that couldn't be auto-mapped.

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Run production build locally
- `npm run lint` – Run ESLint
- `npm run import-wxr` – Run WordPress WXR import (see above)
