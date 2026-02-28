'use client';

import React from 'react';
import { PageConfig } from '@/types';
import PageNavBar from './PageNavBar';

interface PageListTabProps {
  pages: PageConfig[];
  onAddPage: (title: string, slug: string, addToNav: boolean) => PageConfig;
  onRemovePage: (pageId: string) => void;
  onSetAdminTab: (tab: string) => void;
  onArchivePage?: (pageId: string) => void;
}

export default function PageListTab({
  pages,
  onAddPage,
  onRemovePage,
  onSetAdminTab,
  onArchivePage,
}: PageListTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Click a page to edit; use the preview toggle to see how it will look.</p>
      <PageNavBar
        pages={pages}
        onAddPage={onAddPage}
        onRemovePage={onRemovePage}
        onSetAdminTab={onSetAdminTab}
        onArchivePage={onArchivePage}
      />
      <div className="bg-red-50 p-6 rounded-xl ring-1 ring-red-100 text-red-900">
        <h4 className="font-bold mb-1">Editing pages</h4>
        <p className="text-sm text-red-700">
          Select a page above to edit its content blocks and layout. Use <strong>Add page</strong> for new pages. Changes are shown in the live preview when you turn it on.
        </p>
      </div>
    </div>
  );
}

