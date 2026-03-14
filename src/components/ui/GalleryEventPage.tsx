'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Play, Image as ImageIcon, Music, Video, Pause } from 'lucide-react';
import type { GalleryEvent, GalleryMediaItem } from '@/types';
import GalleryLightbox from './GalleryLightbox';
import { useAudioManager } from './AudioManagerProvider';

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

interface VideoLightboxProps {
  items: GalleryMediaItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function VideoLightbox({ items, activeIndex, onClose, onNavigate }: VideoLightboxProps) {
  const item = items[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev) onNavigate(activeIndex - 1);
      else if (e.key === 'ArrowRight' && hasNext) onNavigate(activeIndex + 1);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, hasNext, hasPrev, onClose, onNavigate]);

  if (!item) return null;

  const embedUrl = parseVideoEmbedUrl(item.url);
  const isDirect = isDirectVideoUrl(item.url);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 px-4 py-2.5 rounded-full bg-black/60 text-sm font-medium text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
      >
        Close
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex - 1); }}
          className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-xl"
          aria-label="Previous video"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex + 1); }}
          className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white text-xl"
          aria-label="Next video"
        >
          ›
        </button>
      )}

      <div
        className="relative w-full max-w-[90vw] max-h-[90vh] md:w-auto flex flex-col items-center px-2 sm:px-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:w-[90vw] max-w-5xl">
          {embedUrl ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-2xl">
              <iframe
                src={`${embedUrl}?autoplay=1`}
                title={item.caption || 'Video'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isDirect ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={item.url}
              controls
              preload="metadata"
              autoPlay
              className="w-full max-h-[80vh] rounded-lg bg-black shadow-2xl"
            />
          ) : (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-900 text-white py-12 text-center shadow-2xl"
            >
              Open video in new tab
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-white/90 max-w-3xl px-4 text-center">
          {item.caption && <p>{item.caption}</p>}
          {isDirect && (
            <a
              href={item.url}
              download
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white underline-offset-2 hover:underline"
            >
              Download video{item.fileSize ? ` (${item.fileSize})` : ''}
            </a>
          )}
        </div>

        <p className="mt-2 text-xs text-white/60">
          {activeIndex + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}

type MediaTab = 'photos' | 'recordings' | 'videos';

function AudioPlayer({ item }: { item: GalleryMediaItem }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState(item.duration || '0:00');
  const { activePlayerId, requestPlay, requestPause } = useAudioManager();
  const playerId = `gallery-${item.id}`;

  useEffect(() => {
    if (activePlayerId !== playerId && playing) {
      setPlaying(false);
    }
  }, [activePlayerId, playerId, playing]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      requestPause(playerId);
    } else {
      requestPlay(playerId, audioRef.current);
    }
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
    requestPause(playerId);
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
          <span className="text-[11px] text-slate-500 tabular-nums flex-shrink-0 w-16 sm:w-20 text-right">
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
          <Image
            src={item.url}
            alt={item.caption || eventTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

function VideosGrid({
  items,
  onOpenVideo,
}: {
  items: GalleryMediaItem[];
  onOpenVideo: (index: number) => void;
}) {
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
      {items.map((item, index) => {
        const thumbSrc = item.thumbnailUrl;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenVideo(index)}
            className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2"
          >
            {thumbSrc ? (
              <Image
                src={thumbSrc}
                alt={item.caption || 'Video thumbnail'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Play size={30} className="text-white/85 group-hover:text-white transition-colors ml-0.5" />
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-lg">
                <Play size={28} className="text-white ml-0.5" />
              </div>
            </div>

            {item.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-sm text-white line-clamp-2">{item.caption}</p>
              </div>
            )}
          </button>
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
  const [videoLightboxIndex, setVideoLightboxIndex] = useState<number | null>(null);

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
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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
          <VideosGrid items={videos} onOpenVideo={setVideoLightboxIndex} />
            </div>
          )}

          {!showTabs && recordings.length > 0 && photos.length === 0 && (
            <RecordingsList items={recordings} />
          )}
          {!showTabs && videos.length > 0 && photos.length === 0 && recordings.length === 0 && (
          <VideosGrid items={videos} onOpenVideo={setVideoLightboxIndex} />
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

      {videoLightboxIndex !== null && (
        <VideoLightbox
          items={videos}
          activeIndex={videoLightboxIndex}
          onClose={() => setVideoLightboxIndex(null)}
          onNavigate={setVideoLightboxIndex}
        />
      )}
    </div>
  );
}
