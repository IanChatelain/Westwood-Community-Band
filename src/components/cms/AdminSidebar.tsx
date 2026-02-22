'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  LogOut,
  Monitor,
  Music,
  ExternalLink
} from 'lucide-react';
import { User } from '@/types';

interface AdminSidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  onTogglePreview: () => void;
  previewOpen: boolean;
  isEditingPage: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  currentTab, 
  setTab, 
  user, 
  onLogout,
  onTogglePreview,
  previewOpen,
  isEditingPage
}) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, roles: ['ADMIN', 'EDITOR'] },
    { id: 'pages', label: 'Page Content', icon: <FileText size={20}/>, roles: ['ADMIN', 'EDITOR'] },
    { id: 'users', label: 'Team & RBAC', icon: <Users size={20}/>, roles: ['ADMIN'] },
    { id: 'settings', label: 'Site Settings', icon: <Settings size={20}/>, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-64 min-w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 rounded-lg shadow-lg shadow-red-500/25"><Music size={18}/></div>
          <span className="text-slate-100">WBC Admin</span>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-2">Management</div>
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              currentTab === item.id 
                ? 'bg-gradient-to-r from-red-600 to-red-600 text-white shadow-lg shadow-red-500/25' 
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="pt-8 text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-2">Actions</div>
        <button
          onClick={onTogglePreview}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            previewOpen ? 'bg-red-600/20 text-red-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title={isEditingPage ? 'Show or hide live preview of the page you are editing' : 'Open a page to edit and use live preview'}
        >
          <Monitor size={20}/>
          {previewOpen ? 'Hide preview' : 'Live preview'}
        </button>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          title="Open the public site in a new tab"
        >
          <ExternalLink size={20}/>
          View site (new tab)
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/25" aria-hidden="true">
            {user.username[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{user.username}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <LogOut size={18}/>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
