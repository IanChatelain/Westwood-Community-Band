'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';

export default function AboutPage() {
  const { state } = useAppContext();
  const page = state.pages.find(p => p.slug === '/about') || state.pages[0];
  
  return <PageContent page={page} />;
}
