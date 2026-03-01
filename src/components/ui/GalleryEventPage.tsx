'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Image as ImageIcon, Music, Video, Pause } from 'lucide-react';
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

function isDirectVideoUrl(url: string): boolean {
  try {
    const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext || '');
  } catch { return false; }
}

type MediaTab = 'photos' | 'recordings' | 'videos';

function AudioPlayer({ item }: { item: GalleryMediaItem }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState(item.duration || '0:00');

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime: ct, duration } = audioRef.current;
    if (duration) {
      setProgress((ct / duration) * 100);
      setCurrentTime(formatTime(ct));
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setTotalDuration(formatTime(audioRef.current.duration));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
  };

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={item.url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className="flex-shrink-0 w-11 h-11 rounded-full bg-red-800 hover:bg-red-900 text-white flex items-center justify-center transition-colors shadow-sm"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{item.caption || 'Untitled Recording'}</p>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="flex-1 h-1.5 bg-slate-200 rounded-full cursor-pointer group/bar"
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-red-800 rounded-full transition-[width] duration-150 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-800 border-2 border-white shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-[11px] text-slate-500 tabular-nums flex-shrink-0 w-20 text-right">
            {currentTime} / {totalDuration}
          </span>
        </div>
      </div>
    </div>
  );
}

function PhotosGrid({
  items,
  eventTitle,
  onOpenLightbox,
}: {
  items: GalleryMediaItem[];
  eventTitle: string;
  onOpenLightbox: (item: GalleryMediaItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No photos in this event yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenLightbox(item)}
          className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.caption || eventTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {item.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white line-clamp-2">{item.caption}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function RecordingsList({ items }: { items: GalleryMediaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Music size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No recordings in this event yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {items.map((item) => (
        <AudioPlayer key={item.id} item={item} />
      ))}
    </div>
  );
}

function VideosGrid({ items }: { items: GalleryMediaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Video size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No videos in this event yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {items.map((item) => {
        const embedUrl = parseVideoEmbedUrl(item.url);
        if (embedUrl) {
          return (
            <div key={item.id} className="rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm">
              <div className="aspect-video">
                <iframe
                  src={embedUrl}
                  title={item.caption || 'Video'}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {item.caption && (
                <div className="px-4 py-3 bg-white border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-800">{item.caption}</p>
                </div>
              )}
            </div>
          );
        }
        if (isDirectVideoUrl(item.url)) {
          return (
            <div key={item.id} className="rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={item.url}
                controls
                preload="metadata"
                className="w-full aspect-video"
              />
              {item.caption && (
                <div className="px-4 py-3 bg-white border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-800">{item.caption}</p>
                </div>
              )}
            </div>
          );
        }
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play size={28} className="text-white/80 group-hover:text-white transition-colors ml-1" />
              </div>
              {item.caption && (
                <p className="text-sm text-white/80 mt-2">{item.caption}</p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

interface GalleryEventPageProps {
  event: GalleryEvent;
  parentSlug: string;
}

export default function GalleryEventPage({ event, parentSlug }: GalleryEventPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = event.media.filter((m) => m.type === 'image' && m.url);
  const recordings = event.media.filter((m) => m.type === 'audio' && m.url);
  const videos = event.media.filter((m) => m.type === 'video' && m.url);

  const availableTabs: { key: MediaTab; label: string; icon: React.ReactNode; count: number }[] = [];
  if (photos.length > 0) availableTabs.push({ key: 'photos', label: 'Photos', icon: <ImageIcon size={16} />, count: photos.length });
  if (recordings.length > 0) availableTabs.push({ key: 'recordings', label: 'Recordings', icon: <Music size={16} />, count: recordings.length });
  if (videos.length > 0) availableTabs.push({ key: 'videos', label: 'Videos', icon: <Video size={16} />, count: videos.length });

  const defaultTab = availableTabs.length > 0 ? availableTabs[0].key : 'photos';
  const [activeTab, setActiveTab] = useState<MediaTab>(defaultTab);

  const openLightbox = (mediaItem: GalleryMediaItem) => {
    const idx = photos.findIndex((m) => m.id === mediaItem.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  const showTabs = availableTabs.length > 1;
  const hasNoMedia = event.media.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href={parentSlug}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-red-800 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to gallery
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{event.title}</h1>
        {event.description && (
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">{event.description}</p>
        )}
        {!hasNoMedia && (
          <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
            {photos.length > 0 && <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>}
            {recordings.length > 0 && <span>{recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}</span>}
            {videos.length > 0 && <span>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</span>}
          </div>
        )}
      </div>

      {hasNoMedia ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No media items yet.</p>
        </div>
      ) : (
        <>
          {showTabs && (
            <div className="mb-8">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? 'bg-red-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!showTabs || activeTab === 'photos') && photos.length > 0 && (
            <div>
              {!showTabs && availableTabs.length > 0 && photos.length > 0 && (recordings.length > 0 || videos.length > 0) && (
                <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <ImageIcon size={20} className="text-slate-400" /> Photos
                </h2>
              )}
              <PhotosGrid items={photos} eventTitle={event.title} onOpenLightbox={openLightbox} />
            </div>
          )}

          {activeTab === 'recordings' && recordings.length > 0 && (
            <div>
              <RecordingsList items={recordings} />
            </div>
          )}

          {activeTab === 'videos' && videos.length > 0 && (
            <div>
              <VideosGrid items={videos} />
            </div>
          )}

          {!showTabs && recordings.length > 0 && photos.length === 0 && (
            <RecordingsList items={recordings} />
          )}
          {!showTabs && videos.length > 0 && photos.length === 0 && recordings.length === 0 && (
            <VideosGrid items={videos} />
          )}

          {!showTabs && availableTabs.length === 1 && availableTabs[0].key !== 'photos' && null}
        </>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
