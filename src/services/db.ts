'use client';

import { AppState, PageConfig } from '../types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS, DEFAULT_SIDEBAR_BLOCKS } from '../constants';

const STORAGE_KEY = 'westwood_band_cms_data';
const VERSION_KEY = 'westwood_band_cms_version';
const CURRENT_VERSION = '3.0.0'; // CMS customization: sidebarBlocks, section styles, table/separator

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

  public load(): AppState {
    if (typeof window === 'undefined') {
      return {
        settings: DEFAULT_SETTINGS,
        pages: INITIAL_PAGES,
        users: INITIAL_USERS,
        currentUser: null
      };
    }
    
    this.checkVersion();
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        settings: DEFAULT_SETTINGS,
        pages: INITIAL_PAGES,
        users: INITIAL_USERS,
        currentUser: null
      };
    }
    const state = JSON.parse(data) as AppState;
    state.pages = this.migratePages(state.pages);
    return state;
  }

  public reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    window.location.reload();
  }
}

export const db = DbService.getInstance();
