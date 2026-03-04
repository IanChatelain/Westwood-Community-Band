'use client';

import React, { useState } from 'react';
import { SiteSettings } from '@/types';

interface SettingsTabProps {
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => void;
  onApply: () => void;
}

export default function SettingsTab({ settings, onUpdateSettings, onApply }: SettingsTabProps) {
  const [feedback, setFeedback] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Site identity</p>
          <p className="text-sm text-slate-600">Band name and footer text are used across the site.</p>
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Band Identity Name</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            value={settings.bandName}
            onChange={(e) => onUpdateSettings({ ...settings, bandName: e.target.value })}
          />
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Footer Attribution</label>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 resize-none text-slate-900 placeholder:text-slate-400"
            rows={3}
            value={settings.footerText}
            onChange={(e) => onUpdateSettings({ ...settings, footerText: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {feedback && (
          <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">Settings saved</span>
        )}
        <button
          onClick={() => {
            onApply();
            setFeedback(true);
            window.setTimeout(() => setFeedback(false), 3000);
          }}
          className="bg-red-800 hover:bg-red-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
        >
          Apply Global Changes
        </button>
      </div>
    </div>
  );
}
