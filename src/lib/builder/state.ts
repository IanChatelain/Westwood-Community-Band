import type { PageBuilderState, PageConfig } from '@/types';

export function createInitialBuilderState(pages: PageConfig[]): PageBuilderState {
  const selectedBlockIdByPageId: Record<string, string | null> = {};

  for (const page of pages) {
    selectedBlockIdByPageId[page.id] = null;
  }

  return {
    currentPageId: pages[0]?.id ?? null,
    pages: {},
    isDirtyByPageId: {},
    selectedBlockIdByPageId,
  };
}
