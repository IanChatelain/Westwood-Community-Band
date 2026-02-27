'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  AppState,
  UserRole,
  PageConfig,
  SiteSettings,
  User,
  BuilderBlock,
  BuilderPage,
  PageBuilderActions,
  PageBuilderState,
} from '@/types';
import { db } from '@/services/db';
import { createEmptyPage } from '@/constants';
import { cloneBlock } from '@/lib/builder/factory';
import { createInitialBuilderState } from '@/lib/builder/state';
import { createClient } from '@/lib/supabase/client';
import { loadCmsState, saveSettings, savePages, savePage, deletePage } from '@/lib/supabase/cms';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  logout: () => void;
  updatePage: (updatedPage: PageConfig) => void;
  addPage: (title: string, slug: string, addToNav?: boolean) => PageConfig;
  removePage: (pageId: string) => void;
  /** Persist current state to storage. Call explicitly after Save/Apply—no auto-save. */
  persist: () => void;
  /** Revert a page to a previous version (e.g. discard unsaved edits). */
  revertPage: (pageId: string, savedPage: PageConfig) => void;
  isAdminMode: boolean;
  setIsAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  adminTab: string;
  setAdminTab: React.Dispatch<React.SetStateAction<string>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pageBuilder: PageBuilderState;
  pageBuilderActions: PageBuilderActions;
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
  const [state, setState] = useState<AppState>(() => {
    const base = db.load();
    return {
      ...base,
      pageBuilder: createInitialBuilderState(base.pages),
      // When Supabase is enabled, currentUser must come from auth only—never stale localStorage
      currentUser: SUPABASE_ENABLED ? null : base.currentUser,
    };
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback(() => {
    const s = stateRef.current;
    if (!SUPABASE_ENABLED) {
      db.save(s);
    } else {
      saveSettings(s.settings);
      savePages(s.pages);
    }
  }, []);

  const revertPage = useCallback((pageId: string, savedPage: PageConfig) => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => (p.id === pageId ? savedPage : p)),
      pageBuilder: {
        ...prev.pageBuilder,
        pages: {
          ...prev.pageBuilder.pages,
          [pageId]: {
            id: savedPage.id,
            slug: savedPage.slug,
            title: savedPage.title,
            blocks: savedPage.blocks ?? [],
          },
        },
      },
    }));
  }, []);

  // Initial load: Supabase first, then fallback to localStorage
  useEffect(() => {
    setMounted(true);
    if (SUPABASE_ENABLED) {
      loadCmsState().then((loaded) => {
        if (loaded) {
          setState(prev => {
            const nextPages = loaded.pages ?? prev.pages;
            return {
              ...prev,
              settings: loaded.settings ?? prev.settings,
              pages: nextPages,
              users: loaded.users ?? prev.users,
              pageBuilder: createInitialBuilderState(nextPages),
            };
          });
        } else {
          const base = db.load();
          setState(prev => ({
            ...base,
            pageBuilder: createInitialBuilderState(base.pages),
            currentUser: prev.currentUser, // Preserve auth result; do not overwrite with stale base
          }));
        }
      });
    } else {
      const base = db.load();
      setState({
        ...base,
        pageBuilder: createInitialBuilderState(base.pages),
      });
    }
  }, []);

  // No auto-save: persistence happens only when user explicitly Saves or Applies.

  // Supabase auth: sync session and profile to state.currentUser.
  // The profile (and its role) is always the single source of truth.
  useEffect(() => {
    if (!mounted || !SUPABASE_ENABLED) return;
    const supabase = createClient();

    const loadProfile = async (sessionUser: { id: string; email?: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role, email')
        .eq('id', sessionUser.id)
        .single();

      if (error) {
        // If there's no profile or RLS blocks access, treat as unauthenticated for now.
        console.error('Error loading profile for user', sessionUser.id, error);
        setState(prev => ({ ...prev, currentUser: null }));
        return;
      }

      if (data) {
        setState(prev => ({ ...prev, currentUser: profileToUser(data) }));
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
    };

    const clearUser = () => setState(prev => ({ ...prev, currentUser: null }));

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user);
      else clearUser();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user);
      else clearUser();
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
    setState(prev => {
      const existing = prev.pages.find(p => p.id === updatedPage.id);
      const merged: PageConfig = existing
        ? { ...updatedPage, blocks: updatedPage.blocks ?? existing.blocks }
        : updatedPage;
      return {
        ...prev,
        pages: prev.pages.map(p => (p.id === merged.id ? merged : p)),
      };
    });
    setTimeout(persist, 0);
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
      const pages = [...prev.pages, newPage];
      return {
        ...prev,
        pages,
        pageBuilder: createInitialBuilderState(pages),
      };
    });
    setTimeout(persist, 0);
    return newPage;
  };

  const removePage = (pageId: string) => {
    const page = state.pages.find(p => p.id === pageId);
    if (!page || state.pages.length <= 1 || page.slug === '/') return;
    setState(prev => {
      const pages = prev.pages.filter(p => p.id !== pageId);
      return {
        ...prev,
        pages,
        pageBuilder: createInitialBuilderState(pages),
      };
    });
    if (SUPABASE_ENABLED) deletePage(pageId);
    setTimeout(persist, 0);
  };

  const pageBuilder: PageBuilderState = state.pageBuilder;

  const pageBuilderActions: PageBuilderActions = {
    selectPage: (pageId) => {
      setState(prev => ({
        ...prev,
        pageBuilder: {
          ...prev.pageBuilder,
          currentPageId: pageId,
        },
      }));
    },
    setBlocks: (pageId, blocks) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const fallbackPage = prev.pages.find(p => p.id === pageId);
        const existing = builder.pages[pageId] ?? {
          id: pageId,
          slug: fallbackPage?.slug ?? '',
          title: fallbackPage?.title ?? '',
          blocks: [],
        };
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: {
                ...existing,
                blocks,
              },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
          },
        };
      });
    },
    addBlock: (pageId, block, index) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const fallbackPage = prev.pages.find(p => p.id === pageId);
        const page = builder.pages[pageId] ?? {
          id: pageId,
          slug: fallbackPage?.slug ?? '',
          title: fallbackPage?.title ?? '',
          blocks: [],
        };
        const blocks = [...page.blocks];
        if (index === undefined || index < 0 || index > blocks.length) {
          blocks.push(block);
        } else {
          blocks.splice(index, 0, block);
        }
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...page, blocks },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
          },
        };
      });
    },
    updateBlock: (pageId, blockId, updater) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const page = builder.pages[pageId];
        if (!page) return prev;
        const blocks = page.blocks.map(b => (b.id === blockId ? updater(b) : b));
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...page, blocks },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
          },
        };
      });
    },
    removeBlock: (pageId, blockId) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const page = builder.pages[pageId];
        if (!page) return prev;
        const blocks = page.blocks.filter(b => b.id !== blockId);
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...page, blocks },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
          },
        };
      });
    },
    moveBlock: (pageId, blockId, toIndex) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const page = builder.pages[pageId];
        if (!page) return prev;
        const currentIndex = page.blocks.findIndex(b => b.id === blockId);
        if (currentIndex === -1 || toIndex < 0 || toIndex >= page.blocks.length) {
          return prev;
        }
        const blocks = [...page.blocks];
        const [item] = blocks.splice(currentIndex, 1);
        blocks.splice(toIndex, 0, item);
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...page, blocks },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
          },
        };
      });
    },
    duplicateBlock: (pageId, blockId) => {
      setState(prev => {
        const builder = prev.pageBuilder;
        const page = builder.pages[pageId];
        if (!page) return prev;
        const idx = page.blocks.findIndex(b => b.id === blockId);
        if (idx === -1) return prev;
        const original = page.blocks[idx];
        const cloned = cloneBlock(original);
        const blocks = [...page.blocks];
        blocks.splice(idx + 1, 0, cloned);
        const pages = prev.pages.map(p =>
          p.id === pageId ? { ...p, blocks } : p,
        );
        return {
          ...prev,
          pages,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...page, blocks },
            },
            isDirtyByPageId: { ...builder.isDirtyByPageId, [pageId]: true },
            selectedBlockIdByPageId: {
              ...builder.selectedBlockIdByPageId,
              [pageId]: cloned.id,
            },
          },
        };
      });
    },
    selectBlock: (pageId, blockId) => {
      setState(prev => ({
        ...prev,
        pageBuilder: {
          ...prev.pageBuilder,
          selectedBlockIdByPageId: {
            ...prev.pageBuilder.selectedBlockIdByPageId,
            [pageId]: blockId,
          },
        },
      }));
    },
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
      setIsLoginModalOpen,
      pageBuilder,
      pageBuilderActions,
      persist,
      revertPage,
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
