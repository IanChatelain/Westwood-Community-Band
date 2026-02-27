'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';
import GalleryEventPage from '@/components/ui/GalleryEventPage';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { GalleryEvent } from '@/types';

function ContentSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-pulse">
      <div className="h-[260px] bg-slate-200 rounded-2xl" />
      <div className="space-y-4 max-w-3xl">
        <div className="h-7 bg-slate-200 rounded w-56" />
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-4/6" />
      </div>
      <div className="space-y-4 max-w-3xl">
        <div className="h-7 bg-slate-200 rounded w-44" />
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </div>
    </div>
  );
}

function findGalleryEvent(
  pages: { slug: string; sections: { type: string; galleryEvents?: GalleryEvent[] }[] }[],
  parentSlug: string,
  eventSlug: string,
): { event: GalleryEvent; parentSlug: string } | null {
  const page = pages.find((p) => p.slug === parentSlug);
  if (!page) return null;
  for (const section of page.sections) {
    if (section.type === 'gallery' && section.galleryEvents) {
      const event = section.galleryEvents.find((ev) => ev.slug === eventSlug);
      if (event) return { event, parentSlug };
    }
  }
  return null;
}

export default function DynamicPage() {
  const { state, loading } = useAppContext();
  const params = useParams();
  const slugSegments = params?.slug as string[] | undefined;
  const path = (slugSegments === undefined || slugSegments.length === 0) ? '/' : `/${slugSegments.join('/')}`;

  if (loading) {
    return <ContentSkeleton />;
  }

  const page = state.pages.find((p) => p.slug === path);

  if (page) {
    return <PageContent page={page} />;
  }

  if (slugSegments && slugSegments.length >= 2) {
    const eventSlug = slugSegments[slugSegments.length - 1];
    const parentSlug = `/${slugSegments.slice(0, -1).join('/')}`;
    const result = findGalleryEvent(state.pages, parentSlug, eventSlug);
    if (result) {
      return <GalleryEventPage event={result.event} parentSlug={result.parentSlug} />;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Page not found</h1>
      <p className="text-slate-600 mb-6">This page does not exist or has been removed.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
