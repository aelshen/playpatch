/**
 * Channel Scan Worker
 *
 * Consumes the CHANNEL_SYNC queue. For each job:
 *  1. Fetches recent videos from YouTube Data API v3 (quota-efficient, no yt-dlp)
 *  2. Imports new videos via the shared importVideoFromYouTube helper
 *  3. Updates channel lastSyncAt / nextSyncAt
 *
 * Queue: CHANNEL_SYNC
 * Job data: { channelId, limit?, filters? }
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@/lib/db/client';
import { getChannelVideos } from '@/lib/media/youtube-api';
import type { ChannelVideoListOptions } from '@/lib/media/youtube';
import { importVideoFromYouTube } from '@/lib/video/import-from-youtube';
import { QUEUE_NAMES, addTopicExtractionJob } from '@/lib/queue/client';
import { calculateNextSync } from '@/lib/sync/calculate-next-sync';
import { logger } from '@/lib/logger';
import type { AgeRating } from '@prisma/client';

export interface ChannelScanJobData {
  channelId: string;
  limit?: number;
  filters?: Pick<ChannelVideoListOptions, 'minDuration' | 'maxDuration' | 'daysBack' | 'minViews'>;
}

async function processChannelScan(job: Job<ChannelScanJobData>) {
  const { channelId, limit, filters } = job.data;

  logger.info({ channelId }, 'Starting channel scan');

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) throw new Error(`Channel not found: ${channelId}`);

  if (channel.sourceType !== 'YOUTUBE') {
    logger.info({ channelId, sourceType: channel.sourceType }, 'Non-YouTube channel, skipping');
    return { newVideos: 0 };
  }

  if (!channel.sourceId.startsWith('UC')) {
    throw new Error(
      `Channel ${channelId} has non-canonical sourceId "${channel.sourceId}". Re-add the channel to fix.`
    );
  }

  // Merge job-level filters with channel's stored selectiveRules
  const channelRules = (channel.selectiveRules ?? {}) as Partial<ChannelVideoListOptions>;
  const options: ChannelVideoListOptions = {
    limit: limit ?? 20,
    minDuration: filters?.minDuration ?? channelRules.minDuration,
    maxDuration: filters?.maxDuration ?? channelRules.maxDuration,
    daysBack: filters?.daysBack ?? channelRules.daysBack,
    minViews: filters?.minViews ?? channelRules.minViews,
  };

  const videos = await getChannelVideos(channel.sourceId, options);
  logger.info({ channelId, count: videos.length }, 'Fetched videos from YouTube API');

  const approvalStatus = channel.syncMode === 'AUTO_APPROVE' ? 'APPROVED' : 'PENDING';
  const autoAgeRating = (channel.autoAgeRating as AgeRating | null) ?? undefined;
  const autoCategories = channel.autoCategories.length > 0 ? channel.autoCategories : undefined;

  let newVideos = 0;

  for (const video of videos) {
    try {
      const result = await importVideoFromYouTube(video, channel, {
        approvalStatus,
        autoAgeRating,
        autoCategories,
      });
      if (result) {
        newVideos++;
        try {
          await addTopicExtractionJob({
            videoId: result.video.id,
            familyId: channel.familyId,
            trigger: 'video_download',
          });
        } catch (err) {
          logger.warn({ videoId: result.video.id, err }, 'Failed to queue topic/safety extraction');
        }
      }
    } catch (err) {
      logger.error({ err, videoId: video.id }, 'Failed to import video during channel scan');
    }
  }

  await prisma.channel.update({
    where: { id: channelId },
    data: {
      lastSyncAt: new Date(),
      nextSyncAt: calculateNextSync(channel.syncFrequency),
    },
  });

  logger.info({ channelId, newVideos }, 'Channel scan completed');
  return { newVideos };
}

export function createChannelScanWorker() {
  const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker<ChannelScanJobData>(QUEUE_NAMES.CHANNEL_SYNC, processChannelScan, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, newVideos: result?.newVideos }, 'Channel scan job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Channel scan job failed');
  });

  logger.info('Channel scan worker started');
  return worker;
}
