/**
 * YouTube Search
 *
 * Uses yt-dlp to search YouTube and return lightweight video metadata.
 * Designed for the PlayPatch content discovery feature.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';

const execFileAsync = promisify(execFile);

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  duration: number;
  thumbnailUrl: string;
  description: string;
  uploadDate: string;
  viewCount: number;
  url: string; // https://www.youtube.com/watch?v=<videoId>
}

/**
 * Search YouTube using yt-dlp flat-playlist mode.
 * Returns lightweight metadata without downloading video content.
 */
export async function searchYouTube(
  query: string,
  options?: { limit?: number; ageRating?: string }
): Promise<YouTubeSearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const limit = options?.limit ?? 10;
  const ageRating = options?.ageRating;

  // Age-scoping heuristic: append child-safe modifier to query
  let scopedQuery = query.trim();
  if (ageRating === 'AGE_2_PLUS' || ageRating === 'AGE_4_PLUS') {
    scopedQuery += ' for kids';
  } else if (ageRating === 'AGE_7_PLUS') {
    scopedQuery += ' for children';
  }
  // AGE_10_PLUS: no modification

  logger.info({ query, ageRating, limit, scopedQuery }, 'Searching YouTube');

  try {
    // Use execFile with an argument array to avoid shell injection entirely
    const { stdout } = await execFileAsync(
      'yt-dlp',
      ['--flat-playlist', '--dump-json', `ytsearch${limit}:${scopedQuery}`],
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    // yt-dlp outputs one JSON object per line
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    const results: YouTubeSearchResult[] = [];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        results.push({
          videoId: data.id,
          title: data.title || 'Untitled Video',
          channelName: data.channel || data.uploader || 'Unknown Channel',
          channelId: data.channel_id || data.uploader_id || '',
          duration: data.duration || 0,
          thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
          description: data.description || '',
          uploadDate: data.upload_date || '',
          viewCount: data.view_count || 0,
          url: `https://www.youtube.com/watch?v=${data.id}`,
        });
      } catch (parseError) {
        logger.warn({ line, parseError }, 'Failed to parse search result entry, skipping');
      }
    }

    logger.info({ query, count: results.length }, 'YouTube search completed');

    return results;
  } catch (error) {
    logger.error({ error, query }, 'YouTube search failed');

    if (error instanceof Error && error.message.includes('command not found')) {
      throw new Error('yt-dlp is not installed. Please install it first: pip install yt-dlp');
    }

    throw error;
  }
}
