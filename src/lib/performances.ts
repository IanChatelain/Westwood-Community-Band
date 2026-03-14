import type { PerformanceItem } from '@/types';

/**
 * Parse a human-readable date string like "March 15, 2025" into a Date object.
 * Returns null for unparseable strings.
 */
export function parsePerformanceDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

export function isPastPerformance(perf: PerformanceItem, now: Date = new Date()): boolean {
  const date = parsePerformanceDate(perf.date);
  if (!date) return false;
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay < now;
}

export interface SplitPerformances {
  upcoming: PerformanceItem[];
  past: PerformanceItem[];
}

export function splitPerformances(
  perfs: PerformanceItem[],
  now: Date = new Date(),
): SplitPerformances {
  const upcoming: PerformanceItem[] = [];
  const past: PerformanceItem[] = [];

  for (const p of perfs) {
    if (isPastPerformance(p, now)) {
      past.push(p);
    } else {
      upcoming.push(p);
    }
  }

  const getTime = (p: PerformanceItem) =>
    parsePerformanceDate(p.date)?.getTime() ?? 0;

  upcoming.sort((a, b) => getTime(a) - getTime(b));
  past.sort((a, b) => getTime(b) - getTime(a));

  return { upcoming, past };
}

export function getMapsUrl(perf: PerformanceItem): string | null {
  const query = perf.address || perf.venue;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
