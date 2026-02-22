'use client';

import React from 'react';
import { Users, ShieldCheck, Lock } from 'lucide-react';

interface DashboardOverviewProps {
  pageCount: number;
  userCount: number;
}

export default function DashboardOverview({ pageCount, userCount }: DashboardOverviewProps) {
  const stats = [
    { label: 'Total Pages', val: pageCount, icon: <Lock className="text-red-500" /> },
    { label: 'Team Members', val: userCount, icon: <Users className="text-red-500" /> },
    { label: 'Performance', val: 'Excellent', icon: <ShieldCheck className="text-emerald-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-slate-700">
        <h3 className="font-bold text-slate-900 mb-2">Getting started</h3>
        <p className="text-sm mb-2">
          Use <strong>Page Content</strong> to add or select a page to edit. In the editor you can change layout, sections, and sidebar. Click <strong>Save Changes</strong> to publish. Use <strong>Live preview</strong> (sidebar or toolbar) to see the page as visitors will. Use <strong>View site (new tab)</strong> to open the public site without leaving admin.
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>Dashboard: overview and quick stats</li>
          <li>Page Content: edit pages and add new ones (menu links are derived from pages)</li>
          <li>Site Settings: band name and footer text</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
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
  );
}
