'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import AdminSidebar from '@/components/cms/AdminSidebar';
import PageEditor from '@/components/cms/PageEditor';
import DashboardOverview from '@/components/cms/admin/DashboardOverview';
import PageListTab from '@/components/cms/admin/PageListTab';
import ArchiveTab from '@/components/cms/admin/ArchiveTab';
import SettingsTab from '@/components/cms/admin/SettingsTab';
import UsersTab from '@/components/cms/admin/UsersTab';
import { ShieldCheck, HelpCircle, X, LogIn, AlertTriangle, Save, Trash2 } from 'lucide-react';

function UnsavedChangesModal({
  onSave,
  onDiscard,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-0">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-50 flex-shrink-0">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Unsaved changes</h3>
              <p className="text-sm text-slate-600 mt-1">
                You have unsaved changes on this page. Would you like to save before leaving?
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save & leave'}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <Trash2 size={16} />
            Discard changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { state, setState, logout, updatePage, addPage, removePage, persist, adminTab, setAdminTab, setIsLoginModalOpen } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const editorDirtyRef = useRef(false);
  const editorSaveFnRef = useRef<(() => Promise<void>) | null>(null);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const handleEditorDirtyChange = useCallback((dirty: boolean) => {
    editorDirtyRef.current = dirty;
  }, []);

  const handleRegisterSave = useCallback((fn: (() => Promise<void>) | null) => {
    editorSaveFnRef.current = fn;
  }, []);

  const guardedSetTab = useCallback((tab: string) => {
    if (adminTab.startsWith('edit-page-') && editorDirtyRef.current && tab !== adminTab) {
      setPendingTab(tab);
      return;
    }
    setAdminTab(tab);
  }, [adminTab, setAdminTab]);

  const handleModalSave = async () => {
    if (editorSaveFnRef.current) {
      setModalSaving(true);
      await editorSaveFnRef.current();
      setModalSaving(false);
    }
    editorDirtyRef.current = false;
    if (pendingTab) {
      setAdminTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleModalDiscard = () => {
    editorDirtyRef.current = false;
    if (pendingTab) {
      setAdminTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleModalCancel = () => {
    setPendingTab(null);
  };

  const handleLogout = async () => {
    if (adminTab.startsWith('edit-page-') && editorDirtyRef.current) {
      setPendingTab('__logout__');
      return;
    }
    await logout();
    router.push('/');
  };

  const handleModalSaveForLogout = async () => {
    if (editorSaveFnRef.current) {
      setModalSaving(true);
      await editorSaveFnRef.current();
      setModalSaving(false);
    }
    editorDirtyRef.current = false;
    setPendingTab(null);
    await logout();
    router.push('/');
  };

  const handleModalDiscardForLogout = async () => {
    editorDirtyRef.current = false;
    setPendingTab(null);
    await logout();
    router.push('/');
  };

  const handleArchivePage = async (pageId: string) => {
    const page = state.pages.find((p) => p.id === pageId);
    if (!page || page.slug === '/') return;
    await updatePage({ ...page, isArchived: true, showInNav: false });
  };

  const handleRestorePage = async (pageId: string) => {
    const page = state.pages.find((p) => p.id === pageId);
    if (!page) return;
    await updatePage({ ...page, isArchived: false });
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
        setTab={guardedSetTab}
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
          <DashboardOverview pageCount={state.pages.filter(p => !p.isArchived).length} userCount={state.users.length} />
        )}

        {adminTab === 'pages' && (
          <PageListTab
            pages={state.pages}
            onAddPage={addPage}
            onRemovePage={removePage}
            onSetAdminTab={guardedSetTab}
            onArchivePage={handleArchivePage}
          />
        )}

        {adminTab === 'archive' && (
          <ArchiveTab
            pages={state.pages}
            onRestorePage={handleRestorePage}
            onSetAdminTab={guardedSetTab}
          />
        )}

        {adminTab.startsWith('edit-page-') && (
          <PageEditor
            page={state.pages.find((p) => `edit-page-${p.id}` === adminTab)!}
            onSave={updatePage}
            onDirtyChange={handleEditorDirtyChange}
            onRegisterSave={handleRegisterSave}
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

      {pendingTab && pendingTab !== '__logout__' && (
        <UnsavedChangesModal
          onSave={handleModalSave}
          onDiscard={handleModalDiscard}
          onCancel={handleModalCancel}
          saving={modalSaving}
        />
      )}

      {pendingTab === '__logout__' && (
        <UnsavedChangesModal
          onSave={handleModalSaveForLogout}
          onDiscard={handleModalDiscardForLogout}
          onCancel={handleModalCancel}
          saving={modalSaving}
        />
      )}
    </div>
  );
}
