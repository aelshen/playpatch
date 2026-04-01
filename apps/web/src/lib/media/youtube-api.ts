/**
 * YouTube Data API v3 client
 *
 * Replaces yt-dlp for all metadata operations. yt-dlp is now only used for
 * the actual video download step.
 *
 * Quota cost (10,000 units/day free):
 *   getChannelInfo     → 1 unit
 *   getChannelVideos   → 2 units (playlistItems + videos batch)
 *   getVideoInfo       → 1 unit
 *
 * Requires YOUTUBE_API_KEY in environment.
 */

import { YouTubeVideoInfo, YouTubeChannelInfo, ChannelVideoListOptions } from './youtube';

const BASE = 'https://www.googleapis.com/youtube/v3';

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY is not configured. Add it to your .env file.');
  return key;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`);
  Object.entries({ ...params, key: apiKey() }).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 }, // 5-min cache in Next.js fetch
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as any)?.error?.message || res.statusText;
    throw new Error(`YouTube API error (${res.status}): ${message}`);
  }

  return res.json() as Promise<T>;
}

/**
 * ISO 8601 duration → seconds  (e.g. "PT5M30S" → 330)
 */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return parseInt(m[1] ?? '0') * 3600 + parseInt(m[2] ?? '0') * 60 + parseInt(m[3] ?? '0');
}

/**
 * Given a channel sourceId (which may be UCxxx, @handle, or a legacy name),
 * return the params object to use with the channels endpoint.
 */
function channelLookupParams(sourceId: string): Record<string, string> {
  if (sourceId.startsWith('UC')) return { id: sourceId };
  if (sourceId.startsWith('@')) return { forHandle: sourceId };
  return { forUsername: sourceId };
}

/**
 * Derive the uploads playlist ID from a channel ID.
 * YouTube convention: UCxxxxxx → UUxxxxxx
 */
export function uploadsPlaylistId(channelId: string): string {
  if (!channelId.startsWith('UC')) {
    throw new Error(
      `Cannot derive uploads playlist ID from non-canonical channel ID: ${channelId}`
    );
  }
  return 'UU' + channelId.slice(2);
}

// ---------------------------------------------------------------------------
// Channel info
// ---------------------------------------------------------------------------

interface RawChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails?: { high?: { url: string }; default?: { url: string } };
  };
  statistics?: { subscriberCount?: string; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

/**
 * Fetch channel metadata. Accepts the stored sourceId (UCxxx, @handle, or
 * legacy username) rather than a full URL.
 */
export async function getChannelInfoById(
  sourceId: string
): Promise<YouTubeChannelInfo & { canonicalId: string }> {
  const data = await apiFetch<{ items?: RawChannel[] }>('channels', {
    part: 'snippet,statistics,contentDetails',
    ...channelLookupParams(sourceId),
  });

  const item = data.items?.[0];
  if (!item) throw new Error(`Channel not found: ${sourceId}`);

  return {
    id: item.id,
    canonicalId: item.id, // always UCxxx
    name: item.snippet.title,
    description: item.snippet.description ?? '',
    thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? '',
    subscriberCount: parseInt(item.statistics?.subscriberCount ?? '0'),
    videoCount: parseInt(item.statistics?.videoCount ?? '0'),
    url: `https://www.youtube.com/channel/${item.id}`,
  };
}

/**
 * Accepts a full channel URL and returns channel metadata.
 * Handles: /@handle, /channel/UCxxx, /c/name, /user/name
 */
export async function getChannelInfoFromUrl(
  url: string
): Promise<YouTubeChannelInfo & { canonicalId: string }> {
  const sourceId = extractSourceIdFromUrl(url);
  return getChannelInfoById(sourceId);
}

// ---------------------------------------------------------------------------
// Video list
// ---------------------------------------------------------------------------

interface RawVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      maxres?: { url: string };
      high?: { url: string };
      default?: { url: string };
    };
    tags?: string[];
    categoryId?: string;
  };
  contentDetails: { duration: string };
  statistics?: { viewCount?: string; likeCount?: string };
}

