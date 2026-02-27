'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BuilderBlockType } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { createBlockOfType } from '@/lib/builder/factory';
import { Type, Image, Minus, Space, MousePointer } from 'lucide-react';

const BLOCK_ICONS: Record<BuilderBlockType, React.ReactNode> = {
  richText: <Type size={14} />,
  image: <Image size={14} />,
  separator: <Minus size={14} />,
  spacer: <Space size={14} />,
  button: <MousePointer size={14} />,
};

const BLOCK_LABELS: Record<BuilderBlockType, string> = {
  richText: 'Text',
  image: 'Image',
  separator: 'Line',
  spacer: 'Spacer',
  button: 'Button',
};

interface CompactBlockPaletteProps {
  pageId: string;
}

function PaletteChip({ pageId, type }: { pageId: string; type: BuilderBlockType }) {
  const { pageBuilderActions } = useAppContext();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { from: 'palette', blockType: type },
  });

  const handleClick = () => {
    const block = createBlockOfType(type);
    pageBuilderActions.addBlock(pageId, block);
    pageBuilderActions.selectBlock(pageId, block.id);
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={handleClick}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        isDragging
          ? 'opacity-50 border-red-400 bg-red-50'
          : 'border-slate-300 bg-white hover:border-red-400 hover:bg-red-50/60 text-slate-700'
      }`}
      aria-label={`Add ${BLOCK_LABELS[type]} block`}
    >
      {BLOCK_ICONS[type]}
      {BLOCK_LABELS[type]}
    </button>
  );
}

export function CompactBlockPalette({ pageId }: CompactBlockPaletteProps) {
  const types: BuilderBlockType[] = ['richText', 'image', 'separator', 'spacer', 'button'];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Add:</span>
      {types.map((type) => (
        <PaletteChip key={type} pageId={pageId} type={type} />
      ))}
    </div>
  );
}
