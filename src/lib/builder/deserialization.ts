import type { BuilderBlock, BuilderBlockType, BuilderPage, PageConfig } from '@/types';

const BUILDER_BLOCK_TYPES: BuilderBlockType[] = ['richText', 'image', 'separator', 'spacer', 'button'];

function isBuilderBlockArray(sections: unknown[]): sections is BuilderBlock[] {
  return sections.every(
    (s) =>
      !!s &&
      typeof s === 'object' &&
      'id' in s &&
      'type' in s &&
      typeof (s as { id: unknown; type: unknown }).id === 'string' &&
      BUILDER_BLOCK_TYPES.includes((s as { type: unknown }).type as BuilderBlockType),
  );
}

export function deserializePageConfigToBuilderPage(pageConfig: PageConfig): BuilderPage {
  if (pageConfig.blocks && pageConfig.blocks.length > 0) {
    return {
      id: pageConfig.id,
      slug: pageConfig.slug,
      title: pageConfig.title,
      blocks: pageConfig.blocks,
    };
  }

  const sections = Array.isArray(pageConfig.sections) ? (pageConfig.sections as unknown[]) : [];

  if (sections.length > 0 && isBuilderBlockArray(sections)) {
    return {
      id: pageConfig.id,
      slug: pageConfig.slug,
      title: pageConfig.title,
      blocks: sections as BuilderBlock[],
    };
  }

  const derivedBlocks: BuilderBlock[] = sections.map((section: any) => {
    const id = typeof section.id === 'string' ? section.id : `${pageConfig.id}-${Math.random().toString(36).slice(2)}`;
    const title = typeof section.title === 'string' ? section.title : '';
    const content = typeof section.content === 'string' ? section.content : '';
    if (section.type === 'separator') {
      return {
        id,
        type: 'separator',
        thickness: 1,
        style: section.separatorStyle === 'dotted' ? 'dotted' : 'solid',
      };
    }
    return {
      id,
      type: 'richText',
      content: title ? `${title}\n\n${content}`.trim() : content,
    };
  });

  return {
    id: pageConfig.id,
    slug: pageConfig.slug,
    title: pageConfig.title,
    blocks: derivedBlocks,
  };
}

