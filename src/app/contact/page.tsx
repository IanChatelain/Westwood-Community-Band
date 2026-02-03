'use client';

import { useAppContext } from '@/context/AppContext';
import PageContent from '@/components/ui/PageContent';

export default function ContactPage() {
  const { state } = useAppContext();
  const page = state.pages.find(p => p.slug === '/contact') || state.pages[0];
  
  return <PageContent page={page} />;
}
