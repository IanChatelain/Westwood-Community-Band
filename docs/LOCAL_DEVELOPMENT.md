# Local development (Turso + MinIO)

Use a **local SQLite file** for the database and **MinIO** (S3-compatible) for media so you can develop without Turso or Cloudflare R2. Cursor (or any dev) can run the setup steps below.

## One-time setup

### 1. Copy local env and run setup

```bash
# Creates .data/, .env.local from .env.local.example, pushes schema to file:.data/local.db, creates MinIO bucket
npm run setup:local
```

If `.env.local` already exists, setup only ensures `.data` exists and pushes the schema when `TURSO_DATABASE_URL` is a `file:` URL.

### 2. Start MinIO (for uploads and image URLs)

```bash
docker compose up -d
```

Default: API on **9000**, Console on **9001** (optional). Credentials: `minioadmin` / `minioadmin` (set in `.env.local.example`).  
If uploaded images don’t load in the app, set the `cms-uploads` bucket to **public read** in the MinIO Console (http://localhost:9001) → Buckets → cms-uploads → Access → add policy allowing `GetObject` for anonymous.

### 3. (Optional) Seed an admin user

In `.env.local` set:

- `SEED_ADMIN_EMAIL` – e.g. `admin@example.com`
- `SEED_ADMIN_PASSWORD` – your chosen password

Then:

```bash
npm run db:seed
```

Log in at `/admin` with that email/password.

### 4. Run the app

```bash
npm run dev
```

Public site: http://localhost:3000. Admin: http://localhost:3000/admin.

---

## Env vars (`.env.local`)

| Variable | Purpose |
|---------|--------|
| `TURSO_DATABASE_URL=file:.data/local.db` | Local SQLite; no `TURSO_AUTH_TOKEN` needed. |
| `S3_ENDPOINT=http://127.0.0.1:9000` | MinIO API (enables local S3 in `src/lib/r2.ts`). |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | MinIO credentials (e.g. `minioadmin`). |
| `R2_BUCKET_NAME=cms-uploads` | Bucket name (created by `setup:local` if MinIO is up). |
| `R2_PUBLIC_URL=http://127.0.0.1:9000/cms-uploads` | Base URL for image links and Next.js `remotePatterns`. |
| `AUTH_SECRET` | Required for JWT auth (use any string locally). |

See `.env.local.example` for a full template.

---

## Switching back to cloud

- **DB:** Set `TURSO_DATABASE_URL=libsql://...` and `TURSO_AUTH_TOKEN=...` in `.env` (or `.env.local`). No `file:`.
- **Storage:** Remove `S3_ENDPOINT` (and `R2_LOCAL_ENDPOINT`); set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` for Cloudflare R2.

---

## Cursor / automation

To have Cursor set up local config:

1. Run `npm run setup:local` (creates `.env.local` and local DB schema).
2. Run `docker compose up -d` for MinIO.
3. Optionally run `npm run db:seed` after setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`.
4. Use `.env.local` for all local dev; `.env` can remain for cloud defaults or be ignored when using local.

The `.cursor/rules/local-setup.mdc` rule reminds Cursor of this flow when helping with env or run commands.
