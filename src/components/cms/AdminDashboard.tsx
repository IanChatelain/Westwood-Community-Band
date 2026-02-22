'use client';

import React from 'react';
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
  Trash2
} from 'lucide-react';

export default function AdminDashboard() {
  const { 
    state, 
    setState,
    logout, 
    updatePage, 
    updateNav,
    setIsAdminMode,
    adminTab,
    setAdminTab
  } = useAppContext();

  if (!state.currentUser) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar 
        currentTab={adminTab} 
        setTab={setAdminTab} 
        user={state.currentUser}
        onLogout={logout}
        onViewSite={() => setIsAdminMode(false)}
      />
      
      <main className="flex-grow p-8 max-h-screen overflow-y-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize">{adminTab.replace('-', ' ')}</h2>
            <p className="text-slate-600 mt-1">Manage your website content and structure with ease.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12}/> {state.currentUser.role} ACCESS
            </span>
          </div>
        </header>

        {adminTab === 'overview' && (
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
        )}

        {adminTab === 'pages' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-200 rounded-xl w-fit">
              {state.pages.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setAdminTab(`edit-page-${p.id}`)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white shadow-sm ring-1 ring-slate-900/5 hover:ring-red-400 transition-all flex items-center gap-2"
                >
                  {p.title} <ArrowRight size={14}/>
                </button>
              ))}
            </div>
            <div className="bg-red-50 p-6 rounded-xl ring-1 ring-red-100 text-red-900">
              <h4 className="font-bold mb-1">Editing Mode</h4>
              <p className="text-sm text-red-700">Select a page above to modify its specific content blocks and layout configuration.</p>
            </div>
          </div>
        )}

        {adminTab.startsWith('edit-page-') && (
          <PageEditor 
            page={state.pages.find(p => `edit-page-${p.id}` === adminTab)!} 
            onSave={updatePage}
          />
        )}

        {adminTab === 'navigation' && (
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
        )}

        {adminTab === 'settings' && (
          <div className="max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 space-y-6">
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
            <button onClick={() => alert('Global settings saved!')} className="w-full bg-gradient-to-r from-red-600 to-red-600 text-white font-bold py-3 rounded-xl hover:from-red-700 hover:to-red-700 transition-colors shadow-lg shadow-red-500/25">
              Apply Global Changes
            </button>
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
