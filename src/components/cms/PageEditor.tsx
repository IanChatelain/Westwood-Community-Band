'use client';

import React from 'react';
import { PageConfig, SidebarBlock, SidebarBlockType } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import { useAppContext } from '@/context/AppContext';
import { Save, Layout as LayoutIcon, ChevronDown, Undo2, X, History, RotateCcw } from 'lucide-react';
import { SectionEditor } from '@/components/cms/SectionEditor';
import PageContent from '@/components/ui/PageContent';
import { getPageRevisions, type PageRevisionSummary } from '@/lib/cms';

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
  const { revertPage, state, moveSectionToPage, addPage, setAdminTab, restorePageRevision } = useAppContext();
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
  const [moveToNewPageSectionId, setMoveToNewPageSectionId] = React.useState<string | null>(null);
  const [newPageTitle, setNewPageTitle] = React.useState('');
  const [newPageSlug, setNewPageSlug] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [revisions, setRevisions] = React.useState<PageRevisionSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  const normalizedSlug = newPageSlug.trim() ? `/${newPageSlug.replace(/^\//, '')}` : '';
  const slugConflict = normalizedSlug ? state.pages.some(p => p.slug === normalizedSlug) : false;

  const handleMoveToNewPage = async () => {
    if (!moveToNewPageSectionId || slugConflict) return;
    const title = newPageTitle.trim() || 'New Page';
    const slug = normalizedSlug || `/${Math.random().toString(36).slice(2, 8)}`;
    const newPage = addPage(title, slug, true);
    const ok = await moveSectionToPage(moveToNewPageSectionId, page.id, newPage.id);
    if (ok) {
      setEditedPage(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== moveToNewPageSectionId),
      }));
    }
    setMoveToNewPageSectionId(null);
    setNewPageTitle('');
    setNewPageSlug('');
    setAdminTab(`edit-page-${newPage.id}`);
  };

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

  const openHistory = async () => {
    setHistoryOpen(true);
    setLoadingHistory(true);
    const list = await getPageRevisions(page.id);
    setRevisions(list);
    setLoadingHistory(false);
  };

  const handleRestore = async (revisionId: string) => {
    setRestoringId(revisionId);
    const restored = await restorePageRevision(revisionId);
    setRestoringId(null);
    if (restored) {
      const p = { ...restored, blocks: undefined };
      setEditedPage(p);
      lastSavedRef.current = p;
      setHistoryOpen(false);
      setShowSavedFeedback(true);
      window.setTimeout(() => setShowSavedFeedback(false), 3000);
    }
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
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-slate-300 hover:border-red-400 text-slate-700'
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
          <button
            type="button"
            onClick={openHistory}
            className="px-3 py-2 rounded-lg font-medium text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            title="View page history"
          >
            <History size={16} />
            History
          </button>
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
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Live preview
            </h2>
            <p className="text-[11px] text-slate-600">
              What you see here is exactly how the page will appear to visitors.
            </p>
          </div>
          <div className="flex-1 overflow-auto rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
            <PageContent page={editedPage} />
          </div>
        </div>
        <div className="w-96 min-w-80 shrink-0 overflow-auto bg-white rounded-xl border border-slate-200 p-4">
          <SectionEditor
            sections={editedPage.sections}
            onChange={setSections}
            currentPageId={page.id}
            allPages={state.pages}
            onMoveSection={async (sectionId, targetPageId) => {
              const ok = await moveSectionToPage(sectionId, page.id, targetPageId);
              if (ok) {
                setEditedPage(prev => ({
                  ...prev,
                  sections: prev.sections.filter(s => s.id !== sectionId),
                }));
              }
            }}
            onMoveSectionToNewPage={(sectionId) => {
              setMoveToNewPageSectionId(sectionId);
              setNewPageTitle('');
              setNewPageSlug('');
            }}
          />
        </div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setHistoryOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 p-6 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={18} />
                Page history
              </h4>
              <button onClick={() => setHistoryOpen(false)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : revisions.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No previous versions saved yet. History is created each time you save.</p>
            ) : (
              <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
                {revisions.map((rev) => {
                  const date = new Date(rev.createdAt.endsWith('Z') ? rev.createdAt : rev.createdAt + 'Z');
                  const isRestoring = restoringId === rev.id;
                  return (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          {' '}
                          <span className="text-slate-500 font-normal">
                            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        {rev.label && (
                          <p className="text-xs text-slate-500 truncate">{rev.label}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRestore(rev.id)}
                        disabled={isRestoring || restoringId !== null}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw size={13} className={isRestoring ? 'animate-spin' : ''} />
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {moveToNewPageSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setMoveToNewPageSectionId(null)}>
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900">Move section to new page</h4>
              <button onClick={() => setMoveToNewPageSectionId(null)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Page title</label>
              <input
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="e.g. About Us"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">URL path</label>
              <input
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900"
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value.replace(/\s/g, '').toLowerCase())}
                placeholder="e.g. about (becomes /about)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Page URL will be /{newPageSlug || '\u2026'}.
              </p>
              {slugConflict && (
                <p className="text-xs text-red-600 mt-1">A page with this URL already exists.</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleMoveToNewPage}
                disabled={slugConflict}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg"
              >
                Create page &amp; move section
              </button>
              <button onClick={() => setMoveToNewPageSectionId(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageEditor;
