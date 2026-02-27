import type { BuilderPage, PageBuilderState, PageConfig } from '@/types';
import { deserializePageConfigToBuilderPage } from './deserialization';

export function createInitialBuilderState(pages: PageConfig[]): PageBuilderState {
  const builderPages: Record<string, BuilderPage> = {};
  const isDirtyByPageId: Record<string, boolean> = {};
  const selectedBlockIdByPageId: Record<string, string | null> = {};

  for (const page of pages) {
    const builderPage = deserializePageConfigToBuilderPage(page);
    builderPages[page.id] = builderPage;
    isDirtyByPageId[page.id] = false;
    selectedBlockIdByPageId[page.id] = null;
  }

  return {
    currentPageId: pages[0]?.id ?? null,
    pages: builderPages,
    isDirtyByPageId,
    selectedBlockIdByPageId,
  };
}
