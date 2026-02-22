'use client';

import React from 'react';
import { PageConfig, PageSection, SidebarBlock, SidebarBlockType, SectionStyle } from '@/types';

const SECTION_TYPES: { value: PageSection['type']; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'A heading and body text.' },
  { value: 'hero', label: 'Hero', description: 'Large banner with title, short text, and optional image.' },
  { value: 'image-text', label: 'Image + Text', description: 'Image beside text; position and size are configurable.' },
  { value: 'gallery', label: 'Gallery', description: 'Grid of images.' },
  { value: 'table', label: 'Table', description: 'Headers and rows; good for schedules or fees.' },
  { value: 'separator', label: 'Separator', description: 'Visual break: line, space, or dotted divider.' },
  { value: 'contact', label: 'Contact', description: 'Contact form or contact details block.' },
  { value: 'schedule', label: 'Schedule', description: 'Event or rehearsal schedule.' },
];
import { DEFAULT_SIDEBAR_BLOCKS } from '@/constants';
import PageContent from '@/components/ui/PageContent';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Layout as LayoutIcon,
  Sparkles,
  Image as ImageIcon,
  Monitor,
  PanelRightClose,
} from 'lucide-react';
import { gemini } from '@/services/gemini';

interface PageEditorProps {
  page: PageConfig;
  onSave: (updatedPage: PageConfig) => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
}

const SIDEBAR_BLOCK_TYPES: { value: SidebarBlockType; label: string }[] = [
  { value: 'rehearsals', label: 'Rehearsals' },
  { value: 'fees', label: 'Membership Fees' },
  { value: 'contact', label: 'Contact' },
  { value: 'custom', label: 'Custom Text' },
];

