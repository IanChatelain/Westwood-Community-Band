'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuilderBlock, PageConfig } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { BuilderBlockView, blockWrapperClassesAndStyle } from '@/components/ui/PageContent';
import { GripVertical, Trash2, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import { SidebarBlockContent } from '@/components/ui/PageContent';

interface LivePreviewEditorProps {
  page: PageConfig;
  pageId: string;
}

function SortablePreviewBlock({ block, pageId, index, totalBlocks }: {
  block: BuilderBlock;
  pageId: string;
  index: number;
  totalBlocks: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { from: 'canvas', blockId: block.id },
  });
  const { pageBuilderActions, pageBuilder } = useAppContext();
  const isSelected = pageBuilder.selectedBlockIdByPageId[pageId] === block.id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    pageBuilderActions.selectBlock(pageId, block.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    pageBuilderActions.removeBlock(pageId, block.id);
    pageBuilderActions.selectBlock(pageId, null);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= 0) return;
    pageBuilderActions.moveBlock(pageId, block.id, index - 1);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= totalBlocks - 1) return;
    pageBuilderActions.moveBlock(pageId, block.id, index + 1);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    pageBuilderActions.duplicateBlock(pageId, block.id);
  };

  const btnClass = 'p-1.5 rounded bg-white shadow border border-slate-200 text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      className={`group relative rounded-lg transition-all ${
        isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-50' : 'hover:ring-2 hover:ring-red-300 hover:ring-offset-2 hover:ring-offset-slate-50'
      }`}
    >
      <div className="absolute right-2 top-2 z-10 flex flex-wrap items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          className={btnClass}
          onClick={handleMoveUp}
          disabled={index <= 0}
          aria-label="Move up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={handleMoveDown}
          disabled={index >= totalBlocks - 1}
          aria-label="Move down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={handleDuplicate}
          aria-label="Duplicate block"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          className="p-1.5 rounded bg-white shadow border border-slate-200 text-slate-500 hover:text-slate-700 cursor-grab active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 rounded bg-white shadow border border-slate-200 text-slate-500 hover:text-red-600"
          aria-label="Delete block"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {(() => {
        const { className, style } = blockWrapperClassesAndStyle(block.wrapperStyle);
        return (
          <div className={className || undefined} style={Object.keys(style).length ? style : undefined}>
            <BuilderBlockView block={block} />
          </div>
        );
      })()}
    </div>
  );
}

export function LivePreviewEditor({ page, pageId }: LivePreviewEditorProps) {
  const { state } = useAppContext();
  const builder = state.pageBuilder;
  const builderPage = builder.pages[pageId];
  const blocks = builderPage?.blocks ?? page.blocks ?? [];

  const canvasId = `live-canvas-${pageId}`;
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: canvasId,
    data: { dropZone: 'canvas' },
  });

  const hasBlocks = blocks.length > 0;
  const sidebarBlocks = (page.sidebarBlocks && page.sidebarBlocks.length > 0)
    ? [...page.sidebarBlocks].sort((a, b) => a.order - b.order)
    : DEFAULT_SIDEBAR_BLOCKS;

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 min-h-0">
        <div
          ref={setCanvasRef}
          className={`flex-grow space-y-16 min-w-0 ${
            isCanvasOver ? 'bg-red-50/30 rounded-xl' : ''
          }`}
          style={{ width: page.layout === 'full' ? '100%' : `${100 - page.sidebarWidth}%` }}
        >
          {hasBlocks ? (
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, index) => (
                <SortablePreviewBlock
                  key={block.id}
                  block={block}
                  pageId={pageId}
                  index={index}
                  totalBlocks={blocks.length}
                />
              ))}
            </SortableContext>
          ) : (
            <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-300 rounded-xl">
              Drop blocks here or add from the toolbar above.
            </div>
          )}
        </div>

        {page.layout !== 'full' && (
          <aside
            className={`space-y-6 ${page.layout === 'sidebar-left' ? 'md:order-first' : ''}`}
            style={{ width: `${page.sidebarWidth}%`, minWidth: '200px' }}
          >
            {sidebarBlocks.map((block) => (
              <SidebarBlockContent key={block.id} block={block} />
            ))}
          </aside>
        )}
      </div>
  );
}
