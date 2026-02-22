'use client';

import React, { useState } from 'react';
import { PageConfig } from '@/types';
import { Plus, Trash2, ArrowRight, X } from 'lucide-react';

interface PageListTabProps {
  pages: PageConfig[];
  onAddPage: (title: string, slug: string, addToNav: boolean) => PageConfig;
  onRemovePage: (pageId: string) => void;
  onSetAdminTab: (tab: string) => void;
}

export default function PageListTab({
  pages,
  onAddPage,
  onRemovePage,
  onSetAdminTab,
}: PageListTabProps) {
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddPage = () => {
    const title = newPageTitle.trim() || 'New Page';
    const slug = newPageSlug.trim() ? `/${newPageSlug.replace(/^\//, '')}` : `/${Math.random().toString(36).slice(2, 8)}`;
    if (pages.some((p) => p.slug === slug)) {
      alert('A page with this URL already exists. Choose a different path.');
      return;
    }
    const newPage = onAddPage(title, slug, true);
    setShowAddPage(false);
    setNewPageTitle('');
    setNewPageSlug('');
    onSetAdminTab(`edit-page-${newPage.id}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Click a page to edit; use the preview toggle to see how it will look.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setNewPageTitle('');
            setNewPageSlug('');
            setShowAddPage(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> Add page
        </button>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-200 rounded-xl w-fit">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center gap-1 bg-white rounded-lg shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
              <button
                onClick={() => onSetAdminTab(`edit-page-${p.id}`)}
                className="px-4 py-2 text-sm font-bold text-slate-700 hover:ring-red-400 transition-all flex items-center gap-2"
              >
                {p.title} <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setDeleteConfirmId(p.id)}
                disabled={pages.length <= 1 || p.slug === '/'}
                className="p-2 text-slate-500 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 rounded-r-lg"
                aria-label={`Delete ${p.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAddPage && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 max-w-md space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900">Add new page</h4>
            <button onClick={() => setShowAddPage(false)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close">
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
            <p className="text-xs text-slate-500 mt-1">Letters and numbers only. Page URL will be /{newPageSlug || '…'}.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddPage} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
              Add page
            </button>
            <button onClick={() => setShowAddPage(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 max-w-md">
          <h4 className="font-bold text-slate-900 mb-2">Delete this page?</h4>
          <p className="text-sm text-slate-600 mb-4">This will remove the page and its content. You can also remove it from the menu.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onRemovePage(deleteConfirmId);
                setDeleteConfirmId(null);
                onSetAdminTab('pages');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
            >
              Delete and remove from menu
            </button>
            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-red-50 p-6 rounded-xl ring-1 ring-red-100 text-red-900">
        <h4 className="font-bold mb-1">Editing pages</h4>
        <p className="text-sm text-red-700">
          Select a page above to edit its content blocks and layout. Use <strong>Add page</strong> for new pages. Changes are shown in the live preview when you turn it on.
        </p>
      </div>
    </div>
  );
}
