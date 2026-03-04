'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import Layout from '@/components/ui/Layout';
import LoginModal from '@/components/ui/LoginModal';
import { useNavigation } from '@/hooks/useNavigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, setIsLoginModalOpen, logout } = useAppContext();
  const isAdminRoute = pathname?.startsWith('/admin');
  const { navLinks } = useNavigation();

  useEffect(() => {
    if (searchParams?.get('login') === '1' && !state.currentUser) {
      setIsLoginModalOpen(true);
      router.replace(pathname ?? '/');
    }
  }, [pathname, searchParams, state.currentUser, setIsLoginModalOpen, router]);

  if (isAdminRoute) {
    return (
      <>
        {children}
        <LoginModal />
      </>
    );
  }

  return (
    <Layout
      settings={state.settings}
      navLinks={navLinks}
      onLoginClick={() => setIsLoginModalOpen(true)}
      isAuthenticated={!!state.currentUser}
      currentUser={state.currentUser}
      onLogout={logout}
    >
      {children}
      <LoginModal />
    </Layout>
  );
}
