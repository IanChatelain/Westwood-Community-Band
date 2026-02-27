'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import type { PageSection, PageSectionType, PageConfig, GalleryEvent, GalleryMediaItem, DownloadItem, DownloadGroup, DownloadLink, PerformanceItem } from '@/types';
import { ChevronDown, ChevronRight, Trash2, Plus, Upload, X, GripVertical, Image as ImageIcon, Video, ArrowRightLeft, HelpCircle } from 'lucide-react';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { uploadImage, uploadRecording, uploadDocument } from '@/app/actions/upload';

const SECTION_TYPE_OPTIONS: { value: PageSectionType; label: string }[] = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'text', label: 'Text' },
  { value: 'image-text', label: 'Image + Text' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'contact', label: 'Contact Form' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'performances', label: 'Performances' },
  { value: 'table', label: 'Table' },
  { value: 'separator', label: 'Divider' },
  { value: 'downloads', label: 'Downloads / Link List' },
];

const SECTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

const DEFAULT_HEIGHTS: Partial<Record<PageSectionType, number>> = {
  hero: 260,
  text: 220,
  'image-text': 240,
  gallery: 240,
  contact: 260,
  schedule: 260,
  performances: 260,
  table: 220,
  downloads: 220,
};

const MOVE_DROPDOWN_PANEL_ID = 'move-section-dropdown-panel';
const PANEL_MAX_HEIGHT = 320;
const GAP = 4;

function MoveSectionDropdown({
  sectionId,
  sectionTitle,
  pages,
  onMove,
}: {
  sectionId: string;
  sectionTitle: string;
  pages: { id: string; title: string }[];
  onMove: (sectionId: string, targetPageId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    const openDown = spaceBelow >= Math.min(PANEL_MAX_HEIGHT, spaceAbove) || spaceBelow >= spaceAbove;
    if (openDown) {
      setPosition({
        top: rect.bottom + GAP,
        right: window.innerWidth - rect.right,
      });
    } else {
      setPosition({
        bottom: window.innerHeight - rect.top + GAP,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  const panelContent =
    open && position ? (
      <div
        id={MOVE_DROPDOWN_PANEL_ID}
        className="fixed z-40 w-52 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1"
        style={{
          ...(position.top != null ? { top: position.top } : {}),
          ...(position.bottom != null ? { bottom: position.bottom } : {}),
          right: position.right,
        }}
      >
        <p className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase">Move to page</p>
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove(sectionId, p.id);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            {p.title}
          </button>
        ))}
        {pages.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-400">No other pages available.</p>
        )}
      </div>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
        aria-label={`Move ${sectionTitle} to another page`}
        title="Move to another page"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? MOVE_DROPDOWN_PANEL_ID : undefined}
      >
        <ArrowRightLeft size={14} />
      </button>
      {open && (
        <div className="fixed inset-0 z-30" aria-hidden onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
      )}
      {open && panelContent && createPortal(panelContent, document.body)}
    </div>
  );
}

const SECTION_HELP_ID = 'section-help-tooltip';

