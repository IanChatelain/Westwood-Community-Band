'use client';

import React from 'react';
import { PageConfig, SidebarBlock, SidebarBlockType } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import PageContent from '@/components/ui/PageContent';
import { 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Layout as LayoutIcon,
  Monitor,
  PanelRightClose,
} from 'lucide-react';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';

interface PageEditorProps {
  page: PageConfig;
  onSave: (updatedPage: PageConfig) => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

const SIDEBAR_BLOCK_TYPES: { value: SidebarBlockType; label: string }[] = [
  { value: 'rehearsals', label: 'Rehearsals' },
  { value: 'fees', label: 'Membership Fees' },
  { value: 'contact', label: 'Contact' },
  { value: 'custom', label: 'Custom Text' },
];

function pageConfigEqual(a: PageConfig, b: PageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, showPreview = false, onTogglePreview }) => {
  const [editedPage, setEditedPage] = React.useState<PageConfig>(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    return p;
  });
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);

  // Reset draft when switching to a different page
  React.useEffect(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    setEditedPage(p);
  }, [page.id]);

  // Merge blocks from live page (builder writes to state.pages); compare/save effective page
  const effectivePage: PageConfig = { ...editedPage, blocks: page.blocks ?? editedPage.blocks };
  const hasUnsavedChanges = !pageConfigEqual(effectivePage, page);

  const handleSave = () => {
    onSave(effectivePage);
    setShowSavedFeedback(true);
    window.setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const sidebarBlocks = editedPage.sidebarBlocks ?? [];
  const setSidebarBlocks = (blocks: SidebarBlock[]) => {
    setEditedPage(prev => ({ ...prev, sidebarBlocks: blocks }));
  };
  const addSidebarBlock = (type: SidebarBlockType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newBlock: SidebarBlock = { id, type, order: sidebarBlocks.length, title: type === 'custom' ? 'Custom' : undefined, content: '' };
    setSidebarBlocks([...sidebarBlocks, newBlock]);
  };
  const removeSidebarBlock = (id: string) => {
    const next = sidebarBlocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    setSidebarBlocks(next);
  };
  const updateSidebarBlock = (id: string, updates: Partial<SidebarBlock>) => {
    setSidebarBlocks(sidebarBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const moveSidebarBlock = (index: number, direction: 'up' | 'down') => {
    const sorted = [...sidebarBlocks].sort((a, b) => a.order - b.order);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    sorted.forEach((b, i) => (b.order = i));
    setSidebarBlocks(sorted);
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
      {/* Editor column */}
      <div className="space-y-8 min-w-0">
        <p className="text-sm text-slate-600">
          Edit layout and content blocks below. Use <strong>Save Changes</strong> to publish. Toggle <strong>Live preview</strong> to see the page as you edit.
        </p>
        {/* Page Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 flex flex-wrap gap-6 items-center justify-between">
          <div className="space-y-4 flex-grow max-w-md">
            <label className="block text-sm font-bold text-slate-700">Layout Engine</label>
            <p className="text-xs text-slate-500 mb-1">Full width or with a left/right sidebar.</p>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'sidebar-left', 'sidebar-right'] as const).map(layout => (
                <button
                  key={layout}
                  onClick={() => setEditedPage(prev => {
                    const next = { ...prev, layout };
                    if (layout !== 'full' && (!next.sidebarBlocks || next.sidebarBlocks.length === 0)) {
                      next.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
                    }
                    return next;
                  })}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-all ${
                    editedPage.layout === layout 
                      ? 'border-red-600 bg-red-50 text-red-700' 
                      : 'border-slate-300 hover:border-red-400 text-slate-600'
                  }`}
                >
                  <LayoutIcon size={20} />
                  <span className="text-[10px] uppercase font-bold">{layout.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {editedPage.layout !== 'full' && (
            <div className="space-y-4 w-48">
              <label className="block text-sm font-bold text-slate-700">
                Sidebar Width: {editedPage.sidebarWidth}%
              </label>
              <input 
                type="range" 
                min="15" 
                max="40" 
                value={editedPage.sidebarWidth}
                onChange={(e) => setEditedPage(prev => ({ ...prev, sidebarWidth: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {onTogglePreview && (
              <button
                type="button"
                onClick={onTogglePreview}
                className={`px-4 py-3 rounded-lg font-bold flex items-center gap-2 border transition-all ${
                  showPreview 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-slate-300 text-slate-700 hover:border-red-400 hover:bg-red-50/50'
                }`}
              >
                {showPreview ? <PanelRightClose size={18} /> : <Monitor size={18} />}
                {showPreview ? 'Hide preview' : 'Live preview'}
              </button>
            )}
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">Unsaved changes</span>
              )}
              {showSavedFeedback && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded animate-in fade-in duration-200">Saved</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Visual builder */}
        <BuilderCanvas pageId={page.id} />

        {/* Sidebar content (when layout has sidebar) */}
        {editedPage.layout !== 'full' && (
          <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Sidebar content</h3>
            <p className="text-xs text-slate-500 mb-4">Blocks shown next to the main content on this page. Add, remove, or reorder them below.</p>
          <div className="space-y-3">
            {[...sidebarBlocks].sort((a, b) => a.order - b.order).map((block, idx) => (
              <div key={block.id} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase w-24">{block.type}</span>
                {block.type === 'custom' && (
                  <>
                    <input
                      className="flex-1 min-w-[120px] p-2 border border-slate-300 rounded text-slate-900 text-sm"
                      value={block.title ?? ''}
                      onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                      placeholder="Title"
                    />
                    <input
                      className="flex-1 min-w-[160px] p-2 border border-slate-300 rounded text-slate-900 text-sm"
                      value={block.content ?? ''}
                      onChange={(e) => updateSidebarBlock(block.id, { content: e.target.value })}
                      placeholder="Content"
                    />
                  </>
                )}
                <div className="flex items-center gap-0.5 ml-auto">
                  <button type="button" onClick={() => moveSidebarBlock(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-40" aria-label="Move up"><ChevronUp size={14}/></button>
                  <button type="button" onClick={() => moveSidebarBlock(idx, 'down')} disabled={idx === sidebarBlocks.length - 1} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-40" aria-label="Move down"><ChevronDown size={14}/></button>
                  <button type="button" onClick={() => removeSidebarBlock(block.id)} className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded" aria-label="Remove"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {SIDEBAR_BLOCK_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => addSidebarBlock(value)} className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-700 hover:border-red-400 hover:text-red-700">
                  + {label}
                </button>
              ))}
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Live preview pane */}
      {showPreview && (
        <div className="lg:sticky lg:top-8 h-[calc(100vh-8rem)] flex flex-col rounded-xl border-2 border-slate-300 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-widest">
            Live preview
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto">
              <PageContent page={effectivePage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageEditor;
