import type { BuilderBlock, BuilderPage, PageBuilderState, PageConfig } from '@/types';

export function createInitialBuilderState(pages: PageConfig[]): PageBuilderState {
  const builderPages: Record<string, BuilderPage> = {};
  const isDirtyByPageId: Record<string, boolean> = {};
  const selectedBlockIdByPageId: Record<string, string | null> = {};

  for (const page of pages) {
    const blocks: BuilderBlock[] = page.blocks ?? [];
    builderPages[page.id] = {
      id: page.id,
      slug: page.slug,
      title: page.title,
      blocks,
    };
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
