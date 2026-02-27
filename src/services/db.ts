'use client';

import { AppState, PageConfig, SiteSettings } from '../types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS, DEFAULT_SIDEBAR_BLOCKS } from '../constants';
import { createInitialBuilderState } from '../lib/builder/state';

const STORAGE_KEY = 'westwood_band_cms_data';
const VERSION_KEY = 'westwood_band_cms_version';
const CURRENT_VERSION = '3.1.0'; // Nav derived from pages: showInNav, navOrder, navLabel; settings.navLinks removed

export class DbService {
  private static instance: DbService;
  
  private constructor() {}

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  private checkVersion(): void {
    if (typeof window === 'undefined') return;
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  }

  public save(state: Partial<AppState>): void {
    if (typeof window === 'undefined') return;
    const current = this.load();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  }

  private migratePages(pages: PageConfig[]): PageConfig[] {
    return pages.map((p) => {
      const hasSidebar = p.layout !== 'full';
      const needsSidebarBlocks = hasSidebar && (!p.sidebarBlocks || p.sidebarBlocks.length === 0);
      return {
        ...p,
        sidebarBlocks: needsSidebarBlocks ? [...DEFAULT_SIDEBAR_BLOCKS] : p.sidebarBlocks,
      };
    });
  }

  /** Migrate legacy navLinks from settings onto pages, then strip navLinks from settings. */
  private migrateNavFromSettings(state: AppState): AppState {
    const rawSettings = state.settings as SiteSettings & { navLinks?: { id: string; label: string; path: string; order: number }[] };
    const legacyNav = rawSettings.navLinks;
    let pages = state.pages;
    if (legacyNav?.length) {
      const linksByPath = new Map(legacyNav.map((l) => [l.path, l]));
      pages = state.pages.map((p) => {
        const link = linksByPath.get(p.slug);
        if (!link) return { ...p, showInNav: p.showInNav ?? false, navOrder: p.navOrder ?? 999 };
        return {
          ...p,
          showInNav: true,
          navOrder: link.order,
          navLabel: link.label !== p.title ? link.label : undefined,
        };
      });
    }
    const settings: SiteSettings = {
      bandName: rawSettings.bandName,
      logoUrl: rawSettings.logoUrl,
      primaryColor: rawSettings.primaryColor,
      secondaryColor: rawSettings.secondaryColor,
      footerText: rawSettings.footerText,
    };
    return { ...state, pages, settings };
  }

  public load(): AppState {
    const base = typeof window === 'undefined'
      ? {
          settings: DEFAULT_SETTINGS,
          pages: INITIAL_PAGES,
          users: INITIAL_USERS,
          currentUser: null as AppState['currentUser'],
        }
      : (() => {
          this.checkVersion();
          const data = localStorage.getItem(STORAGE_KEY);
          if (!data) {
            return {
              settings: DEFAULT_SETTINGS,
              pages: INITIAL_PAGES,
              users: INITIAL_USERS,
              currentUser: null as AppState['currentUser'],
            };
          }
          const state = JSON.parse(data) as Partial<AppState>;
          const pages = this.migratePages(state.pages ?? INITIAL_PAGES);
          const migrated = this.migrateNavFromSettings({
            ...state,
            pages,
            settings: state.settings ?? DEFAULT_SETTINGS,
            users: state.users ?? INITIAL_USERS,
            currentUser: state.currentUser ?? null,
          } as AppState);
          return migrated;
        })();

    return {
      ...base,
      pageBuilder: createInitialBuilderState(base.pages),
    } as AppState;
  }

  public reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    window.location.reload();
  }
}

export const db = DbService.getInstance();
