'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  AppState,
  UserRole,
  PageConfig,
  PageSection,
  SiteSettings,
  User,
  BuilderBlock,
  BuilderPage,
  PageBuilderActions,
  PageBuilderState,
} from '@/types';
import { createEmptyPage, DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_USERS } from '@/constants';
import { cloneBlock } from '@/lib/builder/factory';
import { createInitialBuilderState } from '@/lib/builder/state';
import { loadCmsState, saveSettings, savePages, savePage, deletePage, restorePageRevision as restoreRevisionAction } from '@/lib/cms';
import { getCurrentUser, logout as logoutAction } from '@/app/actions/auth';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  logout: () => void;
  updatePage: (updatedPage: PageConfig) => Promise<boolean>;
  addPage: (title: string, slug: string, addToNav?: boolean) => PageConfig;
  removePage: (pageId: string) => void;
  persist: () => Promise<boolean>;
  /** Refetch CMS data from the database so the public site shows latest content. */
  refreshCmsState: () => Promise<void>;
  revertPage: (pageId: string, savedPage: PageConfig) => void;
  moveSectionToPage: (sectionId: string, fromPageId: string, toPageId: string) => Promise<boolean>;
  restorePageRevision: (revisionId: string) => Promise<PageConfig | null>;
  isAdminMode: boolean;
  setIsAdminMode: React.Dispatch<React.SetStateAction<boolean>>;
  adminTab: string;
  setAdminTab: React.Dispatch<React.SetStateAction<string>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pageBuilder: PageBuilderState;
  pageBuilderActions: PageBuilderActions;
  loading: boolean;
  /** When true (admin only), CMS load failed and we show a friendly error instead of fallback content. */
  cmsLoadError: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function profileToUser(profile: { id: string; username: string; role: string; email: string }): User {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role as UserRole,
    email: profile.email,
  };
}

function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-8 bg-[#991b1b]" />
      <div className="h-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-full gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-40 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-24 h-2 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="h-[260px] bg-slate-200 rounded-2xl animate-pulse" />
        <div className="space-y-4 max-w-3xl">
          <div className="h-7 bg-slate-200 rounded w-56 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-4/6 animate-pulse" />
        </div>
        <div className="space-y-4 max-w-3xl">
          <div className="h-7 bg-slate-200 rounded w-44 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export interface AppProviderProps {
  children: ReactNode;
  /** When provided (e.g. from public layout cached read), used for first paint so client does not call loadCmsState on mount. */
  initialCmsState?: Partial<AppState> | null;
}

