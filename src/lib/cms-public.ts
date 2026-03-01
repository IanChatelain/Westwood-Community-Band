import { unstable_cache } from 'next/cache';
import { loadCmsState } from '@/lib/cms';
import type { AppState } from '@/types';

const CACHE_KEY = 'cms-state-v1';
const CACHE_TAGS = ['cms'] as const;
const REVALIDATE_SECONDS = 60;

/**
 * Server-only cached read of CMS state for the public site.
 * Use this in public layout/page so the first paint does not hit the DB.
 * Invalidated by revalidateTag('cms') on CMS writes.
 */
export async function getCachedCmsState(): Promise<Partial<AppState> | null> {
  return unstable_cache(
    async () => loadCmsState(),
    [CACHE_KEY],
    { revalidate: REVALIDATE_SECONDS, tags: [...CACHE_TAGS] },
  )();
}
