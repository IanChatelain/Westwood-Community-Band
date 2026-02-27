'use client';

import React, { useCallback, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Keep the contenteditable div in sync with the controlled value
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value || '';
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback((command: string, valueArg?: string) => {
    if (typeof window === 'undefined' || !editorRef.current) return;
    editorRef.current.focus();
    // eslint-disable-next-line deprecated-declarations
    document.execCommand(command, false, valueArg);
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const makeLink = () => {
    const url = window.prompt('Enter link URL');
    if (!url) return;
    exec('createLink', url);
  };

  const clearFormatting = () => {
    exec('removeFormat');
    exec('unlink');
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap gap-1 px-2 py-1 border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200 rounded"
          onClick={() => exec('bold')}
        >
          B
        </button>
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] font-medium italic text-slate-700 hover:bg-slate-200 rounded"
          onClick={() => exec('italic')}
        >
          I
        </button>
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] font-medium underline text-slate-700 hover:bg-slate-200 rounded"
          onClick={() => exec('underline')}
        >
          U
        </button>
        <span className="w-px h-4 bg-slate-300 mx-1" />
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200 rounded"
          onClick={() => exec('insertUnorderedList')}
        >
          • List
        </button>
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200 rounded"
          onClick={() => exec('insertOrderedList')}
        >
          1. List
        </button>
        <button
          type="button"
          className="px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200 rounded"
          onClick={makeLink}
        >
          Link
        </button>
        <button
          type="button"
          className="ml-auto px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-200 rounded"
          onClick={clearFormatting}
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[120px] max-h-[260px] overflow-auto px-3 py-2 text-xs text-slate-900 leading-relaxed outline-none whitespace-pre-wrap"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}

