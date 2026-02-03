'use client';

import { AppState } from '../types';
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS } from '../constants';

const STORAGE_KEY = 'westwood_band_cms_data';

export class DbService {
  private static instance: DbService;
  
  private constructor() {}

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  public save(state: Partial<AppState>): void {
    if (typeof window === 'undefined') return;
    const current = this.load();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
    window.location.reload();
  }
}

export const db = DbService.getInstance();
