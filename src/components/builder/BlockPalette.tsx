'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { BuilderBlockType } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { createBlockOfType } from '@/lib/builder/factory';

const BLOCK_DEFINITIONS: { type: BuilderBlockType; label: string; description: string }[] = [
  { type: 'richText', label: 'Rich text', description: 'Headings and paragraphs.' },
  { type: 'image', label: 'Image', description: 'Standalone image with caption.' },
  { type: 'separator', label: 'Separator', description: 'Visual divider between sections.' },
  { type: 'spacer', label: 'Spacer', description: 'Empty vertical space.' },
  { type: 'button', label: 'Button', description: 'Call-to-action button.' },
];

interface BlockPaletteProps {
  pageId: string;
}

function PaletteItem({ pageId, type, label, description }: BlockPaletteProps & { type: BuilderBlockType; label: string; description: string }) {
  const { pageBuilderActions } = useAppContext();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      from: 'palette',
      blockType: type,
    },
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
      className={`w-full text-left px-3 py-2 rounded-lg border text-xs mb-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${
        isDragging
          ? 'opacity-50 border-red-400 bg-red-50'
          : 'border-slate-200 bg-white hover:border-red-400 hover:bg-red-50/60'
      }`}
      aria-label={`Add ${label} block`}
    >
      <div className="font-semibold text-slate-800 text-[11px]">{label}</div>
      <div className="text-[10px] text-slate-500">{description}</div>
      <div className="mt-1 text-[10px] text-slate-400">
        Drag into the canvas or press Enter to add.
      </div>
    </button>
  );
}

export function BlockPalette({ pageId }: BlockPaletteProps) {
  return (
    <section
      aria-label="Block library"
      className="w-full sm:w-56 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
    >
      <header className="space-y-0.5">
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
          Blocks
        </h3>
        <p className="text-[10px] text-slate-500">
          Drag blocks into the page or activate with keyboard.
        </p>
      </header>
      <div className="mt-2 space-y-1" role="toolbar" aria-label="Add blocks">
        {BLOCK_DEFINITIONS.map((b) => (
          <PaletteItem
            key={b.type}
            pageId={pageId}
            type={b.type}
            label={b.label}
            description={b.description}
          />
        ))}
      </div>
    </section>
  );
}

