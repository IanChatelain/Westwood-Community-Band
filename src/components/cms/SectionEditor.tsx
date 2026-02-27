'use client';

import React, { useState, useRef } from 'react';
import type { PageSection, PageSectionType } from '@/types';
import { ChevronUp, ChevronDown, Trash2, Plus, Upload, X } from 'lucide-react';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { uploadImage } from '@/app/actions/upload';

const SECTION_TYPE_OPTIONS: { value: PageSectionType; label: string }[] = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'text', label: 'Text' },
  { value: 'image-text', label: 'Image + Text' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'contact', label: 'Contact Form' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'table', label: 'Table' },
  { value: 'separator', label: 'Divider' },
];

const SECTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

const DEFAULT_HEIGHTS: Partial<Record<PageSectionType, number>> = {
  hero: 260,
};

function ImageUploadField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadImage(fd);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        onChange(result.url);
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image</label>
      {value && (
        <div className="relative mb-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-24 object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-slate-600 hover:text-red-600 shadow-sm"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        <Upload size={13} />
        {uploading ? 'Uploading...' : value ? 'Replace image' : 'Upload image'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface SectionEditorProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

export function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(sections[0]?.id ?? null);
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  const addSection = (type: PageSectionType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const label = SECTION_TYPE_LABELS[type] ?? type;
    const newSection: PageSection = {
      id,
      type,
      title: label,
      content: '',
    };
    onChange([...sections, newSection]);
    setExpandedId(id);
    setShowAddMenu(false);
  };

  const removeSection = (id: string) => {
    const next = sections.filter((s) => s.id !== id);
    if (expandedId === id) {
      setExpandedId(next[0]?.id ?? null);
    }
    onChange(next);
  };

  const inputClass =
    'w-full p-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Page sections
        </h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1">
                {SECTION_TYPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => addSection(value)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Edit content below. Changes appear in the preview. Use arrows to reorder.
      </p>
      {sections.map((section, index) => {
        const isExpanded = expandedId === section.id;
        const displayTitle = section.title || 'Untitled';
        const typeLabel = SECTION_TYPE_LABELS[section.type] ?? section.type;
        const defaultH = DEFAULT_HEIGHTS[section.type] ?? 0;
        const currentH = section.minHeight ?? defaultH;

        return (
          <div
            key={section.id}
            className="border border-slate-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : section.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate">
                  {displayTitle}
                </span>
                <span className="text-[11px] text-slate-400 flex-shrink-0">
                  ({typeLabel})
                </span>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id);
                  }}
                  className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                  aria-label="Remove section"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </button>
            {isExpanded && (
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
                {section.type !== 'gallery' && section.type !== 'separator' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Content
                    </label>
                    <RichTextEditor
                      value={section.content}
                      onChange={(html) => updateSection(section.id, { content: html })}
                    />
                  </div>
                )}
                {(section.type === 'hero' || section.type === 'image-text') && (
                  <ImageUploadField
                    value={section.imageUrl}
                    onChange={(url) => updateSection(section.id, { imageUrl: url })}
                  />
                )}
                {section.type === 'gallery' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Gallery items (one per line)
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

                {/* Size controls */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Size</p>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-600 w-16 flex-shrink-0">Height</label>
                    <input
                      type="range"
                      min={section.type === 'hero' ? '80' : '0'}
                      max="800"
                      step="10"
                      value={currentH}
                      onChange={(e) => updateSection(section.id, { minHeight: parseInt(e.target.value) || 0 })}
                      className="flex-1 h-1.5 bg-slate-200 rounded accent-red-600"
                    />
                    <span className="text-xs text-slate-500 w-14 text-right tabular-nums">
                      {currentH === 0 ? 'Auto' : `${currentH}px`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-600 w-16 flex-shrink-0">Width</label>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      step="5"
                      value={section.maxWidth ?? 100}
                      onChange={(e) => updateSection(section.id, { maxWidth: parseInt(e.target.value) })}
                      className="flex-1 h-1.5 bg-slate-200 rounded accent-red-600"
                    />
                    <span className="text-xs text-slate-500 w-14 text-right tabular-nums">
                      {section.maxWidth ?? 100}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No sections yet. Click <strong>Add</strong> to get started.
        </div>
      )}
    </div>
  );
}
