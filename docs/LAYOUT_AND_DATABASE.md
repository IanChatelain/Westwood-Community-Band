# Linking layout changes in code to the database

The site’s **layout** (what you see on each page) comes from two places:

1. **Code** – React components that know how to render each *section type* (e.g. `media-hub`, `gallery`, `downloads`).
2. **Database** – The `pages` table in Turso stores each page’s **sections** as JSON. Each section has a `type` (e.g. `"gallery"`, `"media-hub"`) and type-specific data (e.g. `galleryEvents`, `mediaPhotos`).

So: **the UI only shows the new layout when the database actually contains the new section type and shape.** If the DB still has the old structure (e.g. `gallery` + `downloads` instead of `media-hub`), you’ll keep seeing the old layout even though the new code is deployed.

## Why you don’t see layout changes

- Content is loaded from **Turso** via `loadCmsState()`.
- The **initial/fallback** content (e.g. `INITIAL_PAGES` in `src/constants.ts`) is only used when the DB is empty or load fails.
- So if the DB already has pages with the *old* section structure, that’s what gets rendered. New section types or new fields in code don’t change existing rows until the DB is updated.

## How to apply a new layout to the database

When you add or change a section type in code, you have three ways to get the DB in sync:

### 1. Run a one-time migration script (recommended)

We add a script that reads the current pages from Turso, rewrites the relevant page(s) to the new section structure, and writes them back.

- **Example (Media → media-hub):**  
  `npm run db:migrate-media-hub`  
  This updates the Media page to use a single `media-hub` section (Photos / Recordings / Videos tabs) and archives the old Photos page.

- **To add more migrations later:**  
  Add a new script under `scripts/` (e.g. `migrate-xyz.mjs`) that uses the same pattern: connect to Turso, `SELECT` pages, transform the `sections` JSON, `UPDATE` the row(s), then add an npm script in `package.json`.

### 2. Edit in the CMS admin

- Go to Admin → Pages → open the page (e.g. Media).
- Add a section of the new type (e.g. “Media Hub (Photos / Recordings / Videos)”).
- Fill in the new section’s data, then remove or replace the old sections.
- Save. The DB is updated and the new layout appears.

### 3. Reset and rely on initial state (loses existing content)

- If you’re okay losing current DB content, you can clear or reseed the `pages` table so that the app falls back to `INITIAL_PAGES` (which we keep in sync with the new layout in code).  
- This is only suitable for a fresh start or dev; use migrations or CMS edits to preserve content.

## Summary

| Goal | Action |
|------|--------|
| See the new Media tabbed layout | Run `npm run db:migrate-media-hub` once, then reload the site. |
| Change layout in the future | Add a migration script that updates `pages.sections` JSON to the new shape, or edit the page in the CMS. |
| Understand why layout didn’t change | Check that the DB actually has the new section type and structure; if it still has the old one, run the migration or edit in admin. |
