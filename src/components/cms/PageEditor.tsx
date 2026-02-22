'use client';

import React from 'react';
import { PageConfig, PageSection } from '@/types';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Layout as LayoutIcon,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { gemini } from '@/services/gemini';

interface PageEditorProps {
  page: PageConfig;
  onSave: (updatedPage: PageConfig) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave }) => {
  const [editedPage, setEditedPage] = React.useState<PageConfig>({ ...page });
  const [isGenerating, setIsGenerating] = React.useState<string | null>(null);

  const handleUpdateSection = (id: string, updates: Partial<PageSection>) => {
    setEditedPage(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleAiAssist = async (sectionId: string, title: string) => {
    setIsGenerating(sectionId);
    const suggestion = await gemini.generateContentSuggestion(title);
    handleUpdateSection(sectionId, { content: suggestion });
    setIsGenerating(null);
  };

  const addSection = () => {
    const newSection: PageSection = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      title: 'New Section',
      content: 'Click here to edit content...'
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Page Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-slate-900/5 flex flex-wrap gap-6 items-center justify-between">
        <div className="space-y-4 flex-grow max-w-md">
          <label className="block text-sm font-bold text-slate-700">Layout Engine</label>
          <div className="grid grid-cols-3 gap-2">
            {(['full', 'sidebar-left', 'sidebar-right'] as const).map(layout => (
              <button
                key={layout}
                onClick={() => setEditedPage(prev => ({ ...prev, layout }))}
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

        <button
          onClick={() => onSave(editedPage)}
          className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-6">
        {editedPage.sections.map((section, idx) => (
          <div key={section.id} className="group relative bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 hover:ring-red-300 transition-all">
            <div className="p-1.5 flex items-center justify-between bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center gap-2 px-3">
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  {section.type} Section
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveSection(idx, 'up')} className="p-2 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Move section up"><ChevronUp size={16}/></button>
                <button onClick={() => moveSection(idx, 'down')} className="p-2 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Move section down"><ChevronDown size={16}/></button>
                <div className="w-px h-4 bg-slate-300 mx-1" aria-hidden="true"></div>
                <button onClick={() => deleteSection(section.id)} className="p-2 hover:bg-red-50 rounded-md text-slate-500 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-800" aria-label="Delete section"><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Title</label>
                  <input 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                  />
                </div>
                {section.imageUrl !== undefined && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Image URL</label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
                          value={section.imageUrl}
                          onChange={(e) => handleUpdateSection(section.id, { imageUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Content Body</label>
                  <button 
                    onClick={() => handleAiAssist(section.id, section.title)}
                    disabled={isGenerating === section.id}
                    className="text-[10px] font-bold text-red-600 flex items-center gap-1 hover:text-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                  >
                    {isGenerating === section.id ? <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full" /> : <Sparkles size={12}/>}
                    {isGenerating === section.id ? 'Generating...' : 'AI Assist'}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400"
                  value={section.content}
                  onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <div className="p-2 bg-slate-100 rounded-full group-hover:bg-red-100 transition-colors" aria-hidden="true">
            <Plus size={24} />
          </div>
          <span className="font-bold text-sm">Add New Section</span>
        </button>
      </div>
    </div>
  );
};

export default PageEditor;
