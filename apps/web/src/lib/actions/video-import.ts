/**
 * Server Actions for Video Import
 * SSK-037: YouTube Video Import
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { createVideo } from '@/lib/db/queries/videos';
import { isYouTubeUrl, extractVideoId, suggestAgeRating, mapCategories } from '@/lib/media/youtube';
import { getVideoInfo } from '@/lib/media/youtube-api';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const importVideoSchema = z.object({
  url: z.string().url('Invalid URL'),
});

export type ImportVideoState = {
  error?: string;
  success?: boolean;
  videoId?: string;
  message?: string;
};

/**
 * Import a video from YouTube
 */
export async function importYouTubeVideoAction(
  _prevState: ImportVideoState | null,
  formData: FormData
): Promise<ImportVideoState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    // Verify family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      logger.error({ familyId }, 'Family not found for video import');
      return {
        error: 'Your family account was not found. Please contact support.',
      };
    }

    // Validate URL
    const validatedFields = importVideoSchema.safeParse({
      url: formData.get('url'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { url } = validatedFields.data;

    // Check if it's a YouTube URL
    if (!isYouTubeUrl(url)) {
      return {
        error: 'Only YouTube URLs are supported at this time',
      };
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        error: 'Could not extract video ID from URL',
      };
    }

    logger.info({ familyId, url, videoId }, 'Starting YouTube video import');

    // Check if video already exists
    const existingVideo = await prisma.video.findFirst({
      where: {
        familyId,
        sourceType: 'YOUTUBE',
        sourceId: videoId,
      },
    });

    if (existingVideo) {
      return {
        error: 'This video has already been imported',
        videoId: existingVideo.id,
      };
    }

    // Extract video metadata via YouTube Data API v3
    const videoInfo = await getVideoInfo(url);

    // Get or create channel
    let channel = await prisma.channel.findFirst({
      where: {
        sourceType: 'YOUTUBE',
        sourceId: videoInfo.channelId,
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          familyId,
          name: videoInfo.channelName,
          sourceType: 'YOUTUBE',
          sourceId: videoInfo.channelId,
          description: '',
        },
      });
      logger.info({ channelId: channel.id, name: channel.name }, 'Created new channel');
    }

    // Suggest age rating and categories
    const suggestedAgeRating = suggestAgeRating(videoInfo);
    const suggestedCategories = mapCategories(videoInfo.categories, videoInfo.tags);

    // Create video record (READY status since we can preview via YouTube embed)
    // Download will be queued only AFTER approval
    const video = await createVideo({
      familyId,
      channelId: channel.id,
      sourceType: 'YOUTUBE',
      sourceId: videoInfo.id,
      sourceUrl: url,
      title: videoInfo.title,
      description: videoInfo.description,
      duration: videoInfo.duration,
      thumbnailPath: videoInfo.thumbnailUrl,
      ageRating: suggestedAgeRating,
      categories: suggestedCategories,
      topics: videoInfo.tags.slice(0, 10), // Limit to 10 tags
      status: 'PENDING', // Awaiting approval — playbackMode set to EMBED on approval
    });

    logger.info({ videoId: video.id, title: video.title }, 'Created video record');

    // NOTE: Download is NOT queued yet - it will be queued after approval
    // This prevents downloading videos that may be rejected

    revalidatePath('/admin/content');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/content/approval');

    return {
      success: true,
      videoId: video.id,
      message: 'Video imported successfully! Review and approve it to start the download.',
    };
  } catch (error) {
    logger.error({ error }, 'Import video error');

    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }

    return {
      error: 'Failed to import video. Please try again.',
    };
  }
}

/**
 * Preview video metadata without importing
 */
export async function previewYouTubeVideoAction(url: string): Promise<{
  error?: string;
  videoInfo?: {
    title: string;
    description: string;
    duration: number;
    thumbnailUrl: string;
    channelName: string;
    suggestedAgeRating: string;
    suggestedCategories: string[];
  };
}> {
  try {
    await getCurrentUser();

    if (!isYouTubeUrl(url)) {
      return {
        error: 'Only YouTube URLs are supported at this time',
      };
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        error: 'Could not extract video ID from URL',
      };
    }

    const videoInfo = await getVideoInfo(url);
    const suggestedAgeRating = suggestAgeRating(videoInfo);
    const suggestedCategories = mapCategories(videoInfo.categories, videoInfo.tags);

    return {
      videoInfo: {
        title: videoInfo.title,
        description: videoInfo.description,
        duration: videoInfo.duration,
        thumbnailUrl: videoInfo.thumbnailUrl,
        channelName: videoInfo.channelName,
        suggestedAgeRating,
        suggestedCategories,
      },
    };
  } catch (error) {
    logger.error({ error, url }, 'Preview video error');

    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }

    return {
      error: 'Failed to load video information. Please check the URL and try again.',
    };
  }
}

// ============================================================================
// REALDEBRID IMPORT ACTIONS
// ============================================================================

import {
  isMagnetUri,
  extractMagnetHash,
  getMagnetMetadata,
  formatBytes,
} from '@/lib/media/realdebrid';

export type ImportMagnetState = {
  error?: string;
  success?: boolean;
  torrentId?: string;
  message?: string;
  files?: Array<{
    id: number;
    name: string;
    size: number;
    sizeFormatted: string;
  }>;
};

