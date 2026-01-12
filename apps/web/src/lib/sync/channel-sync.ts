/**
 * Channel Sync Service
 * Handles syncing YouTube channels and importing new videos
 */

import { prisma } from '@/lib/db/client';
import {
  getChannelVideoList,
  getYouTubeVideoInfo,
  suggestAgeRating,
  mapCategories,
  ChannelVideoListOptions,
} from '@/lib/media/youtube';
import { addVideoImportJob } from '@/lib/queue/client';
import { createVideo } from '@/lib/db/queries/videos';
import { logger } from '@/lib/logger';
import { SyncFrequency, Channel } from '@prisma/client';

/**
 * Sync a single channel
 * Fetches new videos and queues them for import
 */
export async function syncChannel(channelId: string): Promise<{
  success: boolean;
  newVideos: number;
  error?: string;
}> {
  try {
    logger.info({ channelId }, 'Starting channel sync');

    // Fetch channel from database
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Construct channel URL
    const channelUrl = `https://www.youtube.com/${channel.sourceId}`;

    // Build filter options
    const options: ChannelVideoListOptions = {
      limit: 20, // Check last 20 videos for new content
    };

    // Fetch recent videos from channel
    const videos = await getChannelVideoList(channelUrl, options);

    logger.info({ channelId, videosFound: videos.length }, 'Fetched channel videos');

    let newVideosCount = 0;

    for (const video of videos) {
      // Check if video already exists
      const existingVideo = await prisma.video.findFirst({
        where: {
          familyId: channel.familyId,
          sourceType: 'YOUTUBE',
          sourceId: video.id,
        },
      });

      if (existingVideo) {
        logger.debug({ videoId: video.id }, 'Video already exists, skipping');
        continue;
      }

      // Determine approval status based on sync mode
      let approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

      if (channel.syncMode === 'AUTO_APPROVE') {
        approvalStatus = 'APPROVED';
      } else if (channel.syncMode === 'REVIEW') {
        approvalStatus = 'PENDING';
      }

      // For selective mode, would need to check selectiveRules
      // For now, default to PENDING

      // Get full video info for better metadata
      try {
        const fullVideoInfo = await getYouTubeVideoInfo(video.url);

        // Use channel's autoAgeRating or suggest one
        const ageRating = channel.autoAgeRating || suggestAgeRating(fullVideoInfo);

        // Use channel's autoCategories or map from video
        const categories =
          channel.autoCategories.length > 0
            ? channel.autoCategories
            : mapCategories(fullVideoInfo.categories, fullVideoInfo.tags);

        // Create video record
        const newVideo = await createVideo({
          familyId: channel.familyId,
          channelId: channel.id,
          sourceType: 'YOUTUBE',
          sourceId: fullVideoInfo.id,
          sourceUrl: video.url,
          title: fullVideoInfo.title,
          description: fullVideoInfo.description,
          duration: fullVideoInfo.duration,
          thumbnailPath: fullVideoInfo.thumbnailUrl,
          ageRating,
          categories,
          topics: fullVideoInfo.tags.slice(0, 10),
          status: 'READY',
          approvalStatus,
        });

        newVideosCount++;

        logger.info(
          { videoId: newVideo.id, title: newVideo.title, approvalStatus },
          'Created new video from channel sync'
        );

        // If auto-approved, queue for download
        if (approvalStatus === 'APPROVED') {
          await addVideoImportJob({
            videoId: newVideo.id,
            familyId: channel.familyId,
            sourceUrl: video.url,
            sourceType: 'YOUTUBE',
            channelId: channel.id,
            metadata: {
              title: fullVideoInfo.title,
              duration: fullVideoInfo.duration,
              thumbnailUrl: fullVideoInfo.thumbnailUrl,
            },
          });

          logger.info({ videoId: newVideo.id }, 'Queued video for download');
        }
      } catch (videoError) {
        logger.error(
          { error: videoError, videoId: video.id },
          'Failed to import video from channel'
        );
        // Continue with next video
      }
    }

    // Update channel sync timestamps
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        lastSyncAt: new Date(),
        nextSyncAt: calculateNextSync(channel.syncFrequency),
      },
    });

    logger.info(
      { channelId, newVideos: newVideosCount },
      'Channel sync completed'
    );

    return {
      success: true,
      newVideos: newVideosCount,
    };
  } catch (error) {
    logger.error({ error, channelId }, 'Channel sync failed');

    return {
      success: false,
      newVideos: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all channels that are due for sync
 */
export async function syncDueChannels(): Promise<{
  synced: number;
  failed: number;
  newVideos: number;
}> {
  logger.info('Starting scheduled channel sync');

  try {
    // Find all channels that need syncing
    const dueChannels = await prisma.channel.findMany({
      where: {
        syncFrequency: {
          not: 'MANUAL',
        },
        OR: [
          { nextSyncAt: null },
          { nextSyncAt: { lte: new Date() } },
        ],
      },
    });

    logger.info({ count: dueChannels.length }, 'Found channels due for sync');

    let synced = 0;
    let failed = 0;
    let totalNewVideos = 0;

    // Sync each channel sequentially to avoid overwhelming the system
    for (const channel of dueChannels) {
      const result = await syncChannel(channel.id);

      if (result.success) {
        synced++;
        totalNewVideos += result.newVideos;
      } else {
        failed++;
      }

      // Add a small delay between syncs to be respectful to YouTube
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    logger.info(
      { synced, failed, newVideos: totalNewVideos },
      'Scheduled channel sync completed'
    );

    return { synced, failed, newVideos: totalNewVideos };
  } catch (error) {
    logger.error({ error }, 'Scheduled channel sync failed');

    return { synced: 0, failed: 0, newVideos: 0 };
  }
}

/**
 * Calculate next sync time based on frequency
 */
function calculateNextSync(frequency: SyncFrequency): Date {
  const now = new Date();

  switch (frequency) {
    case 'HOURLY':
      now.setHours(now.getHours() + 1);
      break;
    case 'DAILY':
      now.setDate(now.getDate() + 1);
      break;
    case 'WEEKLY':
      now.setDate(now.getDate() + 7);
      break;
    case 'MANUAL':
      // Set far in future for manual sync
      now.setFullYear(now.getFullYear() + 10);
      break;
  }

  return now;
}
