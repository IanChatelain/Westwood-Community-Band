'use client';

import React, { useState } from 'react';
import { SiteSettings } from '@/types';

interface SettingsTabProps {
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => void;
}

export default function SettingsTab({ settings, onUpdateSettings }: SettingsTabProps) {
  const [feedback, setFeedback] = useState(false);

  return (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-8 space-y-6">
      <p className="text-sm text-slate-600">Band name and footer text are used across the site.</p>
      <div className="space-y-4">
        <label className="block text-sm font-bold text-slate-900">Band Identity Name</label>
        <input
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-900 placeholder:text-slate-400"
          value={settings.bandName}
          onChange={(e) => onUpdateSettings({ ...settings, bandName: e.target.value })}
        />
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-bold text-slate-900">Footer Attribution</label>
        <textarea
          className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-slate-900 placeholder:text-slate-400"
          rows={3}
          value={settings.footerText}
          onChange={(e) => onUpdateSettings({ ...settings, footerText: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-3">
        {feedback && (
          <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">Settings saved</span>
        )}
        <button
          onClick={() => {
            setFeedback(true);
            window.setTimeout(() => setFeedback(false), 3000);
          }}
          className="bg-gradient-to-r from-red-600 to-red-600 text-white font-bold py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-700 transition-colors shadow-lg shadow-red-500/25"
        >
          Apply Global Changes
        </button>
      </div>
    </div>
  );
}
