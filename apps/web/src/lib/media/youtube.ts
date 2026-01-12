/**
 * YouTube Metadata Extraction
 * SSK-037: YouTube Video Import
 *
 * Uses yt-dlp to extract video metadata without downloading
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelId: string;
  channelName: string;
  uploadDate: string;
  viewCount: number;
  likeCount?: number;
  categories: string[];
  tags: string[];
}

export interface YouTubeChannelInfo {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: number;
  videoCount?: number;
  url: string;
}

export interface ChannelVideoListItem {
  id: string;
  title: string;
  duration: number;
  thumbnailUrl: string;
  uploadDate: string;
  viewCount: number;
  url: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('youtube.com') ||
      urlObj.hostname === 'youtu.be'
    );
  } catch {
    return false;
  }
}

/**
 * Extract video metadata using yt-dlp
 */
export async function getYouTubeVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  logger.info({ url }, 'Extracting YouTube video metadata');

  try {
    // Use yt-dlp to extract metadata (no download)
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "${url}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    const data = JSON.parse(stdout);

    // Extract and normalize metadata
    const videoInfo: YouTubeVideoInfo = {
      id: data.id,
      title: data.title || 'Untitled Video',
      description: data.description || '',
      duration: data.duration || 0,
      thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
      channelId: data.channel_id || data.uploader_id || '',
      channelName: data.channel || data.uploader || 'Unknown Channel',
      uploadDate: data.upload_date || new Date().toISOString().split('T')[0],
      viewCount: data.view_count || 0,
      likeCount: data.like_count,
      categories: data.categories || [],
      tags: data.tags || [],
    };

    logger.info({ videoId: videoInfo.id, title: videoInfo.title }, 'Successfully extracted video metadata');

    return videoInfo;
  } catch (error) {
    logger.error({ error, url }, 'Failed to extract YouTube video metadata');

    // Check if yt-dlp is installed
    if (error instanceof Error && error.message.includes('command not found')) {
      throw new Error('yt-dlp is not installed. Please install it first: pip install yt-dlp');
    }

    // Check for common errors
    if (error instanceof Error) {
      if (error.message.includes('Private video')) {
        throw new Error('This video is private and cannot be imported');
      }
      if (error.message.includes('Video unavailable')) {
        throw new Error('This video is unavailable or has been removed');
      }
      if (error.message.includes('Sign in to confirm your age')) {
        throw new Error('This video requires age verification');
      }
    }

    throw new Error('Failed to extract video information. Please check the URL and try again.');
  }
}

/**
 * Download video thumbnail
 */
