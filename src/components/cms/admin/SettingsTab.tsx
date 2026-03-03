'use client';

import React, { useState } from 'react';
import { SiteSettings, SidebarBlock, SidebarBlockType, SidebarFeeItem } from '@/types';
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';

interface SettingsTabProps {
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => void;
  onApply: () => void;
}

const SIDEBAR_BLOCK_TYPES: { value: SidebarBlockType; label: string }[] = [
  { value: 'rehearsals', label: 'Rehearsals' },
  { value: 'fees', label: 'Fees' },
  { value: 'contact', label: 'Contact' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_SIDEBAR_FEE_ITEMS: SidebarFeeItem[] = [
  { label: 'Annual Fee', amount: '$100.00' },
  { label: 'Students', amount: '$50.00' },
  { label: 'Polo Shirt', amount: '$15.00' },
];

export default function SettingsTab({ settings, onUpdateSettings, onApply }: SettingsTabProps) {
  const [feedback, setFeedback] = useState(false);

  const sidebarBlocks: SidebarBlock[] = settings.globalSidebarBlocks !== undefined
    ? settings.globalSidebarBlocks
    : [...DEFAULT_SIDEBAR_BLOCKS];

  const setSidebarBlocks = (blocks: SidebarBlock[]) => {
    onUpdateSettings({ ...settings, globalSidebarBlocks: blocks });
  };

  const addSidebarBlock = (type: SidebarBlockType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newBlock: SidebarBlock = {
      id,
      type,
      order: sidebarBlocks.length,
      title: type === 'custom' ? 'Custom' : undefined,
      content: '',
    };
    setSidebarBlocks([...sidebarBlocks, newBlock]);
  };

  const removeSidebarBlock = (id: string) => {
    setSidebarBlocks(sidebarBlocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  };

  const updateSidebarBlock = (id: string, updates: Partial<SidebarBlock>) => {
    setSidebarBlocks(sidebarBlocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
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

      {/* Global Sidebar Editor */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-6 space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Global sidebar</p>
          <h3 className="text-base font-bold text-slate-900">Global Sidebar Content</h3>
          <p className="text-sm text-slate-600 mt-1">
            These blocks appear in the sidebar on every page that uses a sidebar layout. Remove all blocks to hide the sidebar and let content fill the full width.
          </p>
        </div>

        <div className="space-y-5 pt-1">
            <div className="space-y-4">
              {[...sidebarBlocks].sort((a, b) => a.order - b.order).map((block) => {
                const isRehearsals = block.type === 'rehearsals';
                const isFees = block.type === 'fees';
                const isContact = block.type === 'contact';
                const isCustom = block.type === 'custom';

                const effectiveFeeItems =
                  isFees && block.feeItems && block.feeItems.length > 0
                    ? block.feeItems
                    : isFees
                      ? DEFAULT_SIDEBAR_FEE_ITEMS
                      : [];

                return (
                  <div key={block.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700 capitalize">{block.type}</span>
                      <button
                        onClick={() => removeSidebarBlock(block.id)}
                        className="text-slate-500 hover:text-red-800 text-base leading-none transition-colors"
                      >
                        &times;
                      </button>
                    </div>

                    {isRehearsals && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.title ?? 'Rehearsals'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Rehearsals)"
                        />
                        <input
                          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.day ?? 'Thursday Evenings'}
                          onChange={(e) => updateSidebarBlock(block.id, { day: e.target.value })}
                          placeholder="Day (e.g. Thursday Evenings)"
                        />
                        <input
                          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.time ?? '7:15 to 9:15 p.m.'}
                          onChange={(e) => updateSidebarBlock(block.id, { time: e.target.value })}
                          placeholder="Time (e.g. 7:15 to 9:15 p.m.)"
                        />
                        <input
                          className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.venueName ?? 'The Band Room'}
                          onChange={(e) => updateSidebarBlock(block.id, { venueName: e.target.value })}
                          placeholder="Venue (e.g. The Band Room)"
                        />
                        <input
                          className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.addressLine1 ?? 'John Taylor Collegiate'}
                          onChange={(e) => updateSidebarBlock(block.id, { addressLine1: e.target.value })}
                          placeholder="Address line 1 (e.g. John Taylor Collegiate)"
                        />
                        <input
                          className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.addressLine2 ?? '470 Hamilton Avenue, Winnipeg, Manitoba'}
                          onChange={(e) => updateSidebarBlock(block.id, { addressLine2: e.target.value })}
                          placeholder="Address line 2 (e.g. 470 Hamilton Ave, Winnipeg)"
                        />
                        <input
                          className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={
                            block.mapUrl ?? 'https://maps.google.ca/maps?q=470+Hamilton+Avenue,+Winnipeg,+MB'
                          }
                          onChange={(e) => updateSidebarBlock(block.id, { mapUrl: e.target.value })}
                          placeholder="Map / directions URL"
                        />
                      </div>
                    )}

                    {isFees && (
                      <div className="space-y-3">
                        <input
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.title ?? 'Membership Fees'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Membership Fees)"
                        />
                        <input
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.seasonLabel ?? 'Band Season: September to June'}
                          onChange={(e) => updateSidebarBlock(block.id, { seasonLabel: e.target.value })}
                          placeholder="Season note (e.g. Band Season: September to June)"
                        />
                        <div className="space-y-2">
                          <span className="block text-xs font-semibold text-slate-600">Fee items</span>
                          {effectiveFeeItems.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                className="flex-1 min-w-0 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                                value={item.label}
                                onChange={(e) => {
                                  const items = [...effectiveFeeItems];
                                  items[idx] = { ...items[idx], label: e.target.value };
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                                placeholder="Label"
                              />
                              <input
                                className="w-24 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                                value={item.amount}
                                onChange={(e) => {
                                  const items = [...effectiveFeeItems];
                                  items[idx] = { ...items[idx], amount: e.target.value };
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                                placeholder="Amount"
                              />
                              <button
                                className="text-slate-500 hover:text-red-800 px-2 transition-colors"
                                onClick={() => {
                                  const items = effectiveFeeItems.filter((_, i) => i !== idx);
                                  updateSidebarBlock(block.id, { feeItems: items });
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <button
                            className="text-sm text-slate-600 hover:text-red-800 border border-slate-200 rounded-lg px-3 py-2 hover:border-red-800/40 transition-colors"
                            onClick={() => {
                              const items: SidebarFeeItem[] = [...effectiveFeeItems, { label: '', amount: '' }];
                              updateSidebarBlock(block.id, { feeItems: items });
                            }}
                          >
                            + Add fee
                          </button>
                        </div>
                      </div>
                    )}

                    {isContact && (
                      <div className="space-y-3">
                        <input
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.title ?? 'Contact'}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title (e.g. Contact)"
                        />
                        <textarea
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 resize-y"
                          rows={2}
                          value={block.body ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { body: e.target.value })}
                          placeholder="Body text above the button"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                            value={block.linkLabel ?? 'Get in Touch'}
                            onChange={(e) => updateSidebarBlock(block.id, { linkLabel: e.target.value })}
                            placeholder="Button label (e.g. Get in Touch)"
                          />
                          <input
                            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                            value={block.href ?? '/contact'}
                            onChange={(e) => updateSidebarBlock(block.id, { href: e.target.value })}
                            placeholder="Button link (e.g. /contact)"
                          />
                        </div>
                      </div>
                    )}

                    {isCustom && (
                      <div className="space-y-3">
                        <input
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={block.title ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                          placeholder="Title"
                        />
                        <textarea
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 resize-y"
                          rows={3}
                          value={block.content ?? ''}
                          onChange={(e) => updateSidebarBlock(block.id, { content: e.target.value })}
                          placeholder="Content"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {SIDEBAR_BLOCK_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => addSidebarBlock(value)}
                  className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-red-800/40 hover:text-red-800 transition-colors"
                >
                  + {label}
                </button>
              ))}
            </div>
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
