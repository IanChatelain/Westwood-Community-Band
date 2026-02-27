'use client';

import React from 'react';
import { PageConfig, SidebarBlock, SidebarBlockType } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import { useAppContext } from '@/context/AppContext';
import { Save, Layout as LayoutIcon, ChevronDown, Undo2 } from 'lucide-react';
import { SectionEditor } from '@/components/cms/SectionEditor';
import PageContent from '@/components/ui/PageContent';

interface PageEditorProps {
  page: PageConfig;
  onSave: (updatedPage: PageConfig) => Promise<boolean>;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSave?: (saveFn: (() => Promise<void>) | null) => void;
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

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, onDirtyChange, onRegisterSave }) => {
  const { revertPage } = useAppContext();
  const lastSavedRef = React.useRef<PageConfig>(page);
  const [editedPage, setEditedPage] = React.useState<PageConfig>(() => {
    const p = { ...page, blocks: undefined };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    return p;
  });
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);
  const [saveError, setSaveError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [sidebarEditorOpen, setSidebarEditorOpen] = React.useState(false);

  React.useEffect(() => {
    const p = { ...page, blocks: undefined };
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

  const hasUnsavedChanges = !pageConfigEqual(editedPage, lastSavedRef.current);

  React.useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    const toSave: PageConfig = { ...editedPage, blocks: undefined };
    const ok = await onSave(toSave);
    setSaving(false);
    if (ok) {
      lastSavedRef.current = toSave;
      setShowSavedFeedback(true);
      setSaveError(false);
    } else {
      setSaveError(true);
    }
    window.setTimeout(() => {
      setShowSavedFeedback(false);
      setSaveError(false);
    }, 3000);
  }, [editedPage, onSave]);

  React.useEffect(() => {
    onRegisterSave?.(handleSave);
    return () => onRegisterSave?.(null);
  }, [handleSave, onRegisterSave]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px] animate-in fade-in duration-300">
      {/* Toolbar */}
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
          {saveError && (
            <span className="text-[10px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">Save failed</span>
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
            disabled={!hasUnsavedChanges || saving}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-1.5"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor: live preview + section panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 min-w-0 overflow-auto rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
          <PageContent page={editedPage} />
        </div>
        <div className="w-96 min-w-80 shrink-0 overflow-auto bg-white rounded-xl border border-slate-200 p-4">
          <SectionEditor sections={editedPage.sections} onChange={setSections} />
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
