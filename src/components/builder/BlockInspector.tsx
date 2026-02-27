'use client';

import React from 'react';
import type { BuilderBlock, ButtonBlock, ImageBlock, RichTextBlock, SeparatorBlock, SpacerBlock } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { RichTextEditor } from '@/components/cms/RichTextEditor';

interface BlockInspectorProps {
  pageId: string;
}

function InspectorFields({ block, pageId }: { block: BuilderBlock; pageId: string }) {
  const { pageBuilderActions } = useAppContext();

  const update = (updates: Partial<BuilderBlock>) => {
    pageBuilderActions.updateBlock(pageId, block.id, (prev) => ({ ...prev, ...updates } as BuilderBlock));
  };

  const inputClass = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
  const selectClass = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';

  if (block.type === 'richText') {
    const b = block as RichTextBlock;
    const displayStyle = b.displayStyle ?? 'text';
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Style
          </label>
          <select
            className={selectClass}
            value={displayStyle}
            onChange={(e) => update({ displayStyle: e.target.value as RichTextBlock['displayStyle'] } as Partial<RichTextBlock>)}
          >
            <option value="text">Text</option>
            <option value="header">Header</option>
            <option value="hero">Hero</option>
          </select>
        </div>
        {displayStyle === 'hero' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Hero height (px)
            </label>
            <input
              type="number"
              min={80}
              max={600}
              className={inputClass}
              value={b.heroHeightPx ?? 260}
              onChange={(e) => update({ heroHeightPx: Number(e.target.value) } as Partial<RichTextBlock>)}
              placeholder="260"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">160–200 for compact, 260 default</p>
          </div>
        )}
        {(displayStyle === 'header' || displayStyle === 'hero') && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Title
            </label>
            <input
              className={inputClass}
              value={b.title ?? ''}
              onChange={(e) => update({ title: e.target.value } as Partial<RichTextBlock>)}
              placeholder="Section title"
            />
          </div>
        )}
        {displayStyle === 'hero' && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Background image URL
            </label>
            <input
              className={inputClass}
              value={b.imageUrl ?? ''}
              onChange={(e) => update({ imageUrl: e.target.value || undefined } as Partial<RichTextBlock>)}
              placeholder="/images/hero-bg.jpg"
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Text content
          </label>
          <RichTextEditor
            value={b.content}
            onChange={(html) => update({ content: html } as Partial<RichTextBlock>)}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'image') {
    const b = block as ImageBlock;
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Image URL
          </label>
          <input
            className={inputClass}
            value={b.src}
            onChange={(e) => update({ src: e.target.value } as Partial<ImageBlock>)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Alt text
          </label>
          <input
            className={inputClass}
            value={b.alt}
            onChange={(e) => update({ alt: e.target.value } as Partial<ImageBlock>)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Caption
          </label>
          <input
            className={inputClass}
            value={b.caption ?? ''}
            onChange={(e) => update({ caption: e.target.value } as Partial<ImageBlock>)}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'separator') {
    const b = block as SeparatorBlock;
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Thickness (px)
          </label>
          <input
            type="number"
            min={1}
            max={8}
            className={inputClass}
            value={b.thickness ?? 1}
            onChange={(e) => update({ thickness: Number(e.target.value) } as Partial<SeparatorBlock>)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Style
          </label>
          <select
            className={selectClass}
            value={b.style ?? 'solid'}
            onChange={(e) => update({ style: e.target.value as SeparatorBlock['style'] } as Partial<SeparatorBlock>)}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Color
          </label>
          <input
            type="color"
            className="w-16 h-8 p-1 border border-slate-300 rounded-md"
            value={b.color ?? '#CBD5E1'}
            onChange={(e) => update({ color: e.target.value } as Partial<SeparatorBlock>)}
            aria-label="Separator color"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Width
          </label>
          <select
            className={selectClass}
            value={b.width ?? 'content'}
            onChange={(e) => update({ width: e.target.value as SeparatorBlock['width'] } as Partial<SeparatorBlock>)}
          >
            <option value="full">Full width</option>
            <option value="content">Content width</option>
            <option value="narrow">Narrow</option>
          </select>
        </div>
      </div>
    );
  }

  if (block.type === 'spacer') {
    const b = block as SpacerBlock;
    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Spacer height (px)
        </label>
        <input
          type="number"
          min={0}
          className={inputClass}
          value={b.height}
          onChange={(e) => update({ height: Number(e.target.value) } as Partial<SpacerBlock>)}
        />
      </div>
    );
  }

  if (block.type === 'button') {
    const b = block as ButtonBlock;
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Label
          </label>
          <input
            className={inputClass}
            placeholder="Button text"
            value={b.label}
            onChange={(e) => update({ label: e.target.value } as Partial<ButtonBlock>)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Link URL
          </label>
          <input
            className={inputClass}
            placeholder="#"
            value={b.href}
            onChange={(e) => update({ href: e.target.value } as Partial<ButtonBlock>)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Variant
          </label>
          <select
            className={selectClass}
            value={b.variant ?? 'primary'}
            onChange={(e) => update({ variant: e.target.value as ButtonBlock['variant'] } as Partial<ButtonBlock>)}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="ghost">Ghost</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}

export function BlockInspector({ pageId }: BlockInspectorProps) {
  const { state } = useAppContext();
  const builder = state.pageBuilder;
  const page = builder.pages[pageId];
  const selectedId = builder.selectedBlockIdByPageId[pageId] ?? null;
  const block = selectedId ? page?.blocks.find((b) => b.id === selectedId) : undefined;

  return (
    <aside
      aria-label="Block settings"
      className="w-full min-w-72 shrink-0 bg-white border border-slate-200 rounded-xl p-4"
    >
      <header className="space-y-0.5 mb-2">
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
          Block settings
        </h3>
        <p className="text-[10px] text-slate-500">
          Click a block in the canvas to edit its content.
        </p>
      </header>
      {!block && (
        <p className="text-[11px] text-slate-500">
          No block selected. Choose a block in the canvas to start editing.
        </p>
      )}
      {block && (
        <div className="mt-2 space-y-3">
          <div className="text-[11px] font-semibold text-slate-700">
            {block.type === 'richText' && 'Rich text'}
            {block.type === 'image' && 'Image'}
            {block.type === 'separator' && 'Separator'}
            {block.type === 'spacer' && 'Spacer'}
            {block.type === 'button' && 'Button'}
          </div>
          <InspectorFields block={block} pageId={pageId} />
        </div>
      )}
    </aside>
  );
}

