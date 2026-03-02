'use client';

import React from 'react';
import { PageConfig, SidebarBlock, SidebarBlockType, SidebarFeeItem } from '@/types';
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

const DEFAULT_SIDEBAR_FEE_ITEMS: SidebarFeeItem[] = [
  { label: 'Annual Fee', amount: '$100.00' },
  { label: 'Students', amount: '$50.00' },
  { label: 'Polo Shirt', amount: '$15.00' },
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
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [revisions, setRevisions] = React.useState<PageRevisionSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [lastRestoredRevisionId, setLastRestoredRevisionId] = React.useState<string | null>(null);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const handleMoveToNewPage = async () => {
    if (!moveToNewPageSectionId) return;
    const title = newPageTitle.trim() || 'New Page';
    let baseSlug = slugify(title) || 'page';
    let slug = `/${baseSlug}`;
    let suffix = 1;
    while (state.pages.some(p => p.slug === slug)) {
      slug = `/${baseSlug}-${suffix}`;
      suffix++;
    }
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
      setLastRestoredRevisionId(revisionId);
      setShowSavedFeedback(true);
      window.setTimeout(() => setShowSavedFeedback(false), 3000);
      const list = await getPageRevisions(page.id);
      setRevisions(list);
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
          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={() => setSidebarEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-600 text-xs font-semibold text-red-700 bg-white hover:bg-red-50"
            >
              Edit sidebar
            </button>
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
            }}
          />
        </div>
      </div>

      {sidebarEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSidebarEditorOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 p-5 w-full max-w-2xl max-h-[80vh] flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Sidebar blocks</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Edit the content that appears in the sidebar for this page.
                </p>
              </div>
              <button
                onClick={() => setSidebarEditorOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
                aria-label="Close sidebar editor"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {[...sidebarBlocks].sort((a, b) => a.order - b.order).map((block) => {
                const isRehearsals = block.type === 'rehearsals';
                const isFees = block.type === 'fees';
                const isContact = block.type === 'contact';
                const isCustom = block.type === 'custom';

                const effectiveFeeItems =
                  isFees && block.feeItems && block.feeItems.length > 0
                    ? block.feeItems
                    : isFees
                      ? DEFAULT_SIDEBAR_FEE_ITEMS
                      : [];

                return (
                  <div key={block.id} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 uppercase tracking-wide">{block.type}</span>
                      <button
                        onClick={() => removeSidebarBlock(block.id)}
                        className="text-red-600 hover:text-red-800 text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>

                    {isRehearsals && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          className="col-span-2 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.title ?? 'Rehearsals'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Rehearsals)"
                        />
                        <input
                          className="p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.day ?? 'Thursday Evenings'}
                          onChange={(e) => updateSidebarBlock(block.id, { day: e.target.value })}
                          placeholder="Day (e.g. Thursday Evenings)"
                        />
                        <input
                          className="p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.time ?? '7:15 to 9:15 p.m.'}
                          onChange={(e) => updateSidebarBlock(block.id, { time: e.target.value })}
                          placeholder="Time (e.g. 7:15 to 9:15 p.m.)"
                        />
                        <input
                          className="col-span-2 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.venueName ?? 'The Band Room'}
                          onChange={(e) => updateSidebarBlock(block.id, { venueName: e.target.value })}
                          placeholder="Venue (e.g. The Band Room)"
                        />
                        <input
                          className="col-span-2 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.addressLine1 ?? 'John Taylor Collegiate'}
                          onChange={(e) => updateSidebarBlock(block.id, { addressLine1: e.target.value })}
                          placeholder="Address line 1 (e.g. John Taylor Collegiate)"
                        />
                        <input
                          className="col-span-2 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.addressLine2 ?? '470 Hamilton Avenue, Winnipeg, Manitoba'}
                          onChange={(e) => updateSidebarBlock(block.id, { addressLine2: e.target.value })}
                          placeholder="Address line 2 (e.g. 470 Hamilton Ave, Winnipeg)"
                        />
                        <input
                          className="col-span-2 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={
                            block.mapUrl ?? 'https://maps.google.ca/maps?q=470+Hamilton+Avenue,+Winnipeg,+MB'
                          }
                          onChange={(e) => updateSidebarBlock(block.id, { mapUrl: e.target.value })}
                          placeholder="Map / directions URL"
                        />
                      </div>
                    )}

                    {isFees && (
                      <div className="space-y-1.5">
                        <input
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.title ?? 'Membership Fees'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Membership Fees)"
                        />
                        <input
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.seasonLabel ?? 'Band Season: September to June'}
                          onChange={(e) => updateSidebarBlock(block.id, { seasonLabel: e.target.value })}
                          placeholder="Season note (e.g. Band Season: September to June)"
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Fee items</span>
                          {effectiveFeeItems.map((item, idx) => (
                            <div key={idx} className="flex gap-1">
                              <input
                                className="flex-1 min-w-0 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                                value={item.label}
                                onChange={(e) => {
                                  const items = [...effectiveFeeItems];
                                  items[idx] = { ...items[idx], label: e.target.value };
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                                placeholder="Label"
                              />
                              <input
                                className="w-24 p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                                value={item.amount}
                                onChange={(e) => {
                                  const items = [...effectiveFeeItems];
                                  items[idx] = { ...items[idx], amount: e.target.value };
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                                placeholder="Amount"
                              />
                              <button
                                className="text-red-600 hover:text-red-800 px-1"
                                onClick={() => {
                                  const items = effectiveFeeItems.filter((_, i) => i !== idx);
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            className="text-xs text-slate-600 hover:text-red-700 border border-slate-300 rounded px-2 py-1 hover:border-red-400"
                            onClick={() => {
                              const items: SidebarFeeItem[] = [...effectiveFeeItems, { label: '', amount: '' }];
                              updateSidebarBlock(block.id, { feeItems: items });
                            }}
                          >
                            + Add fee
                          </button>
                        </div>
                      </div>
                    )}

                    {isContact && (
                      <div className="space-y-1.5">
                        <input
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.title ?? 'Contact'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Contact)"
                        />
                        <textarea
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900 resize-y"
                          rows={2}
                          value={block.body ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { body: e.target.value })}
                          placeholder="Body text above the button"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            className="p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                            value={block.linkLabel ?? 'Get in Touch'}
                            onChange={(e) => updateSidebarBlock(block.id, { linkLabel: e.target.value })}
                            placeholder="Button label (e.g. Get in Touch)"
                          />
                          <input
                            className="p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                            value={block.href ?? '/contact'}
                            onChange={(e) => updateSidebarBlock(block.id, { href: e.target.value })}
                            placeholder="Button link (e.g. /contact)"
                          />
                        </div>
                      </div>
                    )}

                    {isCustom && (
                      <div className="space-y-1.5">
                        <input
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900"
                          value={block.title ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title"
                        />
                        <textarea
                          className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-900 resize-y"
                          rows={3}
                          value={block.content ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { content: e.target.value })}
                          placeholder="Content"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setHistoryOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-slate-900/5 p-6 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <History size={18} />
                  Page history
                </h4>
                <button onClick={() => setHistoryOpen(false)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Showing the last 15 saves for this page. Older versions are automatically cleaned up.
              </p>
            </div>
            {loadingHistory ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : revisions.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No previous versions saved yet. History is created each time you save.</p>
            ) : (
              <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1">
                {(() => {
                  const now = new Date();
                  return revisions.map((rev) => {
                    const date = new Date(rev.createdAt.endsWith('Z') ? rev.createdAt : rev.createdAt + 'Z');
                    const isRestoring = restoringId === rev.id;
                    const isRestoredTarget = rev.id === lastRestoredRevisionId;
                    const minutesAgo = Math.round((now.getTime() - date.getTime()) / 60000);
                    let relative: string | null = null;
                    if (!Number.isNaN(minutesAgo)) {
                      if (minutesAgo < 1) relative = 'just now';
                      else if (minutesAgo < 60) relative = `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
                      else {
                        const hours = Math.round(minutesAgo / 60);
                        if (hours < 24) relative = `${hours} hour${hours === 1 ? '' : 's'} ago`;
                        else {
                          const days = Math.round(hours / 24);
                          relative = `${days} day${days === 1 ? '' : 's'} ago`;
                        }
                      }
                    }
                    return (
                      <div
                        key={rev.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                          rev.isCurrent
                            ? 'bg-emerald-50 border-emerald-200'
                            : isRestoredTarget
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            <span className="text-slate-500 font-normal">
                              {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {rev.isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Current</span>
                            )}
                            {isRestoredTarget && !rev.isCurrent && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Restored to this version</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {rev.label ?? (relative ? `Saved ${relative}` : '')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(rev.id)}
                          disabled={rev.isCurrent || isRestoring || restoringId !== null}
                          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw size={13} className={isRestoring ? 'animate-spin' : ''} />
                          {isRestoring ? 'Restoring...' : rev.isCurrent ? 'Current' : 'Restore'}
                        </button>
                      </div>
                    );
                  });
                })()}
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
            <p className="text-xs text-slate-500">
              URL will be /{newPageTitle.trim() ? (slugify(newPageTitle.trim()) || '\u2026') : '\u2026'}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleMoveToNewPage}
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
