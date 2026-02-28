'use client';

import React from 'react';
import { PageConfig } from '@/types';
import { ArchiveRestore, ArrowRight, Archive } from 'lucide-react';

interface ArchiveTabProps {
  pages: PageConfig[];
  onRestorePage: (pageId: string) => void;
  onSetAdminTab: (tab: string) => void;
}

export default function ArchiveTab({
  pages,
  onRestorePage,
  onSetAdminTab,
}: ArchiveTabProps) {
  const archivedPages = pages.filter((p) => p.isArchived === true);

  if (archivedPages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
          <Archive size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No archived pages</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Pages you archive from Page Content will appear here. Archived pages are hidden from the public site.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Archived pages are hidden from the public site and navigation. Restore a page to make it available again.
      </p>
      <div className="grid gap-3">
        {archivedPages.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 px-5 py-4"
          >
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">{p.title}</h4>
              <p className="text-xs text-slate-500 truncate">{p.slug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button
                onClick={() => onSetAdminTab(`edit-page-${p.id}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Open <ArrowRight size={14} />
              </button>
              <button
                onClick={() => onRestorePage(p.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <ArchiveRestore size={14} /> Restore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
