'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { getNavFromPages } from '@/lib/getNavFromPages';
import Layout from '@/components/ui/Layout';
import LoginModal from '@/components/ui/LoginModal';
import AdminDashboard from '@/components/cms/AdminDashboard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const {
    state,
    isAdminMode,
    setIsLoginModalOpen,
  } = useAppContext();

  if (isAdminMode && state.currentUser) {
    return <AdminDashboard />;
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
