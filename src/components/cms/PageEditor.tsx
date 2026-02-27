'use client';

import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { BuilderBlockType } from '@/types';
import { PageConfig, SidebarBlock, SidebarBlockType } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import { createBlockOfType } from '@/lib/builder/factory';
import { useAppContext } from '@/context/AppContext';
import { Save, Layout as LayoutIcon, ChevronDown, Undo2 } from 'lucide-react';
import { LivePreviewEditor } from '@/components/builder/LivePreviewEditor';
import { CompactBlockPalette } from '@/components/builder/CompactBlockPalette';
import { BlockInspector } from '@/components/builder/BlockInspector';
import { SectionEditor } from '@/components/cms/SectionEditor';
import PageContent from '@/components/ui/PageContent';

interface PageEditorProps {
  page: PageConfig;
  onSave: (updatedPage: PageConfig) => void;
}

const SIDEBAR_BLOCK_TYPES: { value: SidebarBlockType; label: string }[] = [
  { value: 'rehearsals', label: 'Rehearsals' },
  { value: 'fees', label: 'Fees' },
  { value: 'contact', label: 'Contact' },
  { value: 'custom', label: 'Custom' },
];

function pageConfigEqual(a: PageConfig, b: PageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave }) => {
  const { state, pageBuilderActions, revertPage } = useAppContext();
  const lastSavedRef = React.useRef<PageConfig>(page);
  const [editedPage, setEditedPage] = React.useState<PageConfig>(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    return p;
  });
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);
  const [sidebarEditorOpen, setSidebarEditorOpen] = React.useState(false);

  React.useEffect(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    setEditedPage(p);
    lastSavedRef.current = p;
  }, [page.id]);

  const handleRevert = () => {
    const saved = lastSavedRef.current;
    setEditedPage(saved);
    revertPage(page.id, saved);
  };

  const isSectionBased = (editedPage.sections?.length ?? 0) > 0 && (!editedPage.blocks || editedPage.blocks.length === 0);
  const effectivePage: PageConfig = isSectionBased
    ? { ...editedPage, blocks: undefined }
    : { ...editedPage, blocks: page.blocks ?? editedPage.blocks };
  const hasUnsavedChanges = !pageConfigEqual(editedPage, page);

  const builderPage = state.pageBuilder.pages[page.id];
  const blocks = builderPage?.blocks ?? page.blocks ?? [];

  const handleSave = () => {
    onSave(editedPage);
    lastSavedRef.current = editedPage;
    setShowSavedFeedback(true);
    window.setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const sidebarBlocks = editedPage.sidebarBlocks ?? [];
  const setSidebarBlocks = (blocks: SidebarBlock[]) => {
    setEditedPage((prev) => ({ ...prev, sidebarBlocks: blocks }));
  };
  const addSidebarBlock = (type: SidebarBlockType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newBlock: SidebarBlock = {
      id,
      type,
      order: sidebarBlocks.length,
      title: type === 'custom' ? 'Custom' : undefined,
      content: '',
    };
    setSidebarBlocks([...sidebarBlocks, newBlock]);
  };
  const removeSidebarBlock = (id: string) => {
    setSidebarBlocks(sidebarBlocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  };
  const updateSidebarBlock = (id: string, updates: Partial<SidebarBlock>) => {
    setSidebarBlocks(sidebarBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const setSections = (sections: typeof editedPage.sections) => {
    setEditedPage((prev) => ({ ...prev, sections: sections ?? [] }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    if (!activeData) return;

    if (activeData.from === 'canvas') {
      if (active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === String(active.id));
      const newIndex = blocks.findIndex((b) => b.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...blocks];
      const [item] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, item);
      pageBuilderActions.setBlocks(page.id, reordered);
      return;
    }

    if (activeData.from === 'palette' && activeData.blockType) {
      const newBlock = createBlockOfType(activeData.blockType);
      const canvasId = `live-canvas-${page.id}`;
      const overId = String(over.id);

      if (overId === canvasId || blocks.length === 0) {
        pageBuilderActions.setBlocks(page.id, [...blocks, newBlock]);
        pageBuilderActions.selectBlock(page.id, newBlock.id);
        return;
      }
      const overIndex = blocks.findIndex((b) => b.id === overId);
      const insertIndex = overIndex === -1 ? blocks.length : overIndex;
      const next = [...blocks];
      next.splice(insertIndex, 0, newBlock);
      pageBuilderActions.setBlocks(page.id, next);
      pageBuilderActions.selectBlock(page.id, newBlock.id);
    }
  };

  const selectedBlockId = state.pageBuilder.selectedBlockIdByPageId[page.id];
  const hasBlockSelected = !!selectedBlockId;

  const sharedToolbar = (
    <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Layout</span>
        {(['full', 'sidebar-left', 'sidebar-right'] as const).map((layout) => (
          <button
            key={layout}
            onClick={() =>
              setEditedPage((prev) => {
                const next = { ...prev, layout };
                if (layout !== 'full' && (!next.sidebarBlocks || next.sidebarBlocks.length === 0)) {
                  next.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
                }
                return next;
              })
            }
            className={`p-2 border rounded-lg flex items-center gap-1 transition-all text-xs font-medium ${
              editedPage.layout === layout
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-slate-300 hover:border-red-400 text-slate-600'
            }`}
          >
            <LayoutIcon size={14} />
            {layout.replace('-', ' ')}
          </button>
        ))}
      </div>

      {editedPage.layout !== 'full' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Sidebar</span>
          <input
            type="range"
            min="15"
            max="40"
            value={editedPage.sidebarWidth}
            onChange={(e) => setEditedPage((prev) => ({ ...prev, sidebarWidth: parseInt(e.target.value) }))}
            className="w-20 h-1.5 bg-slate-200 rounded accent-red-600"
          />
          <span className="text-xs text-slate-600 w-6">{editedPage.sidebarWidth}%</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSidebarEditorOpen(!sidebarEditorOpen)}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Edit blocks <ChevronDown size={12} className={sidebarEditorOpen ? 'rotate-180' : ''} />
            </button>
            {sidebarEditorOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setSidebarEditorOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-20 w-72 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 p-3 space-y-2">
                  {[...sidebarBlocks].sort((a, b) => a.order - b.order).map((block) => (
                    <div key={block.id} className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                      <span className="font-bold text-slate-500 w-16">{block.type}</span>
                      {block.type === 'custom' && (
                        <>
                          <input
                            className="flex-1 min-w-0 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                            value={block.title ?? ''}
                            onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                            placeholder="Title"
                          />
                          <input
                            className="flex-1 min-w-0 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                            value={block.content ?? ''}
                            onChange={(e) => updateSidebarBlock(block.id, { content: e.target.value })}
                            placeholder="Content"
                          />
                        </>
                      )}
                      <button onClick={() => removeSidebarBlock(block.id)} className="text-red-600 hover:text-red-800">
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {SIDEBAR_BLOCK_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => addSidebarBlock(value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded hover:border-red-400 hover:text-red-700"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Unsaved</span>
        )}
        {showSavedFeedback && (
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Saved</span>
        )}
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={handleRevert}
            className="px-3 py-2 rounded-lg font-medium text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            title="Discard unsaved changes"
          >
            <Undo2 size={16} />
            Revert
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className="px-4 py-2 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-1.5"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );

  if (isSectionBased) {
    return (
      <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px] animate-in fade-in duration-300">
        {sharedToolbar}
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 min-w-0 overflow-auto rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
            <PageContent page={effectivePage} />
          </div>
          <div className="w-96 min-w-80 shrink-0 overflow-auto bg-white rounded-xl border border-slate-200 p-4">
            <SectionEditor sections={editedPage.sections} onChange={setSections} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px] animate-in fade-in duration-300">
        {sharedToolbar}
        <div className="flex items-center gap-2 mb-2">
          <CompactBlockPalette pageId={page.id} />
        </div>
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 min-w-0 overflow-auto rounded-xl border-2 border-slate-200 bg-slate-50">
            <LivePreviewEditor page={effectivePage} pageId={page.id} />
          </div>
          {hasBlockSelected && (
            <div className="w-96 min-w-80 shrink-0 overflow-auto">
              <BlockInspector pageId={page.id} />
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
};

export default PageEditor;
