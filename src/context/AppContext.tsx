'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, UserRole, PageConfig, SiteSettings, User } from '@/types';
import { db } from '@/services/db';
import { createEmptyPage } from '@/constants';
import { createClient } from '@/lib/supabase/client';
import { loadCmsState, saveSettings, savePages, savePage, deletePage } from '@/lib/supabase/cms';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  logout: () => void;
  updatePage: (updatedPage: PageConfig) => void;
  addPage: (title: string, slug: string, addToNav?: boolean) => PageConfig;
  removePage: (pageId: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  adminTab: string;
  setAdminTab: React.Dispatch<React.SetStateAction<string>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function profileToUser(profile: { id: string; username: string; role: string; email: string | null }): User {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role as UserRole,
    email: profile.email ?? '',
  };
}

const SUPABASE_ENABLED = typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => db.load());
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Initial load: Supabase first, then fallback to localStorage
  useEffect(() => {
    setMounted(true);
    if (SUPABASE_ENABLED) {
      loadCmsState().then((loaded) => {
        if (loaded) setState(prev => ({ ...prev, settings: loaded.settings!, pages: loaded.pages!, users: loaded.users ?? prev.users }));
        else setState(db.load());
      });
    } else {
      setState(db.load());
    }
  }, []);

  // Persist: Supabase when enabled, else localStorage (debounce Supabase writes)
  useEffect(() => {
    if (!mounted) return;
    if (!SUPABASE_ENABLED) {
      db.save(state);
      return;
    }
    const t = window.setTimeout(() => {
      saveSettings(state.settings);
      savePages(state.pages);
    }, 800);
    return () => clearTimeout(t);
  }, [state.settings, state.pages, mounted]);

  // Supabase auth: sync session and profile to state.currentUser
  useEffect(() => {
    if (!mounted || !SUPABASE_ENABLED) return;
    const supabase = createClient();
    const loadProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('id, username, role, email').eq('id', userId).single();
      if (data) setState(prev => ({ ...prev, currentUser: profileToUser(data) }));
      else setState(prev => ({ ...prev, currentUser: null }));
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id);
      else setState(prev => ({ ...prev, currentUser: null }));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id);
      else setState(prev => ({ ...prev, currentUser: null }));
    });
    return () => subscription.unsubscribe();
  }, [mounted]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, currentUser: null }));
    setIsAdminMode(false);
  }, []);

  const updatePage = (updatedPage: PageConfig) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === updatedPage.id ? updatedPage : p)
    }));
    if (SUPABASE_ENABLED) savePage(updatedPage);
  };

  const addPage = (title: string, slug: string, addToNav = true): PageConfig => {
    const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    const newPage = createEmptyPage(title, normalizedSlug, 0);
    if (!addToNav) {
      (newPage as PageConfig & { showInNav: boolean }).showInNav = false;
    }
    setState(prev => {
      const exists = prev.pages.some(p => p.slug === normalizedSlug);
      if (exists) return prev;
      const maxOrder = Math.max(-1, ...prev.pages.map(p => p.navOrder ?? 999)) + 1;
      newPage.navOrder = addToNav ? maxOrder : 999;
      return { ...prev, pages: [...prev.pages, newPage] };
    });
    if (SUPABASE_ENABLED) savePage(newPage);
    return newPage;
  };

  const removePage = (pageId: string) => {
    const page = state.pages.find(p => p.id === pageId);
    if (!page || state.pages.length <= 1 || page.slug === '/') return;
    setState(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== pageId) }));
    if (SUPABASE_ENABLED) deletePage(pageId);
  };

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      state,
      setState,
      logout,
      updatePage,
      addPage,
      removePage,
      isAdminMode,
      setIsAdminMode,
      adminTab,
      setAdminTab,
      isLoginModalOpen,
      setIsLoginModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
