import { ReactNode } from 'react';
import { AppProvider } from '@/context/AppContext';
import ClientLayout from '@/components/ClientLayout';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ClientLayout>{children}</ClientLayout>
    </AppProvider>
  );
}
