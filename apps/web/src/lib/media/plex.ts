/**
 * Plex Media Server API Client
 * Connects to a local Plex server to browse and stream content.
 */

import { logger } from '@/lib/logger';

export interface PlexLibrary {
  key: string;        // section key (numeric string)
  title: string;
  type: 'movie' | 'show' | 'music' | string;
  count: number;
}

export interface PlexItem {
  ratingKey: string;
  title: string;
  type: 'movie' | 'episode' | 'show';
  summary: string | null;
  year: number | null;
  contentRating: string | null; // "G", "PG", "TV-Y", "TV-Y7", "PG-13", etc.
  duration: number | null;      // milliseconds
  thumbUrl: string | null;      // path on Plex server
  grandparentTitle?: string;    // show name (for episodes)
  parentTitle?: string;         // season name (for episodes)
  index?: number;               // episode number
  parentIndex?: number;         // season number
  // Raw part info for streaming
  partKey?: string;             // e.g., /library/parts/123/file.mkv
}

export interface PlexSearchResult {
  items: PlexItem[];
  totalItems: number;
  offset: number;
}

/** Map Plex content rating to our AgeRating enum */
export function plexRatingToAgeRating(contentRating: string | null): string {
  if (!contentRating) return 'AGE_7_PLUS';
  const r = contentRating.toLowerCase();
  if (r === 'tv-y' || r === 'g') return 'AGE_2_PLUS';
  if (r === 'tv-g') return 'AGE_4_PLUS';
  if (r === 'tv-y7' || r === 'pg' || r === 'tv-pg') return 'AGE_7_PLUS';
  if (r === 'pg-13' || r === 'tv-14') return 'AGE_10_PLUS';
  return 'AGE_7_PLUS';
}

/** Build authenticated Plex request headers */
function plexHeaders(token: string) {
  return {
    'X-Plex-Token': token,
    'Accept': 'application/json',
  };
}

/** Test connection and return server name. Throws on failure. */
export async function testPlexConnection(serverUrl: string, token: string): Promise<string> {
  const url = `${serverUrl.replace(/\/$/, '')}/`;
  const res = await fetch(url, {
    headers: plexHeaders(token),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Plex server returned ${res.status}`);
  }
  const data = await res.json();
  return data?.MediaContainer?.friendlyName ?? 'Plex Server';
}

/** List all libraries (sections). Filters to movie and show types only. */
export async function listPlexLibraries(serverUrl: string, token: string): Promise<PlexLibrary[]> {
  const base = serverUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/library/sections`, {
    headers: plexHeaders(token),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Failed to fetch libraries: ${res.status}`);
  const data = await res.json();

  const sections: PlexLibrary[] = (data?.MediaContainer?.Directory ?? [])
    .filter((s: Record<string, unknown>) => s.type === 'movie' || s.type === 'show')
    .map((s: Record<string, unknown>) => ({
      key: String(s.key),
      title: String(s.title),
      type: String(s.type),
      count: Number(s.count ?? 0),
    }));

  return sections;
}

/** List items in a library section with optional pagination and text filter. */
export async function listPlexItems(
  serverUrl: string,
  token: string,
  sectionKey: string,
  options?: { offset?: number; limit?: number; search?: string }
): Promise<PlexSearchResult> {
  const base = serverUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (options?.offset) params.set('X-Plex-Container-Start', String(options.offset));
  if (options?.limit) params.set('X-Plex-Container-Size', String(options.limit));
  if (options?.search) params.set('title', options.search);

  const qs = params.toString();
  const url = `${base}/library/sections/${sectionKey}/all${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: plexHeaders(token),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Failed to fetch library items: ${res.status}`);
  const data = await res.json();

  const container = data?.MediaContainer ?? {};
  const rawItems: Record<string, unknown>[] = container.Metadata ?? [];

  const items: PlexItem[] = rawItems.map((m) => {
    // Get first video part key for streaming
    const media = (m.Media as Record<string, unknown>[])?.[0];
    const part = (media?.Part as Record<string, unknown>[])?.[0];

    return {
      ratingKey: String(m.ratingKey),
      title: String(m.title),
      type: String(m.type) as PlexItem['type'],
      summary: (m.summary as string) || null,
      year: m.year ? Number(m.year) : null,
      contentRating: (m.contentRating as string) || null,
      duration: m.duration ? Math.round(Number(m.duration) / 1000) : null, // convert ms → seconds
      thumbUrl: m.thumb ? `${base}${m.thumb}?X-Plex-Token=${token}` : null,
      grandparentTitle: m.grandparentTitle ? String(m.grandparentTitle) : undefined,
      parentTitle: m.parentTitle ? String(m.parentTitle) : undefined,
      index: m.index ? Number(m.index) : undefined,
      parentIndex: m.parentIndex ? Number(m.parentIndex) : undefined,
      partKey: part?.key ? String(part.key) : undefined,
    };
  });

  return {
    items,
    totalItems: Number(container.totalSize ?? container.size ?? items.length),
    offset: Number(container['X-Plex-Container-Start'] ?? options?.offset ?? 0),
  };
}

/** Get stream URL for a Plex item (to be used server-side for proxying). */
export function getPlexStreamUrl(serverUrl: string, token: string, partKey: string): string {
  const base = serverUrl.replace(/\/$/, '');
  return `${base}${partKey}?X-Plex-Token=${token}`;
}
