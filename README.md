# Westwood Community Band

A Next.js CMS for the Westwood Community Band website, with Turso (libSQL) for data, Cloudflare R2 for media storage, and deployment on Vercel with custom domain support.

## Stack

- **Next.js** (App Router)
- **Turso** – libSQL database (site settings, pages, profiles)
- **Cloudflare R2** – Media storage (images, recordings, videos, documents)
- **Vercel** – Hosting and custom domain

## Getting Started

### 1. Turso and R2 setup

See [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md) for detailed Turso and R2 configuration.

**Quick start (local):**

1. Run `npm run setup:local` to create `.data`, `.env.local`, push schema, and optionally create MinIO bucket.
2. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`.
3. Run `npm run db:seed` to seed site settings and admin profile.
4. (Optional) Set `SEED_INITIAL_PAGES=1` and run `npm run db:seed` again to seed initial pages when the DB is empty.
5. Run `npm run dev`.

### 2. Environment variables

Copy `.env.example` to `.env` (and `.env.local` for local overrides). Set:

- `TURSO_DATABASE_URL` – libSQL URL (cloud: `libsql://...`; local: `file:.data/local.db`)
- `TURSO_AUTH_TOKEN` – Required for cloud Turso
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` – Public base URL for R2 objects (required at build time for images)
- `AUTH_SECRET` – JWT signing secret

Optional: `NEXT_PUBLIC_GEMINI_API_KEY` for AI Assist, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` for seeding.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Member Login** and sign in with your admin user, then open **Admin Dashboard** (or go to `/admin`).

## Deploy on Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com).
2. Add environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `R2_*`, `R2_PUBLIC_URL`, `AUTH_SECRET`.
3. Deploy. `R2_PUBLIC_URL` must be set at build time for Next.js image optimization.

## Custom domain

1. In Vercel → **Settings** → **Domains**, add your domain.
2. Add the DNS records at your provider.
3. Use **Redirect** if you want `www` to point to the root (or vice versa).

## WordPress Import

A one-off script migrates content from a WordPress WXR export into Turso and R2.

```bash
# 1. Set env vars (from .env or export)
# TURSO_DATABASE_URL, TURSO_AUTH_TOKEN (for cloud)
# R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL

# 2. Place the WXR XML in the scripts folder
cp ~/Downloads/export.xml scripts/wordpress-export.xml

# 3. Run the import
npm run import-wxr
# or: node scripts/import-wordpress-wxr.mjs scripts/wordpress-export.xml
```

The script will:

1. Parse the WXR XML and classify every attachment (image/audio/video/document).
2. Download each file from the WordPress server and upload it to R2 with CMS folder conventions (images/, recordings/, videos/, documents/).
3. Crawl `old-site-archive/photos_*.html` to build photo gallery events.
4. Upsert media, photos, and documents pages into Turso with section JSON referencing the new R2 URLs.
5. Write `import-unassigned-manifest.json` for attachments that couldn't be auto-mapped.

## Data seeding checklist

For a fresh setup (local or production):

1. Run `npm run setup:local` (local) or ensure schema is pushed.
2. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`.
3. Run `npm run db:seed`.
4. (Optional) `SEED_INITIAL_PAGES=1` + `npm run db:seed` to seed baseline pages when DB is empty.
5. (Optional) Run `npm run import-wxr` with a WXR file to import WordPress content into R2 and Turso.
6. Verify: public site loads, images use R2, admin can save.

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Run production build locally
- `npm run lint` – ESLint
- `npm run setup:local` – Local setup (schema push, .env.local, MinIO bucket)
- `npm run db:seed` – Seed site settings and admin (set SEED_ADMIN_*)
- `npm run db:push` – Push Drizzle schema to DB
- `npm run import-wxr` – WordPress WXR import (Turso + R2)
