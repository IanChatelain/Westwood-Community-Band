'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { getNavFromPages } from '@/lib/getNavFromPages';
import Layout from '@/components/ui/Layout';
import LoginModal from '@/components/ui/LoginModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, setIsLoginModalOpen } = useAppContext();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (searchParams?.get('login') === '1') setIsLoginModalOpen(true);
  }, [searchParams, setIsLoginModalOpen]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <Layout
      settings={state.settings}
      navLinks={getNavFromPages(state.pages)}
      onLoginClick={() => setIsLoginModalOpen(true)}
      isAuthenticated={!!state.currentUser}
    >
      {children}
      <LoginModal />
    </Layout>
  );
}
