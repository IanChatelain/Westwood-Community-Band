'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import type { GalleryEvent, GalleryMediaItem } from '@/types';
import GalleryLightbox from './GalleryLightbox';

function parseVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
  } catch { /* not a valid URL */ }
  return null;
}

interface GalleryEventPageProps {
  event: GalleryEvent;
  parentSlug: string;
}

export default function GalleryEventPage({ event, parentSlug }: GalleryEventPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const imageItems = event.media.filter((m) => m.type === 'image' && m.url);

  const openLightbox = (mediaItem: GalleryMediaItem) => {
    const idx = imageItems.findIndex((m) => m.id === mediaItem.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href={parentSlug}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-red-800 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to gallery
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{event.title}</h1>
        {event.description && (
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">{event.description}</p>
        )}
      </div>

      {event.media.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No media items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {event.media.map((item) => {
            if (item.type === 'image' && item.url) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openLightbox(item)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white line-clamp-2">{item.caption}</p>
                    </div>
                  )}
                </button>
              );
            }

            if (item.type === 'video' && item.url) {
              const embedUrl = parseVideoEmbedUrl(item.url);
              if (embedUrl) {
                return (
                  <div key={item.id} className="aspect-video col-span-2 rounded-xl overflow-hidden border border-slate-200 bg-black">
                    <iframe
                      src={embedUrl}
                      title={item.caption || 'Video'}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-center"
                >
                  <Play size={40} className="text-white/80 group-hover:text-white transition-colors" />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-xs text-white line-clamp-2">{item.caption}</p>
                    </div>
                  )}
                </a>
              );
            }

            return null;
          })}
        </div>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={imageItems}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
