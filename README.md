# Westwood Community Band

A modern, self-hosted CMS and public website for the [Westwood Community Band](https://westwoodcommunityband.ca) built with Next.js. The site serves as the band's public home on the web and provides an admin dashboard for managing content, media, and member profiles — no coding required.

## Features

- **Public website** with concert schedule, events, and band information
- **Media library** for photos, audio recordings, videos, and documents
- **Admin dashboard** for content management with a rich page editor
- **AI Assist** (optional) powered by Google Gemini for drafting page content
- **Transactional email** via Resend for member notifications and password resets
- **WordPress import** tool for migrating legacy content

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | [Turso](https://turso.tech/) (libSQL) via Drizzle ORM |
| Media Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) |
| Email | [Resend](https://resend.com/) |
| Hosting | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker** (optional, for local S3 via MinIO)

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/<your-org>/westwood-community-band.git
cd westwood-community-band
npm install

# 2. Create your local env file
cp .env.local.example .env.local

# 3. One-command local setup (creates .data dir, pushes DB schema, optionally creates MinIO bucket)
npm run setup:local

# 4. (Optional) Start MinIO for local media storage
docker compose up -d

# 5. Seed an admin user (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local first)
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Member Login**, sign in with your seeded admin credentials, then open **Admin Dashboard** (or navigate to `/admin`).

## Environment Variables

Two example files are provided:

| File | Purpose |
|------|---------|
| `.env.example` | Production / hosted environments (Turso cloud, Cloudflare R2) |
| `.env.local.example` | Local development (SQLite file, MinIO) |

Copy the relevant example and fill in your values. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | Yes | libSQL URL (`libsql://…` for cloud, `file:.data/local.db` for local) |
| `TURSO_AUTH_TOKEN` | Cloud only | Auth token from Turso dashboard |
| `R2_ACCOUNT_ID` | Cloud only | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 or MinIO access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 or MinIO secret key |
| `R2_BUCKET_NAME` | Yes | Storage bucket name |
| `R2_PUBLIC_URL` | Yes | Public base URL for stored objects (must be set at build time) |
| `S3_ENDPOINT` | Local only | MinIO endpoint (e.g. `http://127.0.0.1:9000`) |
| `AUTH_SECRET` | Yes | Random secret for JWT signing |
| `RESEND_API_KEY` | Yes | API key from Resend |
| `RESEND_FROM_EMAIL` | Yes | Verified sender address |
| `NEXT_PUBLIC_GEMINI_API_KEY` | No | Google Gemini key for AI Assist |

## Deploying to Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com).
2. Add the required environment variables listed above (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `R2_*`, `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
3. **Important:** `R2_PUBLIC_URL` must be set at build time for Next.js image optimization to work.
4. Deploy.

### Custom Domain

1. In Vercel, go to **Settings > Domains** and add your domain.
2. Create the DNS records at your domain provider as prompted.
3. Use a **Redirect** if you want `www` to resolve to the root (or vice versa).

## WordPress Import

If you are migrating from an existing WordPress site, a one-off script can import content from a WXR export into Turso and R2.

```bash
# Place the WXR XML in the scripts folder
cp ~/Downloads/export.xml scripts/wordpress-export.xml

# Run the import (requires TURSO_* and R2_* env vars to be set)
npm run import-wxr
```

The import script will parse the WXR XML, download and re-upload media files to R2, and upsert pages into Turso with updated URLs.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server (Webpack) |
| `npm run dev:turbo` | Start the development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run setup:local` | One-command local setup (schema push, `.env.local`, MinIO bucket) |
| `npm run db:seed` | Seed site settings and admin user (`SEED_ADMIN_*`) |
| `npm run db:seed:profile` | Seed an additional member profile |
| `npm run db:seed:permissions` | Seed role permissions |
| `npm run db:push` | Push Drizzle schema to the database |
| `npm run import-wxr` | Import WordPress WXR content into Turso and R2 |

## License

This project is maintained for the Westwood Community Band.
