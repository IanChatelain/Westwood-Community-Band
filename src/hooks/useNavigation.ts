import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getNavFromPages } from '@/lib/getNavFromPages';

export function useNavigation() {
  const { state } = useAppContext();

  const navLinks = useMemo(
    () => getNavFromPages(state.pages),
    [state.pages],
  );

  return { navLinks };
}

