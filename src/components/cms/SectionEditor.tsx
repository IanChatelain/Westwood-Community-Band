'use client';

import React, { useState, useRef } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageSection, PageSectionType } from '@/types';
import { ChevronDown, Trash2, Plus, Upload, X } from 'lucide-react';
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

interface SortableSectionItemProps {
  section: PageSection;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<PageSection>) => void;
  onRemove: () => void;
  inputClass: string;
}

function SortableSectionItem({
  section,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  inputClass,
}: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { index },
  });

  const style: React.CSSProperties = {
    // Constrain drag feedback to vertical movement only
    transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  const displayTitle = section.title || 'Untitled';
  const typeLabel = SECTION_TYPE_LABELS[section.type] ?? section.type;
  const defaultH = DEFAULT_HEIGHTS[section.type] ?? 0;
  const currentH = section.minHeight ?? defaultH;
  const panelId = `${section.id}-panel`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-slate-200 rounded-lg overflow-hidden bg-white"
      role="listitem"
      aria-label={`${displayTitle} (${typeLabel}) section`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50"
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="shrink-0 px-2 py-1 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-md bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-grab"
            {...listeners}
            {...attributes}
            aria-label={`Drag ${displayTitle} section to reorder`}
          >
            Drag
          </button>
          <span className="text-sm font-medium text-slate-800 truncate">
            {displayTitle}
          </span>
          <span className="text-[11px] text-slate-400 flex-shrink-0">
            ({typeLabel})
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <ChevronDown size={14} />
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
            aria-label={`Remove ${displayTitle} section`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </button>
      {isExpanded && (
        <div
          id={panelId}
          role="region"
          aria-label={`${displayTitle} section settings`}
          className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-100"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Title
            </label>
            <input
              type="text"
              className={inputClass}
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
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
                onChange={(html) => onUpdate({ content: html })}
              />
            </div>
          )}
          {(section.type === 'hero' || section.type === 'image-text') && (
            <ImageUploadField
              value={section.imageUrl}
              onChange={(url) => onUpdate({ imageUrl: url })}
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
                  onUpdate({
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
                onChange={(e) =>
                  onUpdate({ minHeight: parseInt(e.target.value, 10) || 0 })
                }
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
                onChange={(e) =>
                  onUpdate({ maxWidth: parseInt(e.target.value, 10) })
                }
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
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateSection = (id: string, updates: Partial<PageSection>) => {
    onChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
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
      setExpandedId(null);
    }
    onChange(next);
  };

  const inputClass =
    'w-full p-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...sections];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onChange(next);
  };

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
        Edit content below. Changes appear in the preview. Click a section header to expand or collapse its settings, and
        use the drag handle to reorder sections.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              return `Picked up section ${String(active.id)}. Use arrow keys to move, then release to drop.`;
            },
            onDragOver({ over }) {
              if (!over) return 'Section is no longer over a valid drop area.';
              return 'Section moved. Release to place.';
            },
            onDragEnd({ active, over }) {
              if (!over) return 'Section was dropped but no position was found.';
              if (active.id === over.id) return 'Section position unchanged.';
              return 'Section moved to new position.';
            },
            onDragCancel() {
              return 'Reordering cancelled. Section returned to its original position.';
            },
          },
        }}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2" role="list" aria-label="Page sections list">
            {sections.map((section, index) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                index={index}
                isExpanded={expandedId === section.id}
                onToggleExpand={() =>
                  setExpandedId((current) => (current === section.id ? null : section.id))
                }
                onUpdate={(updates) => updateSection(section.id, updates)}
                onRemove={() => removeSection(section.id)}
                inputClass={inputClass}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No sections yet. Click <strong>Add</strong> to get started.
        </div>
      )}
    </div>
  );
}
