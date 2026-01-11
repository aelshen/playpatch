/**
 * Server Actions for Video Import
 * SSK-037: YouTube Video Import
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { createVideo } from '@/lib/db/queries/videos';
import {
  isYouTubeUrl,
  extractVideoId,
  getYouTubeVideoInfo,
  suggestAgeRating,
  mapCategories,
} from '@/lib/media/youtube';
import { videoDownloadQueue } from '@/lib/queue/client';
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

    // Extract video metadata using yt-dlp
    const videoInfo = await getYouTubeVideoInfo(url);

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
      status: 'READY', // Mark as READY so it can be reviewed/approved
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

    const videoInfo = await getYouTubeVideoInfo(url);
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

// Import prisma for channel operations
import { prisma } from '@/lib/db/client';
