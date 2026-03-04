'use client';

import React from 'react';
import { SidebarBlock, SidebarBlockType, SidebarFeeItem } from '@/types';

interface GlobalSidebarEditorProps {
  blocks: SidebarBlock[];
  onChange: (blocks: SidebarBlock[]) => void;
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
  { label: 'Polo Shirt', amount: '$25.00' },
];

export default function GlobalSidebarEditor({ blocks, onChange }: GlobalSidebarEditorProps) {
  const addBlock = (type: SidebarBlockType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newBlock: SidebarBlock = {
      id,
      type,
      order: blocks.length,
      title: type === 'custom' ? 'Custom' : undefined,
      content: '',
    };
    onChange([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  };

  const updateBlock = (id: string, updates: Partial<SidebarBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {[...blocks].sort((a, b) => a.order - b.order).map((block) => {
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
                  onClick={() => removeBlock(block.id)}
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
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Title (e.g. Rehearsals)"
                  />
                  <input
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.day ?? 'Thursday Evenings'}
                    onChange={(e) => updateBlock(block.id, { day: e.target.value })}
                    placeholder="Day (e.g. Thursday Evenings)"
                  />
                  <input
                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.time ?? '7:15 to 9:15 p.m.'}
                    onChange={(e) => updateBlock(block.id, { time: e.target.value })}
                    placeholder="Time (e.g. 7:15 to 9:15 p.m.)"
                  />
                  <input
                    className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.venueName ?? 'The Band Room'}
                    onChange={(e) => updateBlock(block.id, { venueName: e.target.value })}
                    placeholder="Venue (e.g. The Band Room)"
                  />
                  <input
                    className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.addressLine1 ?? 'John Taylor Collegiate'}
                    onChange={(e) => updateBlock(block.id, { addressLine1: e.target.value })}
                    placeholder="Address line 1 (e.g. John Taylor Collegiate)"
                  />
                  <input
                    className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.addressLine2 ?? '470 Hamilton Avenue, Winnipeg, Manitoba'}
                    onChange={(e) => updateBlock(block.id, { addressLine2: e.target.value })}
                    placeholder="Address line 2 (e.g. 470 Hamilton Ave, Winnipeg)"
                  />
                  <input
                    className="col-span-2 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={
                      block.mapUrl ?? 'https://maps.google.ca/maps?q=470+Hamilton+Avenue,+Winnipeg,+MB'
                    }
                    onChange={(e) => updateBlock(block.id, { mapUrl: e.target.value })}
                    placeholder="Map / directions URL"
                  />
                </div>
              )}

              {isFees && (
                <div className="space-y-3">
                  <input
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.title ?? 'Membership Fees'}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Title (e.g. Membership Fees)"
                  />
                  <input
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                    value={block.seasonLabel ?? 'Band Season: September to June'}
                    onChange={(e) => updateBlock(block.id, { seasonLabel: e.target.value })}
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
                            updateBlock(block.id, { feeItems: items });
                          }}
                          placeholder="Label"
                        />
                        <input
                          className="w-24 p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                          value={item.amount}
                          onChange={(e) => {
                            const items = [...effectiveFeeItems];
                            items[idx] = { ...items[idx], amount: e.target.value };
                            updateBlock(block.id, { feeItems: items });
                          }}
                          placeholder="Amount"
                        />
                        <button
                          className="text-slate-500 hover:text-red-800 px-2 transition-colors"
                          onClick={() => {
                            const items = effectiveFeeItems.filter((_, i) => i !== idx);
                            updateBlock(block.id, { feeItems: items });
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
                        updateBlock(block.id, { feeItems: items });
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
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Title (e.g. Contact)"
                  />
                  <textarea
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 resize-y"
                    rows={2}
                    value={block.body ?? ''}
                    onChange={(e) => updateBlock(block.id, { body: e.target.value })}
                    placeholder="Body text above the button"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                      value={block.linkLabel ?? 'Get in Touch'}
                      onChange={(e) => updateBlock(block.id, { linkLabel: e.target.value })}
                      placeholder="Button label (e.g. Get in Touch)"
                    />
                    <input
                      className="p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400"
                      value={block.href ?? '/contact'}
                      onChange={(e) => updateBlock(block.id, { href: e.target.value })}
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
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                  <textarea
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none placeholder:text-slate-400 resize-y"
                    rows={3}
                    value={block.content ?? ''}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
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
            onClick={() => addBlock(value)}
            className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-red-800/40 hover:text-red-800 transition-colors"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}
