'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DynamicPage() {
  const { state } = useAppContext();
  const params = useParams();
  const slugSegments = params?.slug as string[] | undefined;
  const path = (slugSegments === undefined || slugSegments.length === 0) ? '/' : `/${slugSegments.join('/')}`;
  const page = state.pages.find((p) => p.slug === path);

  if (!page) {
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

  return <PageContent page={page} />;
}