function pageConfigEqual(a: PageConfig, b: PageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, showPreview = false, onTogglePreview }) => {
  const [editedPage, setEditedPage] = React.useState<PageConfig>(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    return p;
  });
  const [isGenerating, setIsGenerating] = React.useState<string | null>(null);
  const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);

  // Reset draft when switching to a different page
  React.useEffect(() => {
    const p = { ...page };
    if (p.layout !== 'full' && (!p.sidebarBlocks || p.sidebarBlocks.length === 0)) {
      p.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
    }
    setEditedPage(p);
  }, [page.id]);

  const hasUnsavedChanges = !pageConfigEqual(editedPage, page);

  const handleSave = () => {
    onSave(editedPage);
    setShowSavedFeedback(true);
    window.setTimeout(() => setShowSavedFeedback(false), 3000);
  };

  const handleUpdateSection = (id: string, updates: Partial<PageSection>) => {
    setEditedPage(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };
  const updateSectionStyle = (sectionId: string, styleUpdates: Partial<SectionStyle>) => {
    handleUpdateSection(sectionId, { style: { ...(editedPage.sections.find(s => s.id === sectionId)?.style ?? {}), ...styleUpdates } });
  };

  const handleAiAssist = async (sectionId: string, title: string) => {
    setIsGenerating(sectionId);
    const suggestion = await gemini.generateContentSuggestion(title);
    handleUpdateSection(sectionId, { content: suggestion });
    setIsGenerating(null);
  };

  const addSection = (type: PageSection['type'] = 'text') => {
    const newSection: PageSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: type === 'separator' ? '' : 'New Section',
      content: type === 'table' ? '' : (type === 'separator' ? '' : 'Click here to edit content...'),
      ...(type === 'table' && { tableData: { headers: ['Column 1', 'Column 2'], rows: [['Row 1', 'Row 2']] } }),
      ...(type === 'separator' && { separatorStyle: 'line', separatorSpacing: 'medium' }),
    };
    setEditedPage(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const deleteSection = (id: string) => {
    setEditedPage(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...editedPage.sections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setEditedPage(prev => ({ ...prev, sections: newSections }));
  };

  const sidebarBlocks = editedPage.sidebarBlocks ?? [];
  const setSidebarBlocks = (blocks: SidebarBlock[]) => {
    setEditedPage(prev => ({ ...prev, sidebarBlocks: blocks }));
  };
  const addSidebarBlock = (type: SidebarBlockType) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newBlock: SidebarBlock = { id, type, order: sidebarBlocks.length, title: type === 'custom' ? 'Custom' : undefined, content: '' };
    setSidebarBlocks([...sidebarBlocks, newBlock]);
  };
  const removeSidebarBlock = (id: string) => {
    const next = sidebarBlocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i }));
    setSidebarBlocks(next);
  };
  const updateSidebarBlock = (id: string, updates: Partial<SidebarBlock>) => {
    setSidebarBlocks(sidebarBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  const moveSidebarBlock = (index: number, direction: 'up' | 'down') => {
    const sorted = [...sidebarBlocks].sort((a, b) => a.order - b.order);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    sorted.forEach((b, i) => (b.order = i));
    setSidebarBlocks(sorted);
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
      {/* Editor column */}
      <div className="space-y-8 min-w-0">
        <p className="text-sm text-slate-600">
          Edit layout, sections, and sidebar below. Use <strong>Save Changes</strong> to publish. Toggle <strong>Live preview</strong> to see the page as you edit.
        </p>
        {/* Page Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 flex flex-wrap gap-6 items-center justify-between">
          <div className="space-y-4 flex-grow max-w-md">
            <label className="block text-sm font-bold text-slate-700">Layout Engine</label>
            <p className="text-xs text-slate-500 mb-1">Full width or with a left/right sidebar.</p>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'sidebar-left', 'sidebar-right'] as const).map(layout => (
                <button
                  key={layout}
                  onClick={() => setEditedPage(prev => {
                    const next = { ...prev, layout };
                    if (layout !== 'full' && (!next.sidebarBlocks || next.sidebarBlocks.length === 0)) {
                      next.sidebarBlocks = [...DEFAULT_SIDEBAR_BLOCKS];
                    }
                    return next;
                  })}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1 transition-all ${
                    editedPage.layout === layout 
                      ? 'border-red-600 bg-red-50 text-red-700' 
                      : 'border-slate-300 hover:border-red-400 text-slate-600'
                  }`}
                >
                  <LayoutIcon size={20} />
                  <span className="text-[10px] uppercase font-bold">{layout.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {editedPage.layout !== 'full' && (
            <div className="space-y-4 w-48">
              <label className="block text-sm font-bold text-slate-700">
                Sidebar Width: {editedPage.sidebarWidth}%
              </label>
              <input 
                type="range" 
                min="15" 
                max="40" 
                value={editedPage.sidebarWidth}
                onChange={(e) => setEditedPage(prev => ({ ...prev, sidebarWidth: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {onTogglePreview && (
              <button
                type="button"
                onClick={onTogglePreview}
                className={`px-4 py-3 rounded-lg font-bold flex items-center gap-2 border transition-all ${
                  showPreview 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-slate-300 text-slate-700 hover:border-red-400 hover:bg-red-50/50'
                }`}
              >
                {showPreview ? <PanelRightClose size={18} /> : <Monitor size={18} />}
                {showPreview ? 'Hide preview' : 'Live preview'}
              </button>
            )}
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">Unsaved changes</span>
              )}
              {showSavedFeedback && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded animate-in fade-in duration-200">Saved</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar content (when layout has sidebar) */}
        {editedPage.layout !== 'full' && (
          <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Sidebar content</h3>
            <p className="text-xs text-slate-500 mb-4">Blocks shown next to the main content on this page. Add, remove, or reorder them below.</p>
          <div className="space-y-3">
            {[...sidebarBlocks].sort((a, b) => a.order - b.order).map((block, idx) => (
              <div key={block.id} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase w-24">{block.type}</span>
                {block.type === 'custom' && (
                  <>
                    <input
                      className="flex-1 min-w-[120px] p-2 border border-slate-300 rounded text-slate-900 text-sm"
                      value={block.title ?? ''}
                      onChange={(e) => updateSidebarBlock(block.id, { title: e.target.value })}
                      placeholder="Title"
                    />
                    <input
                      className="flex-1 min-w-[160px] p-2 border border-slate-300 rounded text-slate-900 text-sm"
                      value={block.content ?? ''}
                      onChange={(e) => updateSidebarBlock(block.id, { content: e.target.value })}
                      placeholder="Content"
                    />
                  </>
                )}
                <div className="flex items-center gap-0.5 ml-auto">
                  <button type="button" onClick={() => moveSidebarBlock(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-40" aria-label="Move up"><ChevronUp size={14}/></button>
                  <button type="button" onClick={() => moveSidebarBlock(idx, 'down')} disabled={idx === sidebarBlocks.length - 1} className="p-1.5 hover:bg-slate-200 rounded disabled:opacity-40" aria-label="Move down"><ChevronDown size={14}/></button>
                  <button type="button" onClick={() => removeSidebarBlock(block.id)} className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded" aria-label="Remove"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {SIDEBAR_BLOCK_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => addSidebarBlock(value)} className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-700 hover:border-red-400 hover:text-red-700">
                  + {label}
                </button>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-6">
        {editedPage.sections.map((section, idx) => (
          <div key={section.id} className="group relative bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 hover:ring-red-300 transition-all">
            <div className="p-1.5 flex items-center justify-between bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center gap-2 px-3 flex-wrap">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Block type</label>
                <select
                  value={section.type}
                  onChange={(e) => {
                    const newType = e.target.value as PageSection['type'];
                    const updates: Partial<PageSection> = { type: newType };
                    if (newType === 'table' && !section.tableData) updates.tableData = { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
                    if (newType === 'separator') {
                      updates.separatorStyle = section.separatorStyle ?? 'line';
                      updates.separatorSpacing = section.separatorSpacing ?? 'medium';
                    }
                    handleUpdateSection(section.id, updates);
                  }}
                  className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded border-0 focus:ring-2 focus:ring-red-500"
                  title={SECTION_TYPES.find(t => t.value === section.type)?.description}
                >
                  {SECTION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {SECTION_TYPES.find(t => t.value === section.type)?.description}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(idx, 'up')} className="p-2 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Move section up"><ChevronUp size={16}/></button>
                <button onClick={() => moveSection(idx, 'down')} className="p-2 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Move section down"><ChevronDown size={16}/></button>
                <div className="w-px h-4 bg-slate-300 mx-1" aria-hidden="true"></div>
                <button onClick={() => deleteSection(section.id)} className="p-2 hover:bg-red-50 rounded-md text-slate-500 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-800" aria-label="Delete section"><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="p-6">
              {section.type === 'separator' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Line style</label>
                    <select
                      value={section.separatorStyle ?? 'line'}
                      onChange={(e) => handleUpdateSection(section.id, { separatorStyle: e.target.value as 'line' | 'space' | 'dotted' })}
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="line">Line</option>
                      <option value="space">Space</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Spacing</label>
                    <select
                      value={section.separatorSpacing ?? 'medium'}
                      onChange={(e) => handleUpdateSection(section.id, { separatorSpacing: e.target.value as 'small' | 'medium' | 'large' })}
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              ) : section.type === 'table' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Table title (optional)</label>
                    <input
                      className="w-full p-3 border border-slate-300 rounded-lg text-slate-900"
                      value={section.title}
                      onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                      placeholder="Table title"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Table data</label>
                    <p className="text-xs text-slate-500 mb-2">First row = headers. Add rows below. Use Tab to move between cells.</p>
                    {section.tableData && (
                      <div className="overflow-x-auto">
                        <table className="w-full border border-slate-300 text-sm">
                          <thead>
                            <tr>
                              {(section.tableData.headers || []).map((h, i) => (
                                <th key={i} className="border border-slate-300 p-2 bg-slate-100">
                                  <input
                                    className="w-full min-w-[80px] p-1 border-0 bg-transparent text-slate-900 font-bold"
                                    value={h}
                                    onChange={(e) => {
                                      const headers = [...(section.tableData!.headers || [])];
                                      headers[i] = e.target.value;
                                      handleUpdateSection(section.id, { tableData: { ...section.tableData!, headers } });
                                    }}
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(section.tableData.rows || []).map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td key={ci} className="border border-slate-300 p-2">
                                    <input
                                      className="w-full min-w-[80px] p-1 border-0 bg-transparent text-slate-900"
                                      value={cell}
                                      onChange={(e) => {
                                        const rows = [...(section.tableData!.rows || [])];
                                        const newRow = [...rows[ri]];
                                        newRow[ci] = e.target.value;
                                        rows[ri] = newRow;
                                        handleUpdateSection(section.id, { tableData: { ...section.tableData!, rows } });
                                      }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex gap-2 mt-2">
                          <button type="button" onClick={() => {
                            const cols = section.tableData?.headers?.length ?? 2;
                            const newRow = Array(cols).fill('');
                            handleUpdateSection(section.id, { tableData: { headers: section.tableData!.headers, rows: [...(section.tableData!.rows || []), newRow] } });
                          }} className="text-xs font-bold text-red-600 hover:underline">+ Add row</button>
                          <button type="button" onClick={() => {
                            const headers = [...(section.tableData!.headers || []), ''];
                            const rows = (section.tableData!.rows || []).map(r => [...r, '']);
                            handleUpdateSection(section.id, { tableData: { headers, rows } });
                          }} className="text-xs font-bold text-red-600 hover:underline">+ Add column</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                      <input 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                      />
                    </div>
                    {(section.type === 'hero' || section.type === 'image-text') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Image URL</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 placeholder:text-slate-400"
                            value={section.imageUrl ?? ''}
                            onChange={(e) => handleUpdateSection(section.id, { imageUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Content Body</label>
                      {section.type !== 'contact' && section.type !== 'schedule' && (
                        <button 
                          onClick={() => handleAiAssist(section.id, section.title)}
                          disabled={isGenerating === section.id}
                          className="text-[10px] font-bold text-red-600 flex items-center gap-1 hover:text-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                        >
                          {isGenerating === section.id ? <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full" /> : <Sparkles size={12}/>}
                          {isGenerating === section.id ? 'Generating...' : 'AI Assist'}
                        </button>
                      )}
                    </div>
                    <textarea 
                      rows={4}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400"
                      value={section.content}
                      onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Display options (padding, border, image) */}
            {section.type !== 'separator' && (
              <div className="px-6 pb-6 pt-0 border-t border-slate-100 mt-4">
                <details className="group">
                  <summary className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform">▶</span> Display options
                  </summary>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Padding</label>
                      <select value={section.style?.padding ?? 'medium'} onChange={(e) => updateSectionStyle(section.id, { padding: e.target.value as SectionStyle['padding'] })} className="w-full p-2 border border-slate-300 rounded text-slate-900 text-sm">
                        <option value="none">None</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Border</label>
                      <select value={section.style?.border ?? 'none'} onChange={(e) => updateSectionStyle(section.id, { border: e.target.value as SectionStyle['border'] })} className="w-full p-2 border border-slate-300 rounded text-slate-900 text-sm">
                        <option value="none">None</option>
                        <option value="thin">Thin</option>
                        <option value="medium">Medium</option>
                        <option value="thick">Thick</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corners</label>
                      <select value={section.style?.borderRadius ?? 'medium'} onChange={(e) => updateSectionStyle(section.id, { borderRadius: e.target.value as SectionStyle['borderRadius'] })} className="w-full p-2 border border-slate-300 rounded text-slate-900 text-sm">
                        <option value="none">Sharp</option>
                        <option value="small">Slightly rounded</option>
                        <option value="medium">Rounded</option>
                        <option value="round">Round</option>
                      </select>
                    </div>
                    {(section.type === 'hero' || section.type === 'image-text') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image position</label>
                          <select value={section.style?.imagePosition ?? 'left'} onChange={(e) => updateSectionStyle(section.id, { imagePosition: e.target.value as SectionStyle['imagePosition'] })} className="w-full p-2 border border-slate-300 rounded text-slate-900 text-sm">
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="top">Top</option>
                            <option value="full">Full width</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Image size</label>
                          <select value={section.style?.imageSize ?? 'medium'} onChange={(e) => updateSectionStyle(section.id, { imageSize: e.target.value as SectionStyle['imageSize'] })} className="w-full p-2 border border-slate-300 rounded text-slate-900 text-sm">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-bold text-slate-600 self-center">Add section:</span>
          {SECTION_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => addSection(value)}
              className="py-3 px-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-bold"
            >
              + {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Live preview pane */}
      {showPreview && (
        <div className="lg:sticky lg:top-8 h-[calc(100vh-8rem)] flex flex-col rounded-xl border-2 border-slate-300 bg-slate-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-widest">
            Live preview
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-7xl mx-auto">
              <PageContent page={editedPage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageEditor;
