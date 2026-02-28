'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  LogOut,
  Music,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
  Archive
} from 'lucide-react';
import { User } from '@/types';

interface AdminSidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  currentTab, 
  setTab, 
  user, 
  onLogout,
  collapsed,
  onToggleCollapsed
}) => {
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const isExpanded = !collapsed || hoverExpanded;

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, roles: ['ADMIN', 'EDITOR'] },
    { id: 'pages', label: 'Page Content', icon: <FileText size={20}/>, roles: ['ADMIN', 'EDITOR'] },
    { id: 'archive', label: 'Archive', icon: <Archive size={20}/>, roles: ['ADMIN', 'EDITOR'] },
    { id: 'users', label: 'Team & RBAC', icon: <Users size={20}/>, roles: ['ADMIN'] },
    { id: 'settings', label: 'Site Settings', icon: <Settings size={20}/>, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  const sidebarContent = (
    <>
      <div className={`border-b border-slate-800 flex items-center ${isExpanded ? 'p-6 justify-between' : 'p-3 flex-col gap-2'}`}>
        <div className={`flex text-white font-bold ${isExpanded ? 'items-center gap-2' : 'flex-col items-center'}`}>
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 rounded-lg shadow-lg shadow-red-500/25 shrink-0"><Music size={18}/></div>
          {isExpanded && <span className="text-slate-100 whitespace-nowrap">WBC Admin</span>}
        </div>
        {isExpanded ? (
          <button
            onClick={onToggleCollapsed}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        ) : (
          <button
            onClick={onToggleCollapsed}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Expand sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}
      </div>

      <nav className={`flex-grow space-y-1 ${isExpanded ? 'p-4' : 'p-2'}`}>
        {isExpanded && <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-2">Management</div>}
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            title={!isExpanded ? item.label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              currentTab === item.id 
                ? 'bg-gradient-to-r from-red-600 to-red-600 text-white shadow-lg shadow-red-500/25' 
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            } ${!isExpanded ? 'justify-center px-2' : ''}`}
          >
            {item.icon}
            {isExpanded && item.label}
          </button>
        ))}

        {isExpanded && (
          <div className="pt-8 text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-2">Actions</div>
        )}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${!isExpanded ? 'justify-center px-2' : ''}`}
          title="Open the public site in a new tab"
        >
          <ExternalLink size={20}/>
          {isExpanded && 'View site (new tab)'}
        </Link>
      </nav>

      <div className={`border-t border-slate-800 bg-slate-900/50 ${isExpanded ? 'p-4' : 'p-2'}`}>
        <div className={`flex items-center gap-3 ${isExpanded ? 'px-2 mb-4' : 'flex-col mb-2'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-500/25" aria-hidden="true">
            {user.username[0].toUpperCase()}
          </div>
          {isExpanded && (
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user.username}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{user.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={!isExpanded ? 'Sign Out' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <LogOut size={18}/>
          {isExpanded && 'Sign Out'}
        </button>
      </div>
    </>
  );

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 transition-all duration-200 ease-in-out flex-shrink-0 overflow-hidden ${
        isExpanded ? 'w-64 min-w-64' : 'w-16 min-w-16'
      }`}
      onMouseEnter={() => collapsed && setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
    >
      {sidebarContent}
    </aside>
  );
};

export default AdminSidebar;
