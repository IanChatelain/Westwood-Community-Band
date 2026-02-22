# Westwood Community Band

A Next.js CMS for the Westwood Community Band website, with Supabase for auth, storage, and data, and optional deployment on Vercel with a custom domain.

## Stack

- **Next.js** (App Router)
- **Supabase** – Auth, PostgreSQL (site settings, pages, profiles), Storage (image uploads)
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
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Add policies: **Public read**; **Authenticated** insert/update/delete.
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

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Run production build locally
- `npm run lint` – Run ESLint
