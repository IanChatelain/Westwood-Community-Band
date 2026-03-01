---
name: Next.js Public/Admin Cache Refactor
overview: Decouple the public read-path from the admin write-path by introducing a cached server-side data layer for public routes, forcing dynamic rendering for admin, adding cache invalidation on CMS writes, and improving resilience (graceful admin errors + Next.js Image for R2).
todos: []
isProject: false
---

# Next.js Public/Admin Architecture Refactor Plan

## Current State (from codebase)

- **Public site**: Served by a single client component `[src/app/[[...slug]]/page.tsx](src/app/[[...slug]]/page.tsx)` that gets data via `useAppContext()` → `refreshCmsState()` → server action `loadCmsState()` in `[src/lib/cms.ts](src/lib/cms.ts)`. Every visit triggers a Turso read after hydration.
- **Admin**: `[src/app/admin/page.tsx](src/app/admin/page.tsx)` and CMS flows use the same `AppProvider` and `loadCmsState()`; no route-level `dynamic` or cache bypass.
- **No caching**: No `revalidate`, `dynamic`, `unstable_cache`, or `revalidateTag` in app source; all routes use Next.js defaults (effectively dynamic when server actions/DB are involved).
- **Media**: R2 assets are displayed via raw `<img src={url}>` (e.g. in `[src/components/ui/PageContent.tsx](src/components/ui/PageContent.tsx)`); no Next.js `remotePatterns` or `<Image />` optimization.
- **Error handling**: When `loadCmsState()` fails it returns `null`; `[AppContext](src/context/AppContext.tsx)` falls back to `DEFAULT_SETTINGS` and `INITIAL_PAGES` so the UI does not crash, but there is no explicit “database unavailable” message for admin users.

---

## Phase 1: Route separation and segment config

**Goal:** Clearly separate public and admin route segments and set segment-level caching behavior so the public tree can be cached and the admin tree is always dynamic.

1. **Introduce route groups**
  - Move the public catch-all under a route group: e.g. `src/app/(public)/[[...slug]]/page.tsx` (and keep or add `(public)/layout.tsx` as needed).
  - Keep admin under `src/app/admin/` and add or update `src/app/admin/layout.tsx`.
2. **Force public segment to be cacheable (static/ISR)**
  - In the **public** layout (e.g. `src/app/(public)/layout.tsx`), set:
    - `export const dynamic = 'force-static'` **or** `export const revalidate = <seconds>` (e.g. `60` or `3600`) so the segment is eligible for full route cache / ISR.
  - Do **not** use `dynamic = 'force-dynamic'` on public routes so that Next.js can serve cached RSC payloads and HTML from the edge.
3. **Force admin segment to bypass cache**
  - In `src/app/admin/layout.tsx` set:
    - `export const dynamic = 'force-dynamic'`.
  - This ensures every admin request is rendered on demand and never served from the Data Cache or Full Route Cache, so admin always sees live Turso data.
4. **Root layout**
  - Keep the root layout minimal (fonts, `globals.css`). Decide whether `AppProvider` stays at root or is split (see Phase 2). If it stays at root, it must accept optional `initialCmsState` so the public layout can inject cached data and avoid the client calling `loadCmsState()` for the first paint.

---

## Phase 2: Cached public read-path (Drizzle + Next.js cache)

**Goal:** Public pages must not require a live DB connection to render; data must come from Next.js Data Cache (or equivalent) so the public site can be served from cache/CDN when Turso is down.

1. **Create a server-only, cached CMS read API**
  - Add a new module (e.g. `src/lib/cms-public.ts` or `src/lib/cms-cache.ts`) that:
    - Imports the same Drizzle schema and `db` as `cms.ts`.
    - Exposes a single async function, e.g. `getCachedCmsState()`, that performs the **same** reads as `loadCmsState()` (site settings + pages ordered by `navOrder`).
    - Wraps those reads in `unstable_cache` from `next/cache` with:
      - A stable cache key (e.g. `'cms-state'` or `'cms-state-v1'`).
      - Tags: `['cms']` (or `['cms', 'cms-pages', 'cms-settings']` if you want finer-grained invalidation later).
      - `revalidate` (e.g. `60` or `3600` seconds) so ISR-style revalidation runs on an interval even without on-demand invalidation.
    - Returns the same shape as `loadCmsState()` (or a type that matches what the public UI needs: settings + pages).
  - This module must **only** be imported from server components or server actions that are used on the public path (or from the invalidation path). Do not import it from client components or from admin-only code that should always hit the DB.