/**
 * Fetch recent videos for a channel using the uploads playlist.
 * channelId must be the canonical UCxxx format.
 * Returns full YouTubeVideoInfo objects — no second API call needed.
 */
export async function getChannelVideos(
  channelId: string,
  options: ChannelVideoListOptions = {}
): Promise<YouTubeVideoInfo[]> {
  const { limit = 20, minDuration, maxDuration, daysBack, minViews } = options;

  // Step 1: get video IDs from uploads playlist (1 quota unit)
  const playlistId = uploadsPlaylistId(channelId);
  const playlistData = await apiFetch<{ items?: { contentDetails: { videoId: string } }[] }>(
    'playlistItems',
    {
      part: 'contentDetails',
      playlistId,
      maxResults: String(Math.min(limit * 2, 50)), // fetch extra to account for filters
    }
  );

  const ids = (playlistData.items ?? []).map((i) => i.contentDetails.videoId);
  if (ids.length === 0) return [];

  // Step 2: fetch full metadata for all videos in one call (1 quota unit)
  const videosData = await apiFetch<{ items?: RawVideo[] }>('videos', {
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
  });

  const cutoff = daysBack ? new Date(Date.now() - daysBack * 86_400_000) : null;
  const results: YouTubeVideoInfo[] = [];

  for (const item of videosData.items ?? []) {
    const duration = parseDuration(item.contentDetails.duration);
    const viewCount = parseInt(item.statistics?.viewCount ?? '0');
    const publishedAt = new Date(item.snippet.publishedAt);

    if (minDuration && duration < minDuration) continue;
    if (maxDuration && duration > maxDuration) continue;
    if (minViews && viewCount < minViews) continue;
    if (cutoff && publishedAt < cutoff) continue;

    results.push(rawVideoToInfo(item));
    if (results.length >= limit) break;
  }

  return results;
}

// ---------------------------------------------------------------------------
// Single video
// ---------------------------------------------------------------------------

/**
 * Fetch metadata for a single video by ID or URL.
 */
export async function getVideoInfo(idOrUrl: string): Promise<YouTubeVideoInfo> {
  const videoId = idOrUrl.includes('/') ? extractVideoIdFromUrl(idOrUrl) : idOrUrl;
  if (!videoId) throw new Error(`Could not extract video ID from: ${idOrUrl}`);

  const data = await apiFetch<{ items?: RawVideo[] }>('videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoId,
  });

  const item = data.items?.[0];
  if (!item) throw new Error(`Video not found: ${videoId}`);

  return rawVideoToInfo(item);
}

// ---------------------------------------------------------------------------
// URL parsing helpers
// ---------------------------------------------------------------------------

function rawVideoToInfo(item: RawVideo): YouTubeVideoInfo {
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? '',
    duration: parseDuration(item.contentDetails.duration),
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      '',
    channelId: item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    uploadDate: item.snippet.publishedAt,
    viewCount: parseInt(item.statistics?.viewCount ?? '0'),
    likeCount: parseInt(item.statistics?.likeCount ?? '0'),
    categories: [], // category ID→name lookup costs extra quota; our mapCategories handles tags
    tags: item.snippet.tags ?? [],
  };
}

/**
 * Extract a sourceId from a channel URL — returns the most specific identifier
 * available so we can look up the channel with the correct API param.
 *
 * /@pinkfong        → @pinkfong
 * /channel/UCxxx   → UCxxx
 * /c/name          → name  (legacy)
 * /user/name       → name  (legacy)
 */
export function extractSourceIdFromUrl(url: string): string {
  const u = new URL(url);
  const path = u.pathname;

  const handle = path.match(/^\/@([\w.-]+)/)?.[1];
  if (handle) return `@${handle}`;

  const channelId = path.match(/^\/channel\/(UC[\w-]+)/)?.[1];
  if (channelId) return channelId;

  const legacyName = path.match(/^\/(?:c|user)\/([\w-]+)/)?.[1];
  if (legacyName) return legacyName;

  throw new Error(`Unrecognised YouTube channel URL format: ${url}`);
}

function extractVideoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}