function SectionHelpTooltip() {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setVisible(true);
  };
  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 150);
  };

  useEffect(() => {
    if (!visible || !triggerRef.current) { setPos(null); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisible(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  const bubble = visible && pos ? createPortal(
    <div
      id={SECTION_HELP_ID}
      role="tooltip"
      className="fixed z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-3"
      style={{ top: pos.top, left: Math.min(pos.left, window.innerWidth - 340) }}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Section controls</p>

      {/* Mock row */}
      <div className="border border-slate-200 rounded-lg bg-white pointer-events-none">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-2 py-1 text-[10px] font-semibold text-slate-600 border border-slate-200 rounded-md bg-slate-50">
              Drag
            </span>
            <span className="text-sm font-medium text-slate-800">Example Section</span>
            <span className="text-[11px] text-slate-400">(Text)</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <span className="text-slate-400"><ChevronDown size={14} /></span>
            <span className="p-1 text-slate-400"><ArrowRightLeft size={14} /></span>
            <span className="p-1 text-red-400"><Trash2 size={14} /></span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <ul className="space-y-1.5 text-xs text-slate-600">
        <li className="flex items-start gap-2">
          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 border border-slate-200 rounded bg-slate-50 mt-px">Drag</span>
          <span>Click and drag to reorder sections.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 text-slate-500"><ChevronDown size={13} /></span>
          <span>Click the row to expand or collapse settings.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 text-slate-500"><ArrowRightLeft size={13} /></span>
          <span>Move section to a different page.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 text-red-400"><Trash2 size={13} /></span>
          <span>Delete the section.</span>
        </li>
      </ul>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Page section controls help"
        aria-describedby={visible ? SECTION_HELP_ID : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
      >
        <HelpCircle size={14} />
      </button>
      {bubble}
    </>
  );
}

interface SortableSectionItemProps {
  section: PageSection;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<PageSection>) => void;
  onRemove: () => void;
  inputClass: string;
  otherPages?: { id: string; title: string }[];
  onMoveToPage?: (sectionId: string, targetPageId: string) => void;
}

function SortableSectionItem({
  section,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  inputClass,
  otherPages,
  onMoveToPage,
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
          {otherPages && otherPages.length > 0 && onMoveToPage && (
            <MoveSectionDropdown
              sectionId={section.id}
              sectionTitle={displayTitle}
              pages={otherPages}
              onMove={onMoveToPage}
            />
          )}
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
              Section type
            </label>
            <select
              className={inputClass}
              value={section.type}
              onChange={(e) => {
                const newType = e.target.value as PageSectionType;
                const oldDefault = DEFAULT_HEIGHTS[section.type];
                const newDefault = DEFAULT_HEIGHTS[newType];
                const heightMatchesOldDefault =
                  section.minHeight != null && oldDefault != null && section.minHeight === oldDefault;
                const updates: Partial<PageSection> = { type: newType };
                if (heightMatchesOldDefault && newDefault != null) {
                  updates.minHeight = newDefault;
                } else if (heightMatchesOldDefault && newDefault == null) {
                  updates.minHeight = undefined;
                }
                onUpdate(updates);
              }}
            >
              {SECTION_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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
            <>
              <div className="space-y-3 pb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Gallery Layout</p>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-28 flex-shrink-0">Cards per row</label>
                  <select
                    className={inputClass}
                    value={section.galleryColumns ?? 3}
                    onChange={(e) => onUpdate({ galleryColumns: parseInt(e.target.value, 10) as 2 | 3 | 4 })}
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-28 flex-shrink-0">Card size</label>
                  <select
                    className={inputClass}
                    value={section.galleryCardSize ?? 'md'}
                    onChange={(e) => onUpdate({ galleryCardSize: e.target.value as 'sm' | 'md' | 'lg' })}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-28 flex-shrink-0">Thumbnail shape</label>
                  <div className="flex gap-2">
                    {(['landscape', 'square'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onUpdate({ galleryThumbnailAspect: opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          (section.galleryThumbnailAspect ?? 'landscape') === opt
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {opt === 'landscape' ? 'Landscape (4:3)' : 'Square (1:1)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-28 flex-shrink-0">Show description</label>
                  <button
                    type="button"
                    onClick={() => onUpdate({ galleryShowDescription: !(section.galleryShowDescription ?? true) })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      (section.galleryShowDescription ?? true) ? 'bg-red-600' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={section.galleryShowDescription ?? true}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                        (section.galleryShowDescription ?? true) ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <GalleryEventsEditor
                events={section.galleryEvents ?? []}
                onChange={(galleryEvents) => onUpdate({ galleryEvents })}
                inputClass={inputClass}
              />
            </>
          )}

          {section.type === 'performances' && (
            <PerformancesEditor
              items={section.performanceItems ?? []}
              onChange={(performanceItems) => onUpdate({ performanceItems })}
              inputClass={inputClass}
            />
          )}

          {section.type === 'downloads' && (
            <DownloadsEditor
              section={section}
              onUpdate={onUpdate}
              inputClass={inputClass}
            />
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function GalleryEventsEditor({
  events,
  onChange,
  inputClass,
}: {
  events: GalleryEvent[];
  onChange: (events: GalleryEvent[]) => void;
  inputClass: string;
}) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const addEvent = () => {
    const id = Math.random().toString(36).substring(2, 11);
    const newEvent: GalleryEvent = { id, title: 'New Event', slug: 'new-event', media: [] };
    onChange([...events, newEvent]);
    setExpandedEventId(id);
  };

  const updateEvent = (id: string, updates: Partial<GalleryEvent>) => {
    onChange(events.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
  };

  const removeEvent = (id: string) => {
    onChange(events.filter((ev) => ev.id !== id));
    if (expandedEventId === id) setExpandedEventId(null);
  };

  const moveEvent = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= events.length) return;
    const next = [...events];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Gallery Events</label>
        <button type="button" onClick={addEvent} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
          <Plus size={11} /> Add Event
        </button>
      </div>
      {events.length === 0 && (
        <p className="text-xs text-slate-400 py-2">No events yet. Click &quot;Add Event&quot; to create one.</p>
      )}
      {events.map((ev, idx) => {
        const isOpen = expandedEventId === ev.id;
        return (
          <div key={ev.id} className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedEventId(isOpen ? null : ev.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {ev.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.coverImageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <span className="text-xs font-medium text-slate-800 truncate">{ev.title || 'Untitled'}</span>
                <span className="text-[10px] text-slate-400">({ev.media.length} items)</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); moveEvent(idx, -1); }} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30" aria-label="Move up">&#9650;</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveEvent(idx, 1); }} disabled={idx === events.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30" aria-label="Move down">&#9660;</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove event">
                  <Trash2 size={12} />
                </button>
              </div>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Title</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={ev.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const updates: Partial<GalleryEvent> = { title };
                      if (ev.slug === slugify(ev.title) || !ev.slug || ev.slug === 'new-event') {
                        updates.slug = slugify(title);
                      }
                      updateEvent(ev.id, updates);
                    }}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Slug</label>
                  <input type="text" className={inputClass} value={ev.slug} onChange={(e) => updateEvent(ev.id, { slug: slugify(e.target.value) })} placeholder="event-slug" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Description</label>
                  <textarea rows={2} className={inputClass} value={ev.description ?? ''} onChange={(e) => updateEvent(ev.id, { description: e.target.value })} placeholder="Optional description" />
                </div>
                <ImageUploadField value={ev.coverImageUrl} onChange={(url) => updateEvent(ev.id, { coverImageUrl: url })} label="Cover Image" />
                <GalleryMediaEditor
                  items={ev.media}
                  onChange={(media) => updateEvent(ev.id, { media })}
                  inputClass={inputClass}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GalleryMediaEditor({
  items,
  onChange,
  inputClass,
}: {
  items: GalleryMediaItem[];
  onChange: (items: GalleryMediaItem[]) => void;
  inputClass: string;
}) {
  const addItem = (type: 'image' | 'video') => {
    const id = Math.random().toString(36).substring(2, 11);
    onChange([...items, { id, type, url: '', caption: '' }]);
  };

  const updateItem = (id: string, updates: Partial<GalleryMediaItem>) => {
    onChange(items.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((m) => m.id !== id));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Media Items</label>
        <div className="flex gap-1">
          <button type="button" onClick={() => addItem('image')} className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 transition-colors">
            <ImageIcon size={10} /> Image
          </button>
          <button type="button" onClick={() => addItem('video')} className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 transition-colors">
            <Video size={10} /> Video
          </button>
        </div>
      </div>
      {items.length === 0 && (
        <p className="text-[10px] text-slate-400">No media yet.</p>
      )}
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white">
          <div className="flex flex-col gap-0.5 pt-1">
            <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-[8px]" aria-label="Move up">&#9650;</button>
            <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-[8px]" aria-label="Move down">&#9660;</button>
          </div>
          {item.type === 'image' && item.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
          )}
          {item.type === 'video' && (
            <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Video size={16} className="text-slate-400" />
            </div>
          )}
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase text-slate-400">{item.type}</span>
            </div>
            {item.type === 'image' ? (
              <ImageUploadField
                value={item.url || undefined}
                onChange={(url) => updateItem(item.id, { url: url ?? '' })}
                label="Image"
                compact
              />
            ) : (
              <input
                type="url"
                className={inputClass}
                value={item.url}
                onChange={(e) => updateItem(item.id, { url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            )}
            <input
              type="text"
              className={inputClass}
              value={item.caption ?? ''}
              onChange={(e) => updateItem(item.id, { caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          </div>
          <button type="button" onClick={() => removeItem(item.id)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0" aria-label="Remove media item">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function PerformancesEditor({
  items,
  onChange,
  inputClass,
}: {
  items: PerformanceItem[];
  onChange: (items: PerformanceItem[]) => void;
  inputClass: string;
}) {
  const addItem = () => {
    const id = Math.random().toString(36).substring(2, 11);
    onChange([...items, { id, date: '', title: 'New Performance', venue: '', time: '', description: '' }]);
  };
  const updateItem = (idx: number, updates: Partial<PerformanceItem>) => {
    onChange(items.map((it, i) => i === idx ? { ...it, ...updates } : it));
  };
  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };
  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Performance Items</label>
        <button type="button" onClick={addItem} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
          <Plus size={11} /> Add Performance
        </button>
      </div>
      {items.length === 0 && <p className="text-xs text-slate-400 py-1">No performances yet.</p>}
      {items.map((item, idx) => (
        <div key={item.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1.5">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-1">
              <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-[8px]" aria-label="Move up">&#9650;</button>
              <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-[8px]" aria-label="Move down">&#9660;</button>
            </div>
            <div className="flex-1 space-y-1.5">
              <input type="text" className={inputClass} value={item.title} onChange={(e) => updateItem(idx, { title: e.target.value })} placeholder="Performance title" />
              <div className="flex gap-2">
                <input type="text" className={inputClass} value={item.date} onChange={(e) => updateItem(idx, { date: e.target.value })} placeholder="Date (e.g. March 15, 2025)" />
                <input type="text" className={inputClass} value={item.time ?? ''} onChange={(e) => updateItem(idx, { time: e.target.value })} placeholder="Time (e.g. 7:00 PM)" />
              </div>
              <input type="text" className={inputClass} value={item.venue ?? ''} onChange={(e) => updateItem(idx, { venue: e.target.value })} placeholder="Venue" />
              <input type="text" className={inputClass} value={item.description ?? ''} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="Description (optional)" />
            </div>
            <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0" aria-label="Remove performance">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getAudioDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const secs = Math.round(audio.duration);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      URL.revokeObjectURL(url);
      resolve(`${m}:${s.toString().padStart(2, '0')}`);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
  });
}

function DownloadItemUploadButton({
  idx,
  onUploaded,
}: {
  idx: number;
  onUploaded: (idx: number, updates: Partial<DownloadItem>) => void;
}) {
  const audioRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudio = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const duration = await getAudioDuration(file);
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadRecording(fd);
      if (result.error) { setError(result.error); }
      else if (result.url) {
        onUploaded(idx, {
          url: result.url,
          fileSize: result.fileSize ?? undefined,
          ...(duration ? { duration } : {}),
        });
      }
    } catch { setError('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDoc = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadDocument(fd);
      if (result.error) { setError(result.error); }
      else if (result.url) {
        onUploaded(idx, {
          url: result.url,
          fileSize: result.fileSize ?? undefined,
        });
      }
    } catch { setError('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudio(f); e.target.value = ''; }} />
      <input ref={docRef} type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.html,.txt,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDoc(f); e.target.value = ''; }} />
      <button type="button" disabled={uploading} onClick={() => audioRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 disabled:opacity-50 transition-colors">
        <Upload size={10} /> {uploading ? 'Uploading...' : 'Audio'}
      </button>
      <button type="button" disabled={uploading} onClick={() => docRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 disabled:opacity-50 transition-colors">
        <Upload size={10} /> {uploading ? 'Uploading...' : 'Document'}
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}

function DownloadsEditor({
  section,
  onUpdate,
  inputClass,
}: {
  section: PageSection;
  onUpdate: (updates: Partial<PageSection>) => void;
  inputClass: string;
}) {
  const [mode, setMode] = useState<'flat' | 'grouped'>(
    (section.downloadGroups && section.downloadGroups.length > 0) ? 'grouped' : 'flat'
  );

  const items = section.downloadItems ?? [];
  const groups = section.downloadGroups ?? [];

  const addItem = () => {
    onUpdate({ downloadItems: [...items, { label: 'New item', url: '#' }] });
  };
  const updateItem = (idx: number, updates: Partial<DownloadItem>) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...updates } : it);
    onUpdate({ downloadItems: next });
  };
  const removeItem = (idx: number) => {
    onUpdate({ downloadItems: items.filter((_, i) => i !== idx) });
  };

  const addGroup = () => {
    onUpdate({ downloadGroups: [...groups, { title: 'New Group', items: [] }] });
  };
  const updateGroup = (idx: number, updates: Partial<DownloadGroup>) => {
    const next = groups.map((g, i) => i === idx ? { ...g, ...updates } : g);
    onUpdate({ downloadGroups: next });
  };
  const removeGroup = (idx: number) => {
    onUpdate({ downloadGroups: groups.filter((_, i) => i !== idx) });
  };
  const addGroupItem = (gIdx: number) => {
    const g = groups[gIdx];
    updateGroup(gIdx, { items: [...g.items, { label: 'New item', url: '#' }] });
  };
  const updateGroupItem = (gIdx: number, iIdx: number, updates: Partial<DownloadItem>) => {
    const g = groups[gIdx];
    const nextItems = g.items.map((it, i) => i === iIdx ? { ...it, ...updates } : it);
    updateGroup(gIdx, { items: nextItems });
  };
  const removeGroupItem = (gIdx: number, iIdx: number) => {
    const g = groups[gIdx];
    updateGroup(gIdx, { items: g.items.filter((_, i) => i !== iIdx) });
  };
  const addItemLink = (gIdx: number, iIdx: number) => {
    const item = groups[gIdx].items[iIdx];
    const links = item.links ?? [];
    updateGroupItem(gIdx, iIdx, { links: [...links, { label: 'Link', url: '#' }] });
  };
  const updateItemLink = (gIdx: number, iIdx: number, lIdx: number, updates: Partial<DownloadLink>) => {
    const item = groups[gIdx].items[iIdx];
    const links = (item.links ?? []).map((l, i) => i === lIdx ? { ...l, ...updates } : l);
    updateGroupItem(gIdx, iIdx, { links });
  };
  const removeItemLink = (gIdx: number, iIdx: number, lIdx: number) => {
    const item = groups[gIdx].items[iIdx];
    updateGroupItem(gIdx, iIdx, { links: (item.links ?? []).filter((_, i) => i !== lIdx) });
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Mode</label>
        <div className="flex gap-1">
          {(['flat', 'grouped'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                mode === m ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {m === 'flat' ? 'Flat List' : 'Grouped List'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'flat' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Items</label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
              <Plus size={11} /> Add Item
            </button>
          </div>
          {items.length === 0 && <p className="text-xs text-slate-400 py-1">No items yet.</p>}
          {items.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <input type="text" className={inputClass} value={item.label} onChange={(e) => updateItem(idx, { label: e.target.value })} placeholder="Label" />
                  <input type="url" className={inputClass} value={item.url ?? ''} onChange={(e) => updateItem(idx, { url: e.target.value })} placeholder="URL (or upload below)" />
                  <input type="text" className={inputClass} value={item.description ?? ''} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="Description (optional)" />
                  <div className="flex gap-2">
                    <input type="text" className={inputClass} value={item.fileSize ?? ''} onChange={(e) => updateItem(idx, { fileSize: e.target.value })} placeholder="File size" />
                    <input type="text" className={inputClass} value={item.duration ?? ''} onChange={(e) => updateItem(idx, { duration: e.target.value })} placeholder="Duration" />
                  </div>
                  <DownloadItemUploadButton idx={idx} onUploaded={updateItem} />
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0" aria-label="Remove item">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'grouped' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Groups</label>
            <button type="button" onClick={addGroup} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors">
              <Plus size={11} /> Add Group
            </button>
          </div>
          {groups.length === 0 && <p className="text-xs text-slate-400 py-1">No groups yet.</p>}
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
                <input type="text" className={`${inputClass} flex-1`} value={group.title} onChange={(e) => updateGroup(gIdx, { title: e.target.value })} placeholder="Group title (e.g. 2024-2025)" />
                <button type="button" onClick={() => removeGroup(gIdx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0" aria-label="Remove group">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="px-3 py-2 space-y-2">
                {group.items.length === 0 && <p className="text-[10px] text-slate-400">No items in this group.</p>}
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="border border-slate-200 rounded p-2 bg-white space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1.5">
                        <input type="text" className={inputClass} value={item.label} onChange={(e) => updateGroupItem(gIdx, iIdx, { label: e.target.value })} placeholder="Label (e.g. Jan 22, 2015)" />
                        <input type="url" className={inputClass} value={item.url ?? ''} onChange={(e) => updateGroupItem(gIdx, iIdx, { url: e.target.value })} placeholder="URL (or leave empty for multi-link)" />
                        {item.description !== undefined && (
                          <input type="text" className={inputClass} value={item.description} onChange={(e) => updateGroupItem(gIdx, iIdx, { description: e.target.value })} placeholder="Description" />
                        )}
                      </div>
                      <button type="button" onClick={() => removeGroupItem(gIdx, iIdx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0" aria-label="Remove item">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="pl-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Links</span>
                        <button type="button" onClick={() => addItemLink(gIdx, iIdx)} className="text-[10px] text-red-600 hover:text-red-700 font-medium">+ Add Link</button>
                      </div>
                      {(item.links ?? []).map((link, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-1">
                          <input type="text" className={`${inputClass} w-24`} value={link.label} onChange={(e) => updateItemLink(gIdx, iIdx, lIdx, { label: e.target.value })} placeholder="Label" />
                          <input type="url" className={`${inputClass} flex-1`} value={link.url} onChange={(e) => updateItemLink(gIdx, iIdx, lIdx, { url: e.target.value })} placeholder="URL" />
                          <button type="button" onClick={() => removeItemLink(gIdx, iIdx, lIdx)} className="p-0.5 text-red-400 hover:text-red-600" aria-label="Remove link"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addGroupItem(gIdx)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 transition-colors">
                  <Plus size={10} /> Add Item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUploadField({
  value,
  onChange,
  label,
  compact,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  label?: string;
  compact?: boolean;
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
      {!compact && <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label ?? 'Image'}</label>}
      {value && (
        <div className={`relative ${compact ? 'mb-1' : 'mb-2'} rounded-lg overflow-hidden border border-slate-200 bg-slate-50`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={`w-full ${compact ? 'h-16' : 'h-24'} object-cover`} />
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
        className={`flex items-center gap-1.5 ${compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} font-medium rounded-lg border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 disabled:opacity-50 transition-colors`}
      >
        <Upload size={compact ? 10 : 13} />
        {uploading ? 'Uploading...' : value ? 'Replace' : 'Upload'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface SectionEditorProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
  currentPageId?: string;
  allPages?: PageConfig[];
  onMoveSection?: (sectionId: string, targetPageId: string) => void;
}

export function SectionEditor({ sections, onChange, currentPageId, allPages, onMoveSection }: SectionEditorProps) {
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
    const defaultHeight = DEFAULT_HEIGHTS[type];
    const galleryDefaults = type === 'gallery' ? {
      galleryEvents: [],
      galleryColumns: 3 as const,
      galleryCardSize: 'md' as const,
      galleryThumbnailAspect: 'landscape' as const,
      galleryShowDescription: true,
    } : {};
    const performancesDefaults = type === 'performances' ? {
      performanceItems: [] as PerformanceItem[],
    } : {};
    const downloadsDefaults = type === 'downloads' ? {
      downloadItems: [] as DownloadItem[],
      downloadGroups: [] as DownloadGroup[],
    } : {};
    const newSection: PageSection = {
      id,
      type,
      title: label,
      content: '',
      ...(defaultHeight != null && { minHeight: defaultHeight }),
      ...galleryDefaults,
      ...performancesDefaults,
      ...downloadsDefaults,
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

  const otherPages = (allPages && currentPageId)
    ? allPages.filter(p => p.id !== currentPageId).map(p => ({ id: p.id, title: p.title }))
    : undefined;

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
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Page sections
          </h3>
          <SectionHelpTooltip />
        </div>
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
                otherPages={otherPages}
                onMoveToPage={onMoveSection}
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
