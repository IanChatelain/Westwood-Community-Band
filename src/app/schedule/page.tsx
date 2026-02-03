'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';

export default function SchedulePage() {
  const { state } = useAppContext();
  const page = state.pages.find(p => p.slug === '/schedule') || state.pages[0];
  
  return <PageContent page={page} />;
}
