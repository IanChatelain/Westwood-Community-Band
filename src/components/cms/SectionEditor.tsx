'use client';

import React, { useState } from 'react';
import type { PageSection } from '@/types';
import { ChevronUp, ChevronDown } from 'lucide-react';

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero banner',
  text: 'Text',
  'image-text': 'Image + text',
  gallery: 'Gallery',
  contact: 'Contact form',
  schedule: 'Schedule',
  table: 'Table',
  separator: 'Divider',
};

interface SectionEditorProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

export function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(sections[0]?.id ?? null);

  const updateSection = (id: string, updates: Partial<PageSection>) => {
    onChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const inputClass =
    'w-full p-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
        Page sections
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Edit content below. Changes appear in the preview. Use arrows to reorder.
      </p>
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="border border-slate-200 rounded-lg overflow-hidden bg-white"
        >
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
          >
            <span className="text-sm font-medium text-slate-800">
              {SECTION_TYPE_LABELS[section.type] ?? section.type}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, 'up');
                }}
                disabled={index === 0}
                className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                aria-label="Move up"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, 'down');
                }}
                disabled={index === sections.length - 1}
                className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                aria-label="Move down"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </button>
          {expandedId === section.id && (
            <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  placeholder="Section title"
                />
              </div>
              {section.type !== 'gallery' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Content
                  </label>
                  <textarea
                    rows={4}
                    className={inputClass}
                    value={section.content}
                    onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    placeholder="Section content"
                  />
                </div>
              )}
              {(section.type === 'hero' || section.type === 'image-text') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={section.imageUrl ?? ''}
                    onChange={(e) => updateSection(section.id, { imageUrl: e.target.value || undefined })}
                    placeholder="/images/example.jpg"
                  />
                </div>
              )}
              {section.type === 'gallery' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Gallery items (one per line, use • in content)
                  </label>
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={(section.content || '').replace(/ • /g, '\n')}
                    onChange={(e) =>
                      updateSection(section.id, {
                        content: e.target.value.split('\n').filter(Boolean).join(' • '),
                      })
                    }
                    placeholder="Item 1&#10;Item 2"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
