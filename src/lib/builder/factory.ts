import type { BuilderBlock, BuilderBlockType } from '@/types';

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID() as string;
  }
  return Math.random().toString(36).slice(2, 11);
}

export function createBlockOfType(type: BuilderBlockType): BuilderBlock {
  const id = createId();
  switch (type) {
    case 'richText':
      return {
        id,
        type: 'richText',
        content: 'Click to edit text…',
      };
    case 'image':
      return {
        id,
        type: 'image',
        src: '',
        alt: '',
        caption: '',
        borderRadius: 8,
        padding: 8,
      };
    case 'separator':
      return {
        id,
        type: 'separator',
        thickness: 1,
        style: 'solid',
        color: '#CBD5E1',
        width: 'content',
      };
    case 'spacer':
      return {
        id,
        type: 'spacer',
        height: 32,
      };
    case 'button':
      return {
        id,
        type: 'button',
        label: 'Click me',
        href: '#',
        variant: 'primary',
        borderRadius: 999,
        paddingX: 16,
        paddingY: 10,
      };
    default:
      // Fallback to rich text to remain robust as types evolve.
      return {
        id,
        type: 'richText',
        content: 'New block',
      };
  }
}

export function cloneBlock(block: BuilderBlock): BuilderBlock {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as Crypto & { randomUUID(): string }).randomUUID()
      : Math.random().toString(36).slice(2, 11);
  return { ...JSON.parse(JSON.stringify(block)), id } as BuilderBlock;
}

