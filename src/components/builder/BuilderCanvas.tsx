'use client';

import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuilderBlock, BuilderBlockType } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { BlockPalette } from '@/components/builder/BlockPalette';
import { BlockInspector } from '@/components/builder/BlockInspector';
import { createBlockOfType } from '@/lib/builder/factory';
import { ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';

interface BuilderCanvasProps {
  pageId: string;
}

interface SortableBlockProps {
  block: BuilderBlock;
  pageId: string;
  index: number;
  totalBlocks: number;
}

function blockSummary(block: BuilderBlock): string {
  switch (block.type) {
    case 'richText':
      return (block.content || '').slice(0, 80) || 'Empty text block';
    case 'image':
      return block.alt || block.src || 'Image block';
    case 'separator':
      return 'Separator';
    case 'spacer':
      return `Spacer (${block.height}px)`;
    case 'button':
      return block.label || 'Button';
    default:
      return 'Block';
  }
}

function SortableBlock({ block, pageId, index, totalBlocks }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: {
      from: 'canvas',
      blockId: block.id,
    },
  });
  const { pageBuilderActions, pageBuilder } = useAppContext();
  const isSelected = pageBuilder.selectedBlockIdByPageId[pageId] === block.id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleSelect = () => {
    pageBuilderActions.selectBlock(pageId, block.id);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    pageBuilderActions.removeBlock(pageId, block.id);
    pageBuilderActions.selectBlock(pageId, null);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    pageBuilderActions.duplicateBlock(pageId, block.id);
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

  const btnClass =
    'shrink-0 p-1.5 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 rounded-lg border bg-white px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-grab focus-within:ring-2 focus-within:ring-red-500 ${
        isSelected ? 'border-red-500 shadow-sm' : 'border-slate-200 hover:border-red-300'
      }`}
      role="listitem"
      aria-label={blockSummary(block)}
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-slate-700">
          {block.type === 'richText' && 'Rich text'}
          {block.type === 'image' && 'Image'}
          {block.type === 'separator' && 'Separator'}
          {block.type === 'spacer' && 'Spacer'}
          {block.type === 'button' && 'Button'}
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          {blockSummary(block)}
        </div>
      </div>
      <div
        className="flex items-center gap-0.5 shrink-0"
        role="toolbar"
        aria-label="Block actions"
      >
        <button
          type="button"
          className={btnClass}
          onClick={handleMoveUp}
          disabled={index <= 0}
          aria-label="Move block up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className={btnClass}
          onClick={handleMoveDown}
          disabled={index >= totalBlocks - 1}
          aria-label="Move block down"
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
          className={`${btnClass} hover:bg-red-50 hover:text-red-700`}
          onClick={handleDelete}
          aria-label="Delete block"
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          className="shrink-0 px-2 py-1 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
        >
          Drag
        </button>
      </div>
    </div>
  );
}

export function BuilderCanvas({ pageId }: BuilderCanvasProps) {
  const { state, pageBuilderActions } = useAppContext();
  const builder = state.pageBuilder;
  const page = builder.pages[pageId];

  const canvasId = `canvas-${pageId}`;
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
    id: canvasId,
    data: { dropZone: 'canvas' },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!page) {
    return (
      <div className="text-xs text-slate-500">
        No page selected for the visual builder.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { from?: string; blockType?: BuilderBlockType; blockId?: string } | null;
    if (!activeData) return;

    // Reordering within the canvas
    if (activeData.from === 'canvas') {
      if (active.id === over.id) return;
      const blocks = page.blocks;
      const oldIndex = blocks.findIndex((b) => b.id === String(active.id));
      const newIndex = blocks.findIndex((b) => b.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...blocks];
      const [item] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, item);
      pageBuilderActions.setBlocks(pageId, reordered);
      return;
    }

    // Creating a new block from the palette
    if (activeData.from === 'palette' && activeData.blockType) {
      const blocks = page.blocks;
      const newBlock = createBlockOfType(activeData.blockType);
      const overId = String(over.id);

      if (overId === canvasId || blocks.length === 0) {
        const appended = [...blocks, newBlock];
        pageBuilderActions.setBlocks(pageId, appended);
        pageBuilderActions.selectBlock(pageId, newBlock.id);
        return;
      }

      const overIndex = blocks.findIndex((b) => b.id === overId);
      const insertIndex = overIndex === -1 ? blocks.length : overIndex;
      const next = [...blocks];
      next.splice(insertIndex, 0, newBlock);
      pageBuilderActions.setBlocks(pageId, next);
      pageBuilderActions.selectBlock(pageId, newBlock.id);
    }
  };

  return (
    <section
      aria-label="Visual page builder"
      className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-4 space-y-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Visual page builder
          </h2>
          <p className="text-[11px] text-slate-500">
            Drag blocks to reorder, or drag new ones from the library. Use Tab and arrow keys for keyboard control.
          </p>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart({ active }: { active: { id: unknown } }) {
              const id = String(active.id);
              return id.startsWith('palette-')
                ? `Picked up block type ${id.replace('palette-', '')}. Drag to the canvas to add it.`
                : `Picked up block. Use arrow keys to reorder, or release to drop.`;
            },
            onDragOver({ active, over }: { active: { id: unknown }; over: { id: unknown } | null }) {
              if (over) return `Block moved over drop target. Release to place.`;
              return `Block is no longer over a valid drop area.`;
            },
            onDragEnd({ active, over }: { active: { id: unknown; data: { current?: { from?: string } } }; over: { id: unknown } | null }) {
              if (!over) return `Block was dropped but no position was found.`;
              if (active.id === over.id) return `Block position unchanged.`;
              const fromPalette = active.data?.current?.from === 'palette';
              return fromPalette
                ? `New block added to page.`
                : `Block moved to new position.`;
            },
            onDragCancel({ active }: { active: { id: unknown } }) {
              return `Drag cancelled. Block returned to original position.`;
            },
          },
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <BlockPalette pageId={pageId} />

          <div
            ref={setCanvasRef}
            id={canvasId}
            className={`flex-1 min-h-[120px] bg-slate-50 border-2 border-dashed rounded-xl p-3 transition-colors ${
              isCanvasOver ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
            }`}
            aria-label="Page canvas - drop blocks here"
            role="list"
          >
            {page.blocks.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No blocks yet. Drag a block from the library or use the buttons to add one.
              </p>
            )}
            <SortableContext
              items={page.blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {page.blocks.map((block, index) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  pageId={pageId}
                  index={index}
                  totalBlocks={page.blocks.length}
                />
              ))}
            </SortableContext>
          </div>

          <BlockInspector pageId={pageId} />
        </div>
      </DndContext>
    </section>
  );
}