2. **Use cached data in the public layout**
  - In the public layout (e.g. `src/app/(public)/layout.tsx`), make it an **async server component** that:
    - Awaits `getCachedCmsState()`.
    - Passes the result as **initial state** into the tree. Options:
      - **Option A:** Render a provider that accepts `initialCmsState` (e.g. `AppProvider` or a dedicated `PublicCmsProvider`) and use it so the client does not call `loadCmsState()` for the initial paint. The client can still call `refreshCmsState()` for an explicit “refresh” (which will hit the server action and DB when the user clicks refresh).
      - **Option B:** Pass the cached state as props/custom provider and have the public page(s) consume it only for initial render; keep `refreshCmsState` optional for manual refresh.
  - Ensure the public **page** (the catch-all) can render using this server-provided state so that the **first** response is fully server-rendered from cache (no DB call during that request). This may require refactoring the catch-all to be a server component that receives cached data and passes it to a client component, or a client component that receives `initialState` from a server layout and uses it before any `loadCmsState()` call.
3. **Keep write path and admin on direct DB**
  - Leave `src/lib/cms.ts` as-is for **writes** and for **admin reads**: admin layout and admin pages (and any client code that runs only in admin) should continue to call `loadCmsState()` (or equivalent) that hits `db` directly with no `unstable_cache`, so admin always sees real-time data.
4. **Route Segment Config for public page**
  - On the public catch-all page (or its layout), keep `revalidate = <n>` consistent with the cached getter so the full route is revalidated on the same interval. If the layout already sets `revalidate`, the page inherits it unless overridden.

---

## Phase 3: Cache invalidation on CMS writes

**Goal:** When a non-technical user publishes changes in the Admin CMS, the public site’s cache must be invalidated so the next request gets fresh data (or revalidates in the background).

1. **Invalidate after every CMS write**
  - In `src/lib/cms.ts`, after each successful write, call `revalidateTag('cms')` (import from `next/cache`). Add it to:
    - `saveSettings`
    - `savePage`
    - `savePages`
    - `deletePage`
    - `restorePageRevision` (after the restore write).
  - Use the same tag string as in `unstable_cache(..., ['cms'])` in `getCachedCmsState()`.
2. **Optional: path-based revalidation**
  - If you want the homepage or specific paths to revalidate explicitly, you can also call `revalidatePath('/')` or `revalidatePath(pathname)` in addition to `revalidateTag('cms')`. Tag-based revalidation is usually sufficient when a single cache key holds all CMS state.
3. **No cron required**
  - With `revalidate` (time-based) plus `revalidateTag('cms')` (on publish), you do not need a separate cron job for invalidation; the next request after a save will trigger a revalidation (or serve stale and revalidate in background depending on Next.js version/behavior).

---

## Phase 4: Admin-only dynamic behavior and error handling

**Goal:** Admin routes never use cached CMS data; when Turso is unavailable, show a friendly message instead of a broken or empty UI.

1. **Confirm admin segment is dynamic**
  - Ensure `src/app/admin/layout.tsx` has `export const dynamic = 'force-dynamic'` so no Full Route Cache or static prerender is used for `/admin` and children.
2. **Graceful error UI when DB is down**
  - In the **admin** flow, when `loadCmsState()` (or any critical admin read) is used and returns `null` (or throws), surface a clear message to the user:
    - **Option A:** In `AppContext`, when running in an “admin” context (e.g. when `pathname.startsWith('/admin')` or when `currentUser` is admin), if the initial `loadCmsState()` returns `null`, set an error state (e.g. `cmsLoadError: true` or `error: 'database_unavailable'`) and do **not** fall back to `INITIAL_PAGES` for admin; instead show a dedicated “Database temporarily unavailable” (or similar) message in the admin UI.
    - **Option B:** Add an admin-specific layout or wrapper that calls a server-side “health” or `loadCmsState()` and redirects or renders an error page if the DB is unreachable, so the admin never sees a half-empty dashboard.
  - Recommend **Option A** so one place (context + admin dashboard) handles it: e.g. in `AppContext`, when on admin and `loadCmsState()` returns `null`, set `cmsLoadError: true` and keep existing fallback only for public; in `AdminDashboard` (or admin layout client component), if `cmsLoadError` is true, render a friendly message (e.g. “We’re having trouble connecting. Please try again in a few minutes.”) with a retry button that calls `refreshCmsState()` again.
3. **Retry**
  - Provide a “Retry” or “Reload” action in that error UI that calls `refreshCmsState()` (or re-fetches admin data) so the user can recover without leaving the page when Turso is back.

