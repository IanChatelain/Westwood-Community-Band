# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Westwood Community Band CMS — a Next.js (App Router) headless CMS with Turso/SQLite for data, MinIO (local) / Cloudflare R2 (prod) for media, and Drizzle ORM. See `README.md` and `docs/LOCAL_DEVELOPMENT.md` for full details.

### Services

| Service | How to start | Port |
|---------|-------------|------|
| Next.js dev server | `npm run dev` | 3000 |
| MinIO (S3-compatible storage) | `sudo docker compose up -d` | 9000 (API), 9001 (console) |
| SQLite local DB | Embedded via `file:.data/local.db` — no separate process | N/A |

### Starting the dev environment

1. `sudo dockerd &>/tmp/dockerd.log &` — start Docker daemon (required before MinIO).
2. `sudo docker compose up -d` — start MinIO container.
3. `npm run setup:local` — creates `.data/`, `.env.local`, pushes DB schema, creates MinIO bucket. Safe to re-run.
4. To seed an admin user: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`, then `npm run db:seed`.
5. `npm run dev` — starts Next.js dev server on port 3000.

### Key commands

- **Lint**: `npm run lint` (Note: as of March 2026, `eslint-config-next` in `package.json` resolves to a wrong community package — lint will fail until the dependency is corrected to the official Next.js ESLint config.)
- **Build**: `npm run build`
- **Dev**: `npm run dev` (uses Webpack; `npm run dev:turbo` for Turbopack)
- **DB schema push**: `npm run db:push`
- **Seed**: `npm run db:seed` (requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`)

### Gotchas

- Docker runs inside a Firecracker VM container; `sudo dockerd` must be started manually and requires `fuse-overlayfs` storage driver and `iptables-legacy`. The update script handles Docker daemon startup.
- MinIO must be running before `npm run setup:local` if you want the bucket to be created automatically. If the bucket already exists, the script safely skips creation.
- The `.env.local` file is gitignored and created from `.env.local.example` by `npm run setup:local`.
- Admin login at `/admin`; credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local`.
