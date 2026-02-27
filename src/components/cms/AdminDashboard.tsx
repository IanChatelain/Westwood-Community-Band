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
import { ShieldCheck, HelpCircle, X, LogIn } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { state, setState, logout, updatePage, addPage, removePage, persist, adminTab, setAdminTab, setIsLoginModalOpen } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!state.currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center max-w-sm px-6">
          <div className="inline-flex p-4 rounded-full bg-slate-200 mb-4">
            <LogIn size={32} className="text-slate-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in to continue</h1>
          <p className="text-slate-600 mb-6">Log in to access the admin dashboard and manage your site.</p>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Log in
          </button>
          <p className="mt-6 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-red-600 hover:underline"
            >
              Return to site
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar
        currentTab={adminTab}
        setTab={setAdminTab}
        user={state.currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      <main className={`flex-grow max-h-screen overflow-y-auto ${adminTab.startsWith('edit-page-') ? 'p-4' : 'p-8'}`}>
        <header className={`flex justify-between items-end ${adminTab.startsWith('edit-page-') ? 'mb-4' : 'mb-8'}`}>
          <div>
            <h2 className={`font-extrabold text-slate-900 capitalize ${adminTab.startsWith('edit-page-') ? 'text-xl' : 'text-3xl'}`}>
              {adminTab.startsWith('edit-page-') ? 'Edit page' : adminTab.replace(/-/g, ' ')}
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              {adminTab.startsWith('edit-page-') ? 'Drag blocks in the preview. Click a block to edit.' : 'Manage your website content and structure with ease.'}
            </p>
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
                    Click a page to edit its content and layout. Use <strong>Add page</strong> for new pages. Edit directly in the live preview—drag blocks to build your page.
                  </p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Editing a page</h4>
                  <p>
                    Choose full-width or sidebar layout. Use the visual page builder to add and arrange blocks. Changes are not auto-saved—click <strong>Save</strong> to publish. Use <strong>Revert</strong> to discard unsaved edits.
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
          />
        )}

        {adminTab === 'settings' && (
          <SettingsTab
            settings={state.settings}
            onUpdateSettings={(settings) => setState((prev) => ({ ...prev, settings }))}
            onApply={persist}
          />
        )}

        {adminTab === 'users' && <UsersTab />}
      </main>
    </div>
  );
}
