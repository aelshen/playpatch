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
