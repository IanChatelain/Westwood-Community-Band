'use client';

import React, { useState } from 'react';
import { SiteSettings } from '@/types';
import { validateUrl } from '@/lib/validation';

interface SettingsTabProps {
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => void;
  onApply: () => void;
}

export default function SettingsTab({ settings, onUpdateSettings, onApply }: SettingsTabProps) {
  const [feedback, setFeedback] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateBeforeApply = (): boolean => {
    const errors: Record<string, string> = {};
    if (!settings.bandName.trim()) errors.bandName = 'Band name is required.';
    const fbErr = settings.facebookUrl ? validateUrl(settings.facebookUrl, 'Facebook URL') : null;
    if (fbErr) errors.facebookUrl = fbErr;
    const igErr = settings.instagramUrl ? validateUrl(settings.instagramUrl, 'Instagram URL') : null;
    if (igErr) errors.instagramUrl = igErr;
    const ytErr = settings.youtubeUrl ? validateUrl(settings.youtubeUrl, 'YouTube URL') : null;
    if (ytErr) errors.youtubeUrl = ytErr;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
            maxLength={200}
            onChange={(e) => { onUpdateSettings({ ...settings, bandName: e.target.value }); setValidationErrors(prev => ({ ...prev, bandName: '' })); }}
          />
          {validationErrors.bandName && <p className="text-xs text-red-600 mt-1">{validationErrors.bandName}</p>}
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Footer Attribution</label>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 resize-none text-slate-900 placeholder:text-slate-400"
            rows={3}
            maxLength={500}
            value={settings.footerText}
            onChange={(e) => onUpdateSettings({ ...settings, footerText: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Footer &amp; Contact</p>
          <p className="text-sm text-slate-600">Tagline, address, phone, and contact page shown in the footer.</p>
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Footer Tagline</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="Short tagline shown under the band name in the footer"
            maxLength={200}
            value={settings.footerTagline ?? ''}
            onChange={(e) => onUpdateSettings({ ...settings, footerTagline: e.target.value })}
          />
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Contact Address</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="e.g. Westwood Community Arts Center"
            maxLength={300}
            value={settings.contactAddress ?? ''}
            onChange={(e) => onUpdateSettings({ ...settings, contactAddress: e.target.value })}
          />
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Contact Phone</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="e.g. (555) 123-4567"
            maxLength={30}
            value={settings.contactPhone ?? ''}
            onChange={(e) => onUpdateSettings({ ...settings, contactPhone: e.target.value })}
          />
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Contact Page Slug</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="/contact"
            maxLength={200}
            value={settings.contactPageSlug ?? ''}
            onChange={(e) => onUpdateSettings({ ...settings, contactPageSlug: e.target.value })}
          />
          <p className="text-xs text-slate-500">The page the footer &quot;Contact Us&quot; link points to.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Social Links</p>
          <p className="text-sm text-slate-600">Leave a URL empty to hide that icon in the footer.</p>
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Facebook URL</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="https://facebook.com/..."
            value={settings.facebookUrl ?? ''}
            maxLength={2000}
            onChange={(e) => { onUpdateSettings({ ...settings, facebookUrl: e.target.value }); setValidationErrors(prev => ({ ...prev, facebookUrl: '' })); }}
          />
          {validationErrors.facebookUrl && <p className="text-xs text-red-600 mt-1">{validationErrors.facebookUrl}</p>}
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">Instagram URL</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="https://instagram.com/..."
            value={settings.instagramUrl ?? ''}
            maxLength={2000}
            onChange={(e) => { onUpdateSettings({ ...settings, instagramUrl: e.target.value }); setValidationErrors(prev => ({ ...prev, instagramUrl: '' })); }}
          />
          {validationErrors.instagramUrl && <p className="text-xs text-red-600 mt-1">{validationErrors.instagramUrl}</p>}
        </div>
        <div className="space-y-4">
          <label className="block text-base font-bold text-slate-900">YouTube URL</label>
          <input
            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-slate-900 placeholder:text-slate-400"
            placeholder="https://youtube.com/..."
            value={settings.youtubeUrl ?? ''}
            maxLength={2000}
            onChange={(e) => { onUpdateSettings({ ...settings, youtubeUrl: e.target.value }); setValidationErrors(prev => ({ ...prev, youtubeUrl: '' })); }}
          />
          {validationErrors.youtubeUrl && <p className="text-xs text-red-600 mt-1">{validationErrors.youtubeUrl}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {feedback && (
          <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">Settings saved</span>
        )}
        <button
          onClick={() => {
            if (!validateBeforeApply()) return;
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
