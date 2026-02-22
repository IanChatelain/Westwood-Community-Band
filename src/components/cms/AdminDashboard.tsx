'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import AdminSidebar from '@/components/cms/AdminSidebar';
import PageEditor from '@/components/cms/PageEditor';
import DashboardOverview from '@/components/cms/admin/DashboardOverview';
import PageListTab from '@/components/cms/admin/PageListTab';
import SettingsTab from '@/components/cms/admin/SettingsTab';
import UsersTab from '@/components/cms/admin/UsersTab';
import { ShieldCheck, HelpCircle, X } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { state, setState, logout, updatePage, addPage, removePage, adminTab, setAdminTab } = useAppContext();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!state.currentUser) return null;

  const isEditingPage = adminTab.startsWith('edit-page-');

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar
        currentTab={adminTab}
        setTab={setAdminTab}
        user={state.currentUser}
        onLogout={handleLogout}
        onTogglePreview={() => setPreviewOpen((p) => !p)}
        previewOpen={previewOpen}
        isEditingPage={isEditingPage}
      />

      <main className="flex-grow p-8 max-h-screen overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize">{adminTab.replace(/-/g, ' ')}</h2>
            <p className="text-slate-600 mt-1">Manage your website content and structure with ease.</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Help"
              aria-label="Open help"
            >
              <HelpCircle size={20} />
            </button>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} /> {state.currentUser.role} ACCESS
            </span>
          </div>
        </header>

        {helpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">How to use the CMS</h3>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close help"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Dashboard</h4>
                  <p>Overview and quick stats. Use the sidebar to go to Page Content or Site Settings.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Page Content</h4>
                  <p>
                    Click a page to edit its content and layout. Use <strong>Add page</strong> for new pages. Use the live preview toggle to see how the page will look as you edit.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Editing a page</h4>
                  <p>
                    Choose full-width or sidebar layout. Add sections (text, hero, image+text, gallery, table, etc.) and use the block-type dropdown to change a section. Use <strong>Save Changes</strong> to publish. Turn on <strong>Live preview</strong> to see the page as visitors will.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Site Settings</h4>
                  <p>
                    Band name and footer text are used across the site. Click <strong>Apply Global Changes</strong> to confirm.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'overview' && (
          <DashboardOverview pageCount={state.pages.length} userCount={state.users.length} />
        )}

        {adminTab === 'pages' && (
          <PageListTab
            pages={state.pages}
            onAddPage={addPage}
            onRemovePage={removePage}
            onSetAdminTab={setAdminTab}
          />
        )}

        {adminTab.startsWith('edit-page-') && (
          <PageEditor
            page={state.pages.find((p) => `edit-page-${p.id}` === adminTab)!}
            onSave={updatePage}
            showPreview={previewOpen}
            onTogglePreview={() => setPreviewOpen((p) => !p)}
          />
        )}

        {adminTab === 'settings' && (
          <SettingsTab
            settings={state.settings}
            onUpdateSettings={(settings) => setState((prev) => ({ ...prev, settings }))}
          />
        )}

        {adminTab === 'users' && <UsersTab />}
      </main>
    </div>
  );
}
