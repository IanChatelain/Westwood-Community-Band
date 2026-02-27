import type { BuilderBlock, BuilderPage, PageConfig } from '@/types';

export function serializeBlocksToPageConfig(
  pageConfig: PageConfig,
  blocks: BuilderBlock[],
): PageConfig {
  return {
    ...pageConfig,
    blocks,
  };
}

export function serializeBuilderPageToDbPayload(page: BuilderPage) {
  return {
    title: page.title,
    slug: page.slug,
    sections: page.blocks,
  };
}

