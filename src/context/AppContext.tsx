'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, UserRole, PageConfig, SiteSettings, User } from '@/types';
import { db } from '@/services/db';
import { createEmptyPage } from '@/constants';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  login: (role: UserRole) => void;
  logout: () => void;
  updatePage: (updatedPage: PageConfig) => void;
  updateNav: (links: SiteSettings['navLinks']) => void;
  addPage: (title: string, slug: string, addToNav?: boolean) => PageConfig;
  removePage: (pageId: string, removeFromNav?: boolean) => void;
  isAdminMode: boolean;
  setIsAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  adminTab: string;
  setAdminTab: React.Dispatch<React.SetStateAction<string>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => db.load());
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(db.load());
  }, []);

  useEffect(() => {
    if (mounted) {
      db.save(state);
    }
  }, [state, mounted]);

  const login = (role: UserRole) => {
    const user = state.users.find(u => u.role === role) || state.users[0];
    setState(prev => ({ ...prev, currentUser: user }));
    setIsAdminMode(true);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setIsAdminMode(false);
  };

  const updatePage = (updatedPage: PageConfig) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === updatedPage.id ? updatedPage : p)
    }));
  };

  const updateNav = (links: SiteSettings['navLinks']) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, navLinks: links }
    }));
  };

  const addPage = (title: string, slug: string, addToNav = true): PageConfig => {
    const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    const newPage = createEmptyPage(title, normalizedSlug);
    setState(prev => {
      const exists = prev.pages.some(p => p.slug === normalizedSlug);
      if (exists) return prev;
      const nextPages = [...prev.pages, newPage];
      let nextNav = prev.settings.navLinks;
      if (addToNav) {
        const navId = Math.random().toString(36).substring(2, 11);
        nextNav = [...nextNav, { id: navId, label: title, path: normalizedSlug, order: nextNav.length }];
      }
      return {
        ...prev,
        pages: nextPages,
        settings: { ...prev.settings, navLinks: nextNav },
      };
    });
    return newPage;
  };

  const removePage = (pageId: string, removeFromNav = true) => {
    setState(prev => {
      const page = prev.pages.find(p => p.id === pageId);
      if (!page) return prev;
      if (prev.pages.length <= 1) return prev;
      if (page.slug === '/') return prev; // do not remove home
      const nextPages = prev.pages.filter(p => p.id !== pageId);
      let nextNav = prev.settings.navLinks;
      if (removeFromNav) {
        nextNav = nextNav.filter(link => link.path !== page.slug);
      }
      return {
        ...prev,
        pages: nextPages,
        settings: { ...prev.settings, navLinks: nextNav },
      };
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      state,
      setState,
      login,
      logout,
      updatePage,
      updateNav,
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