---

## Phase 5: R2 media via Next.js Image (CDN caching)

**Goal:** Serve R2 images through Next.js `<Image />` so they benefit from optimization and CDN caching; if R2 is briefly down, cached images can still be served.

1. **Configure `images.remotePatterns`**
  - In `[next.config.ts](next.config.ts)`, add an `images` section with `remotePatterns` that allow the R2 public host. Use the hostname derived from `R2_PUBLIC_URL` (e.g. `https://pub-xxx.r2.dev` or your custom domain). Example pattern: `{ protocol: 'https', hostname: '<host from R2_PUBLIC_URL>', pathname: '/**' }`.
2. **Replace `<img>` with `<Image />` on the public site**
  - In components that render CMS-driven images on the **public** site (e.g. `[src/components/ui/PageContent.tsx](src/components/ui/PageContent.tsx)`), replace `<img src={...}>` with Next.js `<Image />` for:
    - Hero/block images (`block.imageUrl`, `section.imageUrl`).
    - Gallery event cover images (`ev.coverImageUrl`).
  - Use appropriate `width`/`height` or `fill` and `sizes` to avoid layout shift and allow Next.js to optimize and cache. For R2 URLs, `src` will be the full `R2_PUBLIC_URL`-based URL.
3. **Admin vs public**
  - Admin UI (e.g. SectionEditor, thumbnails) can keep using `<img>` for simplicity if desired, or use `<Image />` as well for consistency; the resilience gain is mainly for the public-facing pages where CDN caching matters most.
4. **Optional: Image loader**
  - If R2 is behind a custom domain or you need specific sizing rules, you can add a custom `loader` in `next.config` or per-Image; otherwise the default Next.js image optimization is sufficient.

---

## Phase 6: Verification and edge cases

1. **Public: no DB on cold request**
  - With the public layout and page using only `getCachedCmsState()` for the initial render, disable or simulate Turso being down and confirm the public site still returns 200 with cached content (and that the first request after a restart may populate the cache).
2. **Admin: always fresh and graceful failure**
  - With Turso up, confirm admin shows live data; with Turso down (or invalid credentials), confirm the admin UI shows the friendly error message and retry works when the DB is back.
3. **Invalidation**
  - After saving in admin (e.g. change site settings or a page), confirm the public site shows the updated content within the next request (or after revalidate window).
4. **Images**
  - Confirm R2-backed images on the public site load through `/_next/image` and return cache headers from your deployment (e.g. Vercel Edge or your CDN).

---

## Summary diagram (data flow)

```mermaid
flowchart LR
  subgraph public [Public]
    Visitor[Visitor]
    Edge[Edge CDN]
    Cache[Data Cache]
    GetCached[getCachedCmsState]
    Visitor --> Edge
    Edge --> Cache
    Cache --> GetCached
    GetCached -.->|"revalidateTag / revalidate"| Cache
  end

  subgraph admin [Admin]
    AdminUser[Admin User]
    AdminLayout[Admin Layout]
    loadCms[loadCmsState]
    DB[(Turso)]
    AdminUser --> AdminLayout
    AdminLayout --> loadCms
    loadCms --> DB
  end

  subgraph writes [Writes]
    saveActions[saveSettings / savePage / etc]
    saveActions --> DB
    saveActions -->|revalidateTag "cms"| Cache
  end
```



---

## File-level checklist (reference)


| Area             | Files to add or touch                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route groups     | `src/app/(public)/layout.tsx`, `src/app/(public)/[[...slug]]/page.tsx` (move from current), `src/app/admin/layout.tsx`                                            |
| Cached read      | New: `src/lib/cms-public.ts` (or `cms-cache.ts`) with `getCachedCmsState()` using `unstable_cache`                                                                |
| Invalidation     | `src/lib/cms.ts`: add `revalidateTag('cms')` in saveSettings, savePage, savePages, deletePage, restorePageRevision                                                |
| Provider/context | `src/context/AppContext.tsx`: support `initialCmsState`, and when on admin and load fails set `cmsLoadError`; admin UI shows error + retry                        |
| Images           | `next.config.ts`: `images.remotePatterns` for R2 host; `src/components/ui/PageContent.tsx` (and any public image components): use `next/image` for CMS image URLs |


This plan gives you a step-by-step, sequential execution path that meets your requirements: public site cached and DB-independent for reads, admin fully dynamic, cache invalidation on publish, admin error handling, and R2 images behind Next.js Image for CDN resilience.