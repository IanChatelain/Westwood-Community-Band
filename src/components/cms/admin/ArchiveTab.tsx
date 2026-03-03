'use client';

import React, { useState } from 'react';
import { PageConfig, SidebarBlock } from '@/types';
import { ArchiveRestore, Eye, Archive, X } from 'lucide-react';
import PageContent from '@/components/ui/PageContent';

interface ArchiveTabProps {
  pages: PageConfig[];
  onRestorePage: (pageId: string) => void;
  globalSidebarBlocks?: SidebarBlock[];
}

export default function ArchiveTab({
  pages,
  onRestorePage,
  globalSidebarBlocks,
}: ArchiveTabProps) {
  const archivedPages = pages.filter((p) => p.isArchived === true);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const selectedPage = selectedPageId
    ? archivedPages.find((p) => p.id === selectedPageId) ?? null
    : null;

  if (archivedPages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
          <Archive size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No archived pages</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Pages you archive from Page Content will appear here. Archived pages are removed from navigation and hidden from the public site.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Archived pages are removed from navigation and hidden from the public site. Restoring a page will return it to the navigation and make it publicly accessible again.
      </p>
      <div className="grid gap-3">
        {archivedPages.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-xl shadow-sm ring-1 px-5 py-4 transition-colors cursor-pointer ${
              selectedPageId === p.id
                ? 'bg-slate-50 ring-red-300'
                : 'bg-white ring-slate-900/5 hover:bg-slate-50'
            }`}
            onClick={() => setSelectedPageId(p.id)}
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">{p.title}</h4>
              <p className="text-xs text-slate-500 truncate">{p.slug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPageId(p.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  selectedPageId === p.id
                    ? 'text-red-700 bg-red-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye size={14} /> View
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPageId === p.id) setSelectedPageId(null);
                  onRestorePage(p.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <ArchiveRestore size={14} /> Restore
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Preview: {selectedPage.title}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedPageId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <PageContent page={selectedPage} globalSidebarBlocks={globalSidebarBlocks} />
          </div>
        </div>
      )}
    </div>
  );
}