/**
 * Preview magnet link metadata without importing
 */
export async function previewMagnetAction(magnetUri: string): Promise<{
  error?: string;
  metadata?: {
    hash: string;
    name: string;
    totalSize: number;
    totalSizeFormatted: string;
    files: Array<{
      id: number;
      name: string;
      size: number;
      sizeFormatted: string;
    }>;
  };
}> {
  try {
    await getCurrentUser();

    if (!isMagnetUri(magnetUri)) {
      return {
        error: 'Invalid magnet link format',
      };
    }

    logger.info({ magnetUri: magnetUri.substring(0, 50) }, 'Previewing magnet link');

    const metadata = await getMagnetMetadata(magnetUri);

    return {
      metadata: {
        hash: metadata.hash,
        name: metadata.name,
        totalSize: metadata.totalSize,
        totalSizeFormatted: formatBytes(metadata.totalSize),
        files: metadata.files.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          sizeFormatted: formatBytes(f.size),
        })),
      },
    };
  } catch (error) {
    logger.error({ error, magnetUri: magnetUri?.substring(0, 50) }, 'Preview magnet error');

    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }

    return {
      error: 'Failed to load magnet information. Please check the link and try again.',
    };
  }
}

/**
 * Import videos from a magnet link
 * This handles multi-file torrents by creating separate video records for each file
 */
export async function importMagnetAction(
  _prevState: ImportMagnetState | null,
  formData: FormData
): Promise<ImportMagnetState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    // Verify family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      logger.error({ familyId }, 'Family not found for magnet import');
      return {
        error: 'Your family account was not found. Please contact support.',
      };
    }

    const magnetUri = formData.get('magnetUri') as string;
    const selectedFilesJson = formData.get('selectedFiles') as string;

    if (!magnetUri) {
      return { error: 'Magnet link is required' };
    }

    if (!isMagnetUri(magnetUri)) {
      return { error: 'Invalid magnet link format' };
    }

    // Parse selected files (array of file IDs)
    let selectedFileIds: number[] | 'all' = 'all';
    if (selectedFilesJson && selectedFilesJson !== 'all') {
      try {
        selectedFileIds = JSON.parse(selectedFilesJson);
      } catch {
        return { error: 'Invalid file selection' };
      }
    }

    logger.info(
      { familyId, magnetUri: magnetUri.substring(0, 50), selectedFileIds },
      'Starting magnet import'
    );

    // Extract hash
    const hash = extractMagnetHash(magnetUri);
    if (!hash) {
      return { error: 'Could not extract hash from magnet link' };
    }

    // Check if this torrent was already imported
    const existingVideos = await prisma.video.findMany({
      where: {
        familyId,
        sourceType: 'REALDEBRID',
        sourceId: { startsWith: hash },
      },
    });

    if (existingVideos.length > 0) {
      return {
        error: 'Videos from this torrent have already been imported',
      };
    }

    // Get metadata
    const metadata = await getMagnetMetadata(magnetUri);

    // Filter files if specific selection was made
    const filesToImport =
      selectedFileIds === 'all'
        ? metadata.files
        : metadata.files.filter((f) => selectedFileIds.includes(f.id));

    if (filesToImport.length === 0) {
      return { error: 'No files selected for import' };
    }

    // Get or create channel for RealDebrid content
    let channel = await prisma.channel.findFirst({
      where: {
        familyId,
        sourceType: 'REALDEBRID',
        name: 'RealDebrid Downloads',
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          familyId,
          name: 'RealDebrid Downloads',
          sourceType: 'REALDEBRID',
          sourceId: 'realdebrid-channel',
          description: 'Videos downloaded via RealDebrid',
        },
      });
      logger.info({ channelId: channel.id }, 'Created RealDebrid channel');
    }

    // Create video records for each selected file
    const videoPromises = filesToImport.map(async (file) => {
      const sourceId = `${hash}:${file.id}`;

      // Extract title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, '');

      return createVideo({
        familyId,
        channelId: channel.id,
        sourceType: 'REALDEBRID',
        sourceId,
        sourceUrl: magnetUri,
        title,
        description: `From torrent: ${metadata.name}`,
        duration: 0, // Will be updated after download
        thumbnailPath: '', // No thumbnail yet
        ageRating: 'AGE_7_PLUS', // Default - parent should review
        categories: ['OTHER'],
        topics: [],
        status: 'PENDING', // Status will be PENDING until files are selected in RealDebrid
        metadata: {
          torrentHash: hash,
          fileId: file.id,
          fileSize: file.size,
          torrentName: metadata.name,
        },
      });
    });

    const videos = await Promise.all(videoPromises);

    logger.info({ count: videos.length, hash }, 'Created video records from magnet');

    revalidatePath('/admin/content');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/content/approval');

    return {
      success: true,
      message: `Imported ${videos.length} video(s) from torrent. Review and approve to start downloads.`,
      files: filesToImport.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        sizeFormatted: formatBytes(f.size),
      })),
    };
  } catch (error) {
    logger.error({ error }, 'Import magnet error');

    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }

    return {
      error: 'Failed to import magnet link. Please try again.',
    };
  }
}
