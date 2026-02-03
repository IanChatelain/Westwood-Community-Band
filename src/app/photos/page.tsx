'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';

export default function PhotosPage() {
  const { state } = useAppContext();
  const page = state.pages.find(p => p.slug === '/photos') || state.pages[0];
  
  return <PageContent page={page} />;
}