export async function downloadThumbnail(
  thumbnailUrl: string,
  videoId: string
): Promise<string> {
  logger.info({ videoId, thumbnailUrl }, 'Downloading thumbnail');

  try {
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
      throw new Error(`Failed to download thumbnail: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    logger.error({ error, videoId }, 'Failed to download thumbnail');
    throw new Error('Failed to download thumbnail');
  }
}

/**
 * Suggest age rating based on video metadata
 */
export function suggestAgeRating(info: YouTubeVideoInfo): string {
  const title = info.title.toLowerCase();
  const tags = info.tags.map(t => t.toLowerCase());
  const categories = info.categories.map(c => c.toLowerCase());

  // Check for educational content
  const educationalKeywords = ['learn', 'educational', 'kids', 'children', 'toddler', 'preschool'];
  const isEducational = educationalKeywords.some(
    kw => title.includes(kw) || tags.includes(kw) || categories.includes(kw)
  );

  // Check for very young audience indicators
  const toddlerKeywords = ['baby', 'toddler', 'nursery', 'lullaby', 'cocomelon', 'super simple'];
  const isForToddlers = toddlerKeywords.some(
    kw => title.includes(kw) || info.channelName.toLowerCase().includes(kw)
  );

  if (isForToddlers) {
    return 'AGE_2_PLUS';
  }

  if (isEducational) {
    return 'AGE_4_PLUS';
  }

  // Default to requiring parental review
  return 'AGE_7_PLUS';
}

/**
 * Map YouTube categories to our category system
 */
export function mapCategories(youtubeCategories: string[], tags: string[]): string[] {
  const categoryMap: Record<string, string[]> = {
    EDUCATIONAL: ['education', 'science', 'learning', 'educational'],
    ENTERTAINMENT: ['entertainment', 'gaming', 'comedy'],
    MUSIC: ['music', 'songs', 'nursery rhymes'],
    ANIMATION: ['animation', 'cartoon'],
    STORIES: ['stories', 'storytelling', 'books'],
    ARTS_CRAFTS: ['art', 'craft', 'diy', 'drawing'],
    NATURE: ['nature', 'animals', 'wildlife'],
  };

  const allKeywords = [
    ...youtubeCategories.map(c => c.toLowerCase()),
    ...tags.map(t => t.toLowerCase())
  ];

  const matchedCategories = new Set<string>();

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => allKeywords.some(ak => ak.includes(kw)))) {
      matchedCategories.add(category);
    }
  }

  // Default to EDUCATIONAL if nothing matches
  if (matchedCategories.size === 0) {
    matchedCategories.add('EDUCATIONAL');
  }

  return Array.from(matchedCategories);
}

/**
 * Extract channel ID/username from YouTube URL
 */
export function extractChannelId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // youtube.com/@username
    if (urlObj.pathname.startsWith('/@')) {
      return urlObj.pathname;
    }

    // youtube.com/channel/CHANNEL_ID
    if (urlObj.pathname.startsWith('/channel/')) {
      return urlObj.pathname.split('/')[2];
    }

    // youtube.com/c/CustomName
    if (urlObj.pathname.startsWith('/c/')) {
      return urlObj.pathname;
    }

    // youtube.com/user/Username
    if (urlObj.pathname.startsWith('/user/')) {
      return urlObj.pathname;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate if URL is a YouTube channel URL
 */
export function isYouTubeChannelUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('youtube.com') &&
      (urlObj.pathname.startsWith('/@') ||
        urlObj.pathname.startsWith('/channel/') ||
        urlObj.pathname.startsWith('/c/') ||
        urlObj.pathname.startsWith('/user/'))
    );
  } catch {
    return false;
  }
}

/**
 * Get YouTube channel information
 */
export async function getYouTubeChannelInfo(url: string): Promise<YouTubeChannelInfo> {
  logger.info({ url }, 'Extracting YouTube channel metadata');

  try {
    // Use yt-dlp to extract channel metadata from the first video
    // --flat-playlist gets video list without downloading
    // --playlist-end 1 limits to first video to get channel info quickly
    const { stdout } = await execAsync(
      `yt-dlp --flat-playlist --dump-json --playlist-end 1 "${url}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse the first line (first video entry)
    const firstLine = stdout.trim().split('\n')[0];
    if (!firstLine) {
      throw new Error('No channel data returned');
    }

    const data = JSON.parse(firstLine);

    // Extract channel info from the playlist metadata
    const channelInfo: YouTubeChannelInfo = {
      id: data.playlist_channel_id || data.playlist_id || data.channel_id || '',
      name: data.playlist_uploader || data.playlist || data.channel || 'Unknown Channel',
      description: data.description || '', // Note: description not available in flat mode
      thumbnailUrl: data.thumbnails?.[0]?.url || '',
      subscriberCount: undefined, // Not available in flat-playlist mode
      videoCount: undefined, // Would need full channel fetch
      url: url,
    };

    logger.info({ channelId: channelInfo.id, name: channelInfo.name }, 'Successfully extracted channel metadata');

    return channelInfo;
  } catch (error) {
    logger.error({ error, url }, 'Failed to extract YouTube channel metadata');

    if (error instanceof Error && error.message.includes('command not found')) {
      throw new Error('yt-dlp is not installed. Please install it first: pip install yt-dlp');
    }

    if (error instanceof Error) {
      throw new Error(`Failed to extract channel information: ${error.message}`);
    }

    throw new Error('Failed to extract channel information. Please check the URL and try again.');
  }
}

export interface ChannelVideoListOptions {
  limit?: number; // Max number of videos to fetch
  minDuration?: number; // Minimum duration in seconds
  maxDuration?: number; // Maximum duration in seconds
  daysBack?: number; // Only videos from last N days
  minViews?: number; // Minimum view count
}

/**
 * Get list of videos from a YouTube channel
 */
export async function getChannelVideoList(
  channelUrl: string,
  options: ChannelVideoListOptions = {}
): Promise<ChannelVideoListItem[]> {
  const {
    limit = 10,
    minDuration,
    maxDuration,
    daysBack,
    minViews,
  } = options;

  logger.info({ channelUrl, options }, 'Fetching channel video list');

  try {
    // Build yt-dlp command
    let cmd = `yt-dlp --flat-playlist --dump-json`;

    // Limit number of videos
    if (limit) {
      cmd += ` --playlist-end ${limit}`;
    }

    cmd += ` "${channelUrl}"`;

    const { stdout } = await execAsync(cmd, {
      maxBuffer: 50 * 1024 * 1024, // 50MB for larger playlists
    });

    // Parse JSON lines (one video per line)
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    const videos: ChannelVideoListItem[] = [];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        // Apply filters
        if (minDuration && data.duration < minDuration) continue;
        if (maxDuration && data.duration > maxDuration) continue;
        if (minViews && (data.view_count || 0) < minViews) continue;

        // Check upload date if daysBack specified
        if (daysBack && data.upload_date) {
          const uploadDate = new Date(
            data.upload_date.slice(0, 4) + '-' +
            data.upload_date.slice(4, 6) + '-' +
            data.upload_date.slice(6, 8)
          );
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysBack);

          if (uploadDate < cutoffDate) continue;
        }

        videos.push({
          id: data.id,
          title: data.title || 'Untitled Video',
          duration: data.duration || 0,
          thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
          uploadDate: data.upload_date || '',
          viewCount: data.view_count || 0,
          url: `https://www.youtube.com/watch?v=${data.id}`,
        });
      } catch (parseError) {
        logger.warn({ line, parseError }, 'Failed to parse video entry');
      }
    }

    logger.info({ channelUrl, count: videos.length }, 'Successfully fetched channel video list');

    return videos;
  } catch (error) {
    logger.error({ error, channelUrl }, 'Failed to fetch channel video list');
    throw new Error('Failed to fetch channel videos. Please check the URL and try again.');
  }
}
