import { ReactNode } from 'react';
import { AppProvider } from '@/context/AppContext';
import ClientLayout from '@/components/ClientLayout';
import { getCachedCmsState } from '@/lib/cms-public';

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const initialCmsState = await getCachedCmsState();
  return (
    <AppProvider initialCmsState={initialCmsState}>
      <ClientLayout>{children}</ClientLayout>
    </AppProvider>
  );
}
