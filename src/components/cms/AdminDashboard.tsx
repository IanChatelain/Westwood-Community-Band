'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import AdminSidebar from '@/components/cms/AdminSidebar';
import PageEditor from '@/components/cms/PageEditor';
import { UserRole } from '@/types';
import { 
  Users, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  X,
  HelpCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    state, 
    setState,
    logout, 
    updatePage, 
    updateNav,
    addPage,
    removePage,
    setIsAdminMode,
    adminTab,
    setAdminTab
  } = useAppContext();
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!state.currentUser) return null;

  const isEditingPage = adminTab.startsWith('edit-page-');

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar 
        currentTab={adminTab} 
        setTab={setAdminTab} 
        user={state.currentUser}
        onLogout={logout}
        onTogglePreview={() => setPreviewOpen(p => !p)}
        previewOpen={previewOpen}
        isEditingPage={isEditingPage}
      />
      
      <main className="flex-grow p-8 max-h-screen overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize">{adminTab.replace('-', ' ')}</h2>
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
              <ShieldCheck size={12}/> {state.currentUser.role} ACCESS
            </span>
          </div>
        </header>

        {helpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">How to use the CMS</h3>
                <button type="button" onClick={() => setHelpOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Close help">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Dashboard</h4>
                  <p>Overview and quick stats. Use the sidebar to go to Page Content, Nav Structure, or Site Settings.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Page Content</h4>
                  <p>Click a page to edit its content and layout. Use <strong>Add page</strong> for new pages. Use the live preview toggle to see how the page will look as you edit.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Editing a page</h4>
                  <p>Choose full-width or sidebar layout. Add sections (text, hero, image+text, gallery, table, etc.) and use the block-type dropdown to change a section. Use <strong>Save Changes</strong> to publish. Turn on <strong>Live preview</strong> to see the page as visitors will.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Navigation</h4>
                  <p>These links appear in the site header. Edit label and path (URL); order follows the list. Changes apply immediately.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1">Site Settings</h4>
                  <p>Band name and footer text are used across the site. Click <strong>Apply Global Changes</strong> to confirm.</p>
                </section>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-slate-700">
              <h3 className="font-bold text-slate-900 mb-2">Getting started</h3>
              <p className="text-sm mb-2">
                Use <strong>Page Content</strong> to add or select a page to edit. In the editor you can change layout, sections, and sidebar. Click <strong>Save Changes</strong> to publish. Use <strong>Live preview</strong> (sidebar or toolbar) to see the page as visitors will. Use <strong>View site (new tab)</strong> to open the public site without leaving admin.
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Dashboard: overview and quick stats</li>
                <li>Page Content: edit pages and add new ones</li>
                <li>Nav Structure: menu links in the site header</li>
                <li>Site Settings: band name and footer text</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Pages', val: state.pages.length, icon: <Lock className="text-red-500"/> },
                { label: 'Team Members', val: state.users.length, icon: <Users className="text-red-500"/> },
                { label: 'Performance', val: 'Excellent', icon: <ShieldCheck className="text-emerald-500"/> },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{stat.val}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">{stat.icon}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'pages' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Click a page to edit; use the preview toggle to see how it will look.</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setNewPageTitle(''); setNewPageSlug(''); setShowAddPage(true); }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm flex items-center gap-2"
              >
                <Plus size={18}/> Add page
              </button>
              <div className="flex flex-wrap gap-2 p-1 bg-slate-200 rounded-xl w-fit">
                {state.pages.map(p => (
                  <div key={p.id} className="flex items-center gap-1 bg-white rounded-lg shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                    <button 
                      onClick={() => setAdminTab(`edit-page-${p.id}`)}
                      className="px-4 py-2 text-sm font-bold text-slate-700 hover:ring-red-400 transition-all flex items-center gap-2"
                    >
                      {p.title} <ArrowRight size={14}/>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      disabled={state.pages.length <= 1 || p.slug === '/'}
                      className="p-2 text-slate-500 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 rounded-r-lg"
                      aria-label={`Delete ${p.title}`}
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {showAddPage && (
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6 max-w-md space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900">Add new page</h4>
                  <button onClick={() => setShowAddPage(false)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close"><X size={20}/></button>
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
                  <button
                    onClick={() => {
                      const title = newPageTitle.trim() || 'New Page';
                      const slug = newPageSlug.trim() ? `/${newPageSlug.replace(/^\//, '')}` : `/${Math.random().toString(36).slice(2, 8)}`;
                      if (state.pages.some(p => p.slug === slug)) {
                        alert('A page with this URL already exists. Choose a different path.');
                        return;
                      }
                      const newPage = addPage(title, slug, true);
                      setShowAddPage(false);
                      setAdminTab(`edit-page-${newPage.id}`);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                  >
                    Add page
                  </button>
                  <button onClick={() => setShowAddPage(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold">Cancel</button>
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
                      removePage(deleteConfirmId, true);
                      setDeleteConfirmId(null);
                      setAdminTab('pages');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                  >
                    Delete and remove from menu
                  </button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </div>
            )}
            <div className="bg-red-50 p-6 rounded-xl ring-1 ring-red-100 text-red-900">
              <h4 className="font-bold mb-1">Editing pages</h4>
              <p className="text-sm text-red-700">Select a page above to edit its content blocks and layout. Use <strong>Add page</strong> for new pages. Changes are shown in the live preview when you turn it on.</p>
            </div>
          </div>
        )}

        {adminTab.startsWith('edit-page-') && (
          <PageEditor 
            page={state.pages.find(p => `edit-page-${p.id}` === adminTab)!} 
            onSave={updatePage}
            showPreview={previewOpen}
            onTogglePreview={() => setPreviewOpen(p => !p)}
          />
        )}

        {adminTab === 'navigation' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">These links appear in the site header. Order follows the list; edit label and path (URL) as needed. Changes apply immediately.</p>
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-900">Main Menu Structure</h3>
               <button 
                  onClick={() => {
                    const id = Math.random().toString(36).substr(2, 9);
                    updateNav([...state.settings.navLinks, { id, label: 'New Link', path: '/new', order: state.settings.navLinks.length }]);
                  }}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                 <Plus size={20}/>
               </button>
             </div>
             <div className="divide-y divide-slate-200">
               {state.settings.navLinks.sort((a,b) => a.order - b.order).map((link, idx) => (
                 <div key={link.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                   <div className="font-bold text-slate-600">#{idx + 1}</div>
                   <input 
                    className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none flex-grow text-slate-900 placeholder:text-slate-400"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...state.settings.navLinks];
                      newLinks[idx].label = e.target.value;
                      updateNav(newLinks);
                    }}
                   />
                   <input 
                    className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none w-48 text-slate-900 placeholder:text-slate-400"
                    value={link.path}
                    onChange={(e) => {
                      const newLinks = [...state.settings.navLinks];
                      newLinks[idx].path = e.target.value;
                      updateNav(newLinks);
                    }}
                   />
                   <button 
                    onClick={() => updateNav(state.settings.navLinks.filter(l => l.id !== link.id))}
                    className="p-2 text-slate-500 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 rounded-lg"
                    aria-label="Delete navigation link"
                  >
                    <Trash2 size={18}/>
                  </button>
                 </div>
               ))}
             </div>
          </div>
          </div>
        )}

        {adminTab === 'settings' && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 space-y-6">
            <p className="text-sm text-slate-600">Band name and footer text are used across the site.</p>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-900">Band Identity Name</label>
              <input 
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-900 placeholder:text-slate-400"
                value={state.settings.bandName}
                onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, bandName: e.target.value } }))}
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-900">Footer Attribution</label>
              <textarea 
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-slate-900 placeholder:text-slate-400"
                rows={3}
                value={state.settings.footerText}
                onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, footerText: e.target.value } }))}
              />
            </div>
            <div className="flex items-center gap-3">
              {settingsSavedFeedback && (
                <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">Settings saved</span>
              )}
              <button
                onClick={() => {
                  setSettingsSavedFeedback(true);
                  window.setTimeout(() => setSettingsSavedFeedback(false), 3000);
                }}
                className="bg-gradient-to-r from-red-600 to-red-600 text-white font-bold py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-700 transition-colors shadow-lg shadow-red-500/25"
              >
                Apply Global Changes
              </button>
            </div>
          </div>
        )}

        {adminTab === 'users' && (
           <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-widest">
                 <tr>
                   <th className="px-6 py-4" scope="col">User</th>
                   <th className="px-6 py-4" scope="col">Role / Permissions</th>
                   <th className="px-6 py-4" scope="col">Contact</th>
                   <th className="px-6 py-4" scope="col">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {state.users.map(user => (
                   <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-100 text-red-600 flex items-center justify-center font-bold" aria-hidden="true">
                           {user.username[0].toUpperCase()}
                         </div>
                         <span className="font-bold text-slate-900">{user.username}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                         user.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700'
                       }`}>
                         {user.role}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                     <td className="px-6 py-4">
                       <button className="text-red-600 hover:underline text-sm font-bold">Edit Rights</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </main>
    </div>
  );
}
