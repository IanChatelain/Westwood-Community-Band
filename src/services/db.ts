'use client';

import { AppState } from '../types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS } from '../constants';

const STORAGE_KEY = 'westwood_band_cms_data';
const VERSION_KEY = 'westwood_band_cms_version';
const CURRENT_VERSION = '2.0.0'; // Increment this when content structure changes

export class DbService {
  private static instance: DbService;
  
  private constructor() {}

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  private checkVersion(): boolean {
    if (typeof window === 'undefined') return true;
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== CURRENT_VERSION) {
      // Version mismatch - clear old data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      return false;
    }
    return true;
  }

  public save(state: Partial<AppState>): void {
    if (typeof window === 'undefined') return;
    const current = this.load();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
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
    
    // Check version and reset if needed
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
    return JSON.parse(data);
  }

  public reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    window.location.reload();
  }
}

export const db = DbService.getInstance();
