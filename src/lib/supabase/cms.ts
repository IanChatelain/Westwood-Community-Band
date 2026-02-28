'use client';

import { createClient } from '@/lib/supabase/client';
import type { AppState, SiteSettings, PageConfig, PageSection, BuilderBlockType } from '@/types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS } from '@/constants';

const BUILDER_BLOCK_TYPES: BuilderBlockType[] = ['richText', 'image', 'separator', 'spacer', 'button'];

function isBuilderBlocks(arr: unknown[]): boolean {
  return arr.length > 0 && arr.every(
    (s) => s && typeof s === 'object' && 'type' in s && BUILDER_BLOCK_TYPES.includes((s as { type: unknown }).type as BuilderBlockType),
  );
}

/** Convert legacy builder blocks back to PageSection[] so the section editor can handle them. */
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

function rowToSettings(row: { band_name: string; logo_url: string; primary_color: string; secondary_color: string; footer_text: string }): SiteSettings {
  return {
    bandName: row.band_name,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    footerText: row.footer_text,
  };
}

function rowToPage(row: {
  id: string;
  title: string;
  slug: string;
  layout: string;
  sidebar_width: number;
  sections: unknown;
  sidebar_blocks: unknown;
  show_in_nav: boolean | null;
  nav_order: number | null;
  nav_label: string | null;
  is_archived?: boolean | null;
}): PageConfig {
  const sectionsData = Array.isArray(row.sections) ? row.sections : [];
  const storedAsBlocks = isBuilderBlocks(sectionsData as object[]);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    layout: row.layout as PageConfig['layout'],
    sidebarWidth: row.sidebar_width,
    sections: storedAsBlocks ? blocksToSections(sectionsData) : (sectionsData as PageConfig['sections']),
    sidebarBlocks: row.sidebar_blocks ? (Array.isArray(row.sidebar_blocks) ? row.sidebar_blocks as PageConfig['sidebarBlocks'] : undefined) : undefined,
    showInNav: row.show_in_nav ?? true,
    navOrder: row.nav_order ?? 999,
    navLabel: row.nav_label ?? undefined,
    isArchived: row.is_archived ?? false,
  };
}

export async function loadCmsState(): Promise<Partial<AppState> | null> {
  try {
    const supabase = createClient();
    const [settingsRes, pagesRes] = await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).single(),
      supabase.from('pages').select('*').order('nav_order', { ascending: true }),
    ]);
    if (settingsRes.error || pagesRes.error) return null;
    const settings = settingsRes.data ? rowToSettings(settingsRes.data) : DEFAULT_SETTINGS;
    const pages = pagesRes.data?.length ? pagesRes.data.map(rowToPage) : INITIAL_PAGES;
    return {
      settings,
      pages,
      users: INITIAL_USERS,
      currentUser: null,
    };
  } catch {
    return null;
  }
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('site_settings').update({
      band_name: settings.bandName,
      logo_url: settings.logoUrl,
      primary_color: settings.primaryColor,
      secondary_color: settings.secondaryColor,
      footer_text: settings.footerText,
    }).eq('id', 1);
    if (error) {
      console.error('saveSettings failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('saveSettings failed:', err);
    return false;
  }
}

export async function savePage(page: PageConfig): Promise<boolean> {
  try {
    const supabase = createClient();
    const row = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      layout: page.layout,
      sidebar_width: page.sidebarWidth,
      sections: page.sections,
      sidebar_blocks: page.sidebarBlocks ?? null,
      show_in_nav: page.showInNav ?? true,
      nav_order: page.navOrder ?? 999,
      nav_label: page.navLabel ?? null,
      is_archived: page.isArchived ?? false,
    };
    const { error } = await supabase.from('pages').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('savePage failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('savePage failed:', err);
    return false;
  }
}

export async function deletePage(pageId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('pages').delete().eq('id', pageId);
    return !error;
  } catch {
    return false;
  }
}

export async function savePages(pages: PageConfig[]): Promise<boolean> {
  try {
    const supabase = createClient();
    const rows = pages.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      layout: p.layout,
      sidebar_width: p.sidebarWidth,
      sections: p.sections,
      sidebar_blocks: p.sidebarBlocks ?? null,
      show_in_nav: p.showInNav ?? true,
      nav_order: p.navOrder ?? 999,
      nav_label: p.navLabel ?? null,
      is_archived: p.isArchived ?? false,
    }));
    const { error } = await supabase.from('pages').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('savePages failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('savePages failed:', err);
    return false;
  }
}
