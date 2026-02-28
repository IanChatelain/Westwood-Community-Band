import { PageConfig, NavLink } from '@/types';

/**
 * Build header/footer nav links from pages. Pages with showInNav !== false,
 * sorted by navOrder, with label = navLabel ?? title.
 */
export function getNavFromPages(pages: PageConfig[]): NavLink[] {
  return pages
    .filter((p) => p.showInNav !== false && p.isArchived !== true)
    .sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999))
    .map((p, index) => ({
      id: p.id,
      label: p.navLabel ?? p.title,
      path: p.slug,
      order: index,
    }));
}
