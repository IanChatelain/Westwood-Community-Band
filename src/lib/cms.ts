'use server';

import { db } from '@/db';
import { siteSettings, pages } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { AppState, SiteSettings, PageConfig, PageSection, BuilderBlockType } from '@/types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS } from '@/constants';

const BUILDER_BLOCK_TYPES: BuilderBlockType[] = ['richText', 'image', 'separator', 'spacer', 'button'];

function isBuilderBlocks(arr: unknown[]): boolean {
  return arr.length > 0 && arr.every(
    (s) => s && typeof s === 'object' && 'type' in s && BUILDER_BLOCK_TYPES.includes((s as { type: unknown }).type as BuilderBlockType),
  );
}

function blocksToSections(blocks: any[]): PageSection[] {
  return blocks
    .filter((b) => b && typeof b === 'object' && b.type)
    .map((block) => {
      const id = block.id ?? Math.random().toString(36).substring(2, 11);

      if (block.type === 'richText') {
        const style = block.displayStyle ?? 'text';
        if (style === 'hero') {
          return {
            id,
            type: 'hero' as const,
            title: block.title ?? '',
            content: block.content ?? '',
            imageUrl: block.imageUrl ?? undefined,
            minHeight: block.heroHeightPx ?? undefined,
          };
        }
        return {
          id,
          type: 'text' as const,
          title: block.title ?? '',
          content: block.content ?? '',
        };
      }

      if (block.type === 'image') {
        return {
          id,
          type: 'image-text' as const,
          title: block.alt ?? '',
          content: block.caption ?? '',
          imageUrl: block.src ?? undefined,
        };
      }

      if (block.type === 'separator') {
        const sepStyle = block.style === 'dotted' ? 'dotted' : block.style === 'dashed' ? 'dotted' : 'line';
        return {
          id,
          type: 'separator' as const,
          title: '',
          content: '',
          separatorStyle: sepStyle as PageSection['separatorStyle'],
        };
      }

      if (block.type === 'spacer') {
        return {
          id,
          type: 'separator' as const,
          title: '',
          content: '',
          separatorStyle: 'space' as const,
          separatorSpacing: (block.height ?? 32) > 48 ? 'large' as const : 'medium' as const,
        };
      }

      if (block.type === 'button') {
        return {
          id,
          type: 'text' as const,
          title: block.label ?? 'Button',
          content: block.href ? `<a href="${block.href}">${block.label ?? 'Link'}</a>` : '',
        };
      }

      return {
        id,
        type: 'text' as const,
        title: '',
        content: block.content ?? '',
      };
    });
}

function rowToSettings(row: typeof siteSettings.$inferSelect): SiteSettings {
  return {
    bandName: row.bandName,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    footerText: row.footerText,
  };
}

function rowToPage(row: typeof pages.$inferSelect): PageConfig {
  const sectionsData = Array.isArray(row.sections) ? row.sections : [];
  const storedAsBlocks = isBuilderBlocks(sectionsData as object[]);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    layout: row.layout as PageConfig['layout'],
    sidebarWidth: row.sidebarWidth,
    sections: storedAsBlocks ? blocksToSections(sectionsData) : (sectionsData as PageConfig['sections']),
    sidebarBlocks: row.sidebarBlocks ? (Array.isArray(row.sidebarBlocks) ? row.sidebarBlocks as PageConfig['sidebarBlocks'] : undefined) : undefined,
    showInNav: row.showInNav ?? true,
    navOrder: row.navOrder ?? 999,
    navLabel: row.navLabel ?? undefined,
    isArchived: row.isArchived ?? false,
  };
}

export async function loadCmsState(): Promise<Partial<AppState> | null> {
  try {
    const [settingsRows, pageRows] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.id, 1)),
      db.select().from(pages).orderBy(asc(pages.navOrder)),
    ]);

    const settings = settingsRows.length > 0 ? rowToSettings(settingsRows[0]) : DEFAULT_SETTINGS;
    const pageList = pageRows.length > 0 ? pageRows.map(rowToPage) : INITIAL_PAGES;

    return {
      settings,
      pages: pageList,
      users: INITIAL_USERS,
      currentUser: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('loadCmsState failed:', message, err);
    return null;
  }
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  try {
    await db.update(siteSettings).set({
      bandName: settings.bandName,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      footerText: settings.footerText,
      updatedAt: new Date().toISOString(),
    }).where(eq(siteSettings.id, 1));
    return true;
  } catch (err) {
    console.error('saveSettings failed:', err);
    return false;
  }
}

export async function savePage(page: PageConfig): Promise<boolean> {
  try {
    await db.insert(pages).values({
      id: page.id,
      title: page.title,
      slug: page.slug,
      layout: page.layout,
      sidebarWidth: page.sidebarWidth,
      sections: page.sections as unknown[],
      sidebarBlocks: (page.sidebarBlocks ?? null) as unknown[] | null,
      showInNav: page.showInNav ?? true,
      navOrder: page.navOrder ?? 999,
      navLabel: page.navLabel ?? null,
      isArchived: page.isArchived ?? false,
      updatedAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: pages.id,
      set: {
        title: page.title,
        slug: page.slug,
        layout: page.layout,
        sidebarWidth: page.sidebarWidth,
        sections: page.sections as unknown[],
        sidebarBlocks: (page.sidebarBlocks ?? null) as unknown[] | null,
        showInNav: page.showInNav ?? true,
        navOrder: page.navOrder ?? 999,
        navLabel: page.navLabel ?? null,
        isArchived: page.isArchived ?? false,
        updatedAt: new Date().toISOString(),
      },
    });
    return true;
  } catch (err) {
    console.error('savePage failed:', err);
    return false;
  }
}

export async function deletePage(pageId: string): Promise<boolean> {
  try {
    await db.delete(pages).where(eq(pages.id, pageId));
    return true;
  } catch {
    return false;
  }
}

export async function savePages(pageList: PageConfig[]): Promise<boolean> {
  try {
    for (const page of pageList) {
      await db.insert(pages).values({
        id: page.id,
        title: page.title,
        slug: page.slug,
        layout: page.layout,
        sidebarWidth: page.sidebarWidth,
        sections: page.sections as unknown[],
        sidebarBlocks: (page.sidebarBlocks ?? null) as unknown[] | null,
        showInNav: page.showInNav ?? true,
        navOrder: page.navOrder ?? 999,
        navLabel: page.navLabel ?? null,
        isArchived: page.isArchived ?? false,
        updatedAt: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: pages.id,
        set: {
          title: page.title,
          slug: page.slug,
          layout: page.layout,
          sidebarWidth: page.sidebarWidth,
          sections: page.sections as unknown[],
          sidebarBlocks: (page.sidebarBlocks ?? null) as unknown[] | null,
          showInNav: page.showInNav ?? true,
          navOrder: page.navOrder ?? 999,
          navLabel: page.navLabel ?? null,
          isArchived: page.isArchived ?? false,
          updatedAt: new Date().toISOString(),
        },
      });
    }
    return true;
  } catch (err) {
    console.error('savePages failed:', err);
    return false;
  }
}
