'use client';

import React, { useState } from 'react';
import type { BuilderBlock, BlockWrapperStyle, BorderPreset, ButtonBlock, ImageBlock, RichTextBlock, SeparatorBlock, SpacerBlock } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { ChevronDown } from 'lucide-react';

interface BlockInspectorProps {
  pageId: string;
}

function AppearanceFields({ block, pageId }: { block: BuilderBlock; pageId: string }) {
  const { pageBuilderActions } = useAppContext();
  const [open, setOpen] = useState(false);
  const style = block.wrapperStyle ?? {};

  const update = (updates: Partial<BlockWrapperStyle>) => {
    pageBuilderActions.updateBlock(pageId, block.id, (prev) => ({
      ...prev,
      wrapperStyle: { ...(prev.wrapperStyle ?? {}), ...updates },
    } as BuilderBlock));
  };

  const inputClass = 'w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500';
  const selectClass = 'w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="border-t border-slate-200 pt-2 mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700"
      >
        <ChevronDown size={12} className={open ? 'rotate-0' : '-rotate-90'} />
        Appearance
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Width</label>
              <select
                className={selectClass}
                value={typeof style.maxWidth === 'number' ? 'custom' : (style.maxWidth ?? 'content')}
                onChange={(e) => {
                  const v = e.target.value;
                  update({ maxWidth: v === 'custom' ? (typeof style.maxWidth === 'number' ? style.maxWidth : 640) : v as BlockWrapperStyle['maxWidth'] });
                }}
              >
                <option value="full">Full</option>
                <option value="content">Content</option>
                <option value="narrow">Narrow</option>
                <option value="custom">Custom (px)</option>
              </select>
            </div>
            {typeof style.maxWidth === 'number' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Max (px)</label>
                <input
                  type="number"
                  min={200}
                  max={1200}
                  className={inputClass}
                  value={style.maxWidth}
                  onChange={(e) => update({ maxWidth: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Height (min px)</label>
              <input
                type="number"
                min={0}
                placeholder="auto"
                className={inputClass}
                value={style.minHeight ?? ''}
                onChange={(e) => update({ minHeight: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Padding</label>
              <select
                className={selectClass}
                value={style.padding ?? ''}
                onChange={(e) => update({ padding: (e.target.value || undefined) as BlockWrapperStyle['padding'] })}
              >
                <option value="">Default</option>
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Bg</label>
              <input
                type="color"
                className="w-full h-8 p-1 border border-slate-300 rounded cursor-pointer block"
                value={style.backgroundColor ?? '#ffffff'}
                onChange={(e) => update({ backgroundColor: e.target.value })}
                aria-label="Background"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Border</label>
              <select
                className={selectClass}
                value={style.borderPreset ?? 'none'}
                onChange={(e) => update({ borderPreset: e.target.value as BorderPreset })}
              >
                <option value="none">None</option>
                <option value="subtle">Subtle</option>
                <option value="muted">Muted</option>
                <option value="default">Default</option>
                <option value="accent">Accent (red)</option>
                <option value="strong">Strong</option>
                <option value="ring">Ring (Shadcn)</option>
                <option value="custom">Custom…</option>
              </select>
            </div>
            {style.borderPreset === 'custom' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Width</label>
                  <select
                    className={selectClass}
                    value={style.borderWidth ?? 1}
                    onChange={(e) => update({ borderWidth: Number(e.target.value) as BlockWrapperStyle['borderWidth'] })}
                  >
                    <option value={0}>None</option>
                    <option value={1}>1px</option>
                    <option value={2}>2px</option>
                    <option value={4}>4px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Color</label>
                  <input
                    type="color"
                    className="w-full h-8 p-1 border border-slate-300 rounded cursor-pointer block"
                    value={style.borderColor ?? '#e2e8f0'}
                    onChange={(e) => update({ borderColor: e.target.value })}
                    aria-label="Border color"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Radius</label>
              <select
                className={selectClass}
                value={style.borderRadius ?? ''}
                onChange={(e) => update({ borderRadius: (e.target.value || undefined) as BlockWrapperStyle['borderRadius'] })}
              >
                <option value="">Default</option>
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Shadow</label>
              <select
                className={selectClass}
                value={style.shadow ?? 'none'}
                onChange={(e) => update({ shadow: e.target.value as BlockWrapperStyle['shadow'] })}
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
          <textarea
            rows={6}
            className={inputClass}
            value={b.content}
            onChange={(e) => update({ content: e.target.value } as Partial<RichTextBlock>)}
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Border radius (px)
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={b.borderRadius ?? 0}
              onChange={(e) => update({ borderRadius: Number(e.target.value) } as Partial<ImageBlock>)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Padding (px)
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={b.padding ?? 0}
              onChange={(e) => update({ padding: Number(e.target.value) } as Partial<ImageBlock>)}
            />
          </div>
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Border radius (px)
            </label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={b.borderRadius ?? 0}
              onChange={(e) => update({ borderRadius: Number(e.target.value) } as Partial<ButtonBlock>)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Padding X
              </label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={b.paddingX ?? 0}
                onChange={(e) => update({ paddingX: Number(e.target.value) } as Partial<ButtonBlock>)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Padding Y
              </label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={b.paddingY ?? 0}
                onChange={(e) => update({ paddingY: Number(e.target.value) } as Partial<ButtonBlock>)}
              />
            </div>
          </div>
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
          Click a block in the canvas to edit its content and appearance.
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
          <AppearanceFields block={block} pageId={pageId} />
        </div>
      )}
    </aside>
  );
}

