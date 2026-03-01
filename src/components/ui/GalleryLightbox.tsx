'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryMediaItem } from '@/types';

interface GalleryLightboxProps {
  items: GalleryMediaItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function GalleryLightbox({ items, activeIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const item = items[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev) onNavigate(activeIndex - 1);
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(activeIndex + 1);
    },
    [onClose, onNavigate, activeIndex, hasPrev, hasNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Previous button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex - 1); }}
          className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous image"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex + 1); }}
          className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next image"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Content */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' && item.url && (
          <div className="relative w-[90vw] max-w-5xl h-[85vh] min-h-[200px]">
            <Image
              src={item.url}
              alt={item.caption ?? 'Gallery image'}
              fill
              className="object-contain rounded-lg shadow-2xl"
              sizes="(max-width: 1024px) 90vw, 1024px"
            />
          </div>
        )}
        {item.caption && (
          <p className="mt-3 text-sm text-white/90 text-center max-w-lg">{item.caption}</p>
        )}
        <p className="mt-2 text-xs text-white/50">
          {activeIndex + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}