export function AppProvider({ children, initialCmsState }: AppProviderProps) {
  const hasInitialState = initialCmsState && (initialCmsState.settings != null || (initialCmsState.pages != null && initialCmsState.pages.length > 0));
  const [state, setState] = useState<AppState>(() => {
    if (hasInitialState && initialCmsState) {
      const pages = initialCmsState.pages ?? [];
      return {
        settings: initialCmsState.settings ?? DEFAULT_SETTINGS,
        pages,
        users: initialCmsState.users ?? INITIAL_USERS,
        currentUser: initialCmsState.currentUser ?? null,
        pageBuilder: createInitialBuilderState(pages),
      };
    }
    return {
      settings: DEFAULT_SETTINGS,
      pages: [],
      users: INITIAL_USERS,
      currentUser: null,
      pageBuilder: createInitialBuilderState([]),
    };
  });
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [cmsLoadError, setCmsLoadError] = useState(false);
  const [loading, setLoading] = useState(!hasInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback(async (): Promise<boolean> => {
    const s = stateRef.current;
    const [settingsOk, pagesOk] = await Promise.all([
      saveSettings(s.settings),
      savePages(s.pages),
    ]);
    return settingsOk && pagesOk;
  }, []);

  const refreshCmsState = useCallback(async (): Promise<void> => {
    const loaded = await loadCmsState();
    if (loaded) {
      setCmsLoadError(false);
      setState((prev) => ({
        ...prev,
        settings: loaded.settings ?? prev.settings,
        pages: loaded.pages ?? prev.pages,
        pageBuilder: createInitialBuilderState(loaded.pages ?? prev.pages),
      }));
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

  useEffect(() => {
    setMounted(true);

    // When initialCmsState was provided (public route), skip the initial DB call for first paint
    if (hasInitialState) {
      setLoading(false);
      return;
    }

    loadCmsState().then((loaded) => {
      if (loaded) {
        setCmsLoadError(false);
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
        // Admin: show error state so UI can show "database unavailable". Public: fallback to default content.
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          setCmsLoadError(true);
        } else {
          setState(prev => ({
            ...prev,
            settings: DEFAULT_SETTINGS,
            pages: INITIAL_PAGES,
            pageBuilder: createInitialBuilderState(INITIAL_PAGES),
          }));
        }
      }
      setLoading(false);
    });
  }, [hasInitialState]);

  // Auth: check for existing session on mount and after login/logout
  useEffect(() => {
    if (!mounted) return;

    getCurrentUser().then((user) => {
      if (user) {
        setState(prev => ({ ...prev, currentUser: profileToUser(user) }));
        if (user.role === 'ADMIN' || user.role === 'EDITOR') {
          loadCmsState().then((loaded) => {
            if (loaded?.pages) {
              setState(prev => ({
                ...prev,
                pages: loaded.pages!,
                pageBuilder: createInitialBuilderState(loaded.pages!),
              }));
            }
          });
        }
      } else {
        setState(prev => ({ ...prev, currentUser: null }));
      }
    });
  }, [mounted]);

  const logout = useCallback(async () => {
    await logoutAction();
    setState(prev => ({ ...prev, currentUser: null }));
    setIsAdminMode(false);
    loadCmsState().then((loaded) => {
      if (loaded?.pages) {
        setState(prev => ({
          ...prev,
          pages: loaded.pages!,
          pageBuilder: createInitialBuilderState(loaded.pages!),
        }));
      }
    });
  }, []);

  const updatePage = useCallback(async (updatedPage: PageConfig): Promise<boolean> => {
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
    return new Promise<boolean>((resolve) => {
      setTimeout(async () => {
        const ok = await persist();
        resolve(ok);
      }, 0);
    });
  }, [persist]);

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
    deletePage(pageId);
    setTimeout(persist, 0);
  };

  const moveSectionToPage = useCallback(async (sectionId: string, fromPageId: string, toPageId: string): Promise<boolean> => {
    if (fromPageId === toPageId) return true;

    setState(prev => {
      const fromPage = prev.pages.find(p => p.id === fromPageId);
      const toPage = prev.pages.find(p => p.id === toPageId);
      if (!fromPage || !toPage) return prev;

      const section = fromPage.sections.find(s => s.id === sectionId);
      if (!section) return prev;

      const movedSection: PageSection = {
        ...section,
        id: toPage.sections.some(s => s.id === section.id)
          ? Math.random().toString(36).substring(2, 11)
          : section.id,
      };

      return {
        ...prev,
        pages: prev.pages.map(p => {
          if (p.id === fromPageId) {
            return { ...p, sections: p.sections.filter(s => s.id !== sectionId) };
          }
          if (p.id === toPageId) {
            return { ...p, sections: [...p.sections, movedSection] };
          }
          return p;
        }),
      };
    });

    return new Promise<boolean>((resolve) => {
      setTimeout(async () => {
        const ok = await persist();
        resolve(ok);
      }, 0);
    });
  }, [persist]);

  const restorePageRevision = useCallback(async (revisionId: string): Promise<PageConfig | null> => {
    const restored = await restoreRevisionAction(revisionId);
    if (!restored) return null;
    setState(prev => ({
      ...prev,
      pages: prev.pages.map(p => (p.id === restored.id ? restored : p)),
      pageBuilder: createInitialBuilderState(
        prev.pages.map(p => (p.id === restored.id ? restored : p)),
      ),
    }));
    return restored;
  }, []);

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
        return {
          ...prev,
          pageBuilder: {
            ...builder,
            pages: {
              ...builder.pages,
              [pageId]: { ...existing, blocks },
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
        return {
          ...prev,
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
        return {
          ...prev,
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
        return {
          ...prev,
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
        return {
          ...prev,
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
        return {
          ...prev,
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
    return <PageLoadingSkeleton />;
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
      refreshCmsState,
      revertPage,
      moveSectionToPage,
      restorePageRevision,
      loading,
      cmsLoadError,
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
