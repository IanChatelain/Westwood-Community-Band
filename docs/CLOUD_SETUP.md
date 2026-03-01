# Cloud setup for the public/admin cache flow

This describes how Turso, Cloudflare R2, and your deployment (e.g. Vercel) should be configured so the new cached public path and dynamic admin path work correctly.

---

## 1. Turso (libSQL)

**Role:** Source of truth for CMS (settings, pages). Admin always reads/writes live; public reads are cached by Next.js.

**Setup:**

- Create a database at [turso.tech](https://turso.tech) and note:
  - **Database URL** → `TURSO_DATABASE_URL` (e.g. `libsql://your-db-your-org.turso.io`)
  - **Auth token** → `TURSO_AUTH_TOKEN`
- Run migrations (Drizzle) so the schema exists.
- **Where to set env vars:** Both locally (`.env`) and in your deployment (e.g. Vercel → Project → Settings → Environment Variables). Use the same values for Production/Preview if you want admin and public to share one DB.

**Behavior with the new flow:**

- **Admin** (`/admin/*`): Every request is `force-dynamic`, so each admin page load calls `loadCmsState()` and hits Turso. If Turso is down, the admin UI shows the “We’re having trouble connecting” message and Retry.
- **Public**: First paint uses `getCachedCmsState()` (Next.js Data Cache). When the cache is cold or after revalidation (e.g. 60s or when you call `revalidateTag('cms', 'max')` after a CMS write), the server will call Turso once to refill the cache. So Turso only needs to be reachable from the Next.js server when:
  - A public request triggers a cache miss or revalidation, or
  - An admin user saves content (writes + cache invalidation).

---

## 2. Cloudflare R2 (media)

**Role:** Store uploaded images/recordings/videos/documents. The app uploads via presigned URLs (using R2 API credentials). The **public site** serves images through Next.js `<Image />` using a public base URL.

**Setup:**

### 2.1 R2 bucket and API

- In [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → create a bucket (e.g. `cms-uploads`).
- **R2 API tokens:** Create an API token that can read/write this bucket. Set in env:
  - `R2_ACCOUNT_ID` – from the R2 overview (right-hand side).
  - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` – from the created token.
  - `R2_BUCKET_NAME` – e.g. `cms-uploads`.

These are used by the **upload** flow (admin) only; they must be available on the server (not exposed to the client).

### 2.2 Public URL for images (required for Next.js Image)

The public site needs a **base URL** where objects are reachable so that:

1. Stored object keys (e.g. `images/123.jpg`) become full URLs: `{R2_PUBLIC_URL}/images/123.jpg`.
2. Next.js `images.remotePatterns` (in `next.config.ts`) allows that host for `<Image />` optimization.

You have two options:

**Option A – R2 public bucket (simplest)**  
- In the R2 bucket, enable **Public access** (e.g. “Allow Access” / “Public bucket”).
- Cloudflare gives you a URL like `https://pub-<id>.r2.dev` (or similar). Set:
  - `R2_PUBLIC_URL=https://pub-<your-bucket-public-host>.r2.dev`
- No custom domain or Worker required. Use this if you’re fine with the `*.r2.dev` hostname.

**Option B – Custom domain (recommended for production)**  
- In R2 → your bucket → **Settings** → **Public access** → attach a custom domain (e.g. `media.yourdomain.com` or `cdn.yourdomain.com`).
- Add the CNAME (or A/AAAA) record at your DNS provider as Cloudflare instructs.
- Set:
  - `R2_PUBLIC_URL=https://media.yourdomain.com` (no trailing slash)
- Then all image URLs will use your domain and Next.js will optimize them via `remotePatterns` (which we derive from `R2_PUBLIC_URL`).

**Where to set:**  
- `R2_PUBLIC_URL` must be set in the **deployment** environment (e.g. Vercel) so that `next.config.ts` can add the correct `images.remotePatterns` at build time. If it’s missing at build time, no remote patterns are added and only same-origin images are optimized.
- Also set it in `.env` for local dev if you use R2 in development.

---

## 3. Deployment (e.g. Vercel)

**Role:** Run Next.js so that public routes use the Data Cache (and optional CDN) and admin routes stay dynamic.

### 3.1 Environment variables

Set these in the deployment project (e.g. Vercel → Settings → Environment Variables). Prefer **Production** (and optionally **Preview**) so builds and runtime see the same config.

| Variable | Required | When | Notes |
|----------|----------|------|--------|
| `TURSO_DATABASE_URL` | Yes | Build + Runtime | libSQL URL for Turso. |
| `TURSO_AUTH_TOKEN` | Yes | Runtime | Turso auth token (mark **sensitive** if the UI supports it). |
| `R2_ACCOUNT_ID` | Yes (for uploads) | Runtime | Cloudflare account ID. |
| `R2_ACCESS_KEY_ID` | Yes (for uploads) | Runtime | R2 API token. |
| `R2_SECRET_ACCESS_KEY` | Yes (for uploads) | Runtime | R2 API token (sensitive). |
| `R2_BUCKET_NAME` | Yes (for uploads) | Runtime | e.g. `cms-uploads`. |
| `R2_PUBLIC_URL` | Yes (for images) | **Build** (and runtime) | Public base URL for R2 (used for `remotePatterns` at build and for resolving image URLs at runtime). |
| `AUTH_SECRET` | Yes | Runtime | Secret for JWT signing (auth). |

Optional:

- `NEXT_PUBLIC_GEMINI_API_KEY` – only if you use AI Assist.

**Important:**  
- `R2_PUBLIC_URL` must be set at **build time** so `next.config.ts` can register the R2 host in `images.remotePatterns`. In Vercel, add it to the same environment (e.g. Production); it’s read during `next build`.
- Do **not** expose Turso or R2 write credentials to the client; they are only used in server code and server actions.

### 3.2 No extra infra for cache

- **Public:** Caching is handled by Next.js (Data Cache + optional Full Route Cache). With `revalidate = 60` and `revalidateTag('cms', 'max')` on CMS writes, you don’t need a separate cron or external cache; the next request after a save will revalidate in the background (stale-while-revalidate with `'max'`).
- **Admin:** `force-dynamic` on `/admin` is set in the app; the deployment will run these requests on the server and skip caching for that segment.

### 3.3 Optional: Edge vs Node

- The app works with the default Node server. If you later move the public segment to Edge, ensure Turso and any server-only code used for public (e.g. `getCachedCmsState()` → `loadCmsState()`) are supported on Edge (e.g. Turso Edge SDK / HTTP client). Admin can stay on Node if needed.

---

## 4. Quick checklist

- [ ] Turso created; `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` set in deployment and locally.
- [ ] R2 bucket created; `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` set (for uploads).
- [ ] R2 public URL configured (public bucket **or** custom domain); `R2_PUBLIC_URL` set in deployment **and** at build time (same env in Vercel is fine).
- [ ] `AUTH_SECRET` set in deployment (and locally if you test auth).
- [ ] After first deploy, open a public page and an R2 image URL: confirm the image loads via `/_next/image?url=...` (Next.js Image optimization).
- [ ] Open `/admin`, make a change, save: confirm the public site shows the update within the next request or revalidate window.
- [ ] (Optional) Simulate Turso down: confirm admin shows “We’re having trouble connecting” and Retry works when Turso is back.

---

## 5. Data flow summary

```
Public request
  → (public) layout runs on server
  → getCachedCmsState() (Data Cache; on miss/revalidate → Turso)
  → AppProvider(initialCmsState) + ClientLayout + page
  → Images: <Image src={R2_PUBLIC_URL/...} /> → Next.js image optimization → CDN

Admin request
  → admin layout (force-dynamic)
  → AppProvider() (no initial state)
  → loadCmsState() on client → server action → Turso (live)
  → On save: write to Turso + revalidateTag('cms', 'max')
```

Upload (admin): browser → server action (presigned URL) → client uploads to R2; stored object URL = `R2_PUBLIC_URL/key`.
