/**
 * Channel Sync Service
 *
 * Thin scheduling layer — actual import work is done by the channel-scan worker.
 * syncChannel enqueues a CHANNEL_SYNC job.
 * syncDueChannels enqueues jobs for all channels that are past their nextSyncAt.
 */

import { prisma } from '@/lib/db/client';
import { addChannelSyncJob } from '@/lib/queue/client';
import { logger } from '@/lib/logger';

/**
 * Enqueue a sync job for a single channel.
 */
export async function syncChannel(
  channelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await addChannelSyncJob({ channelId });
    logger.info({ channelId }, 'Channel sync job enqueued');
    return { success: true };
  } catch (error) {
    logger.error({ error, channelId }, 'Failed to enqueue channel sync job');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enqueue sync jobs for all channels that are past their nextSyncAt time.
 */
export async function syncDueChannels(): Promise<{
  queued: number;
  failed: number;
}> {
  logger.info('Checking for channels due for sync');

  try {
    const dueChannels = await prisma.channel.findMany({
      where: {
        syncFrequency: { not: 'MANUAL' },
        OR: [{ nextSyncAt: null }, { nextSyncAt: { lte: new Date() } }],
      },
      select: { id: true },
    });

    logger.info({ count: dueChannels.length }, 'Found channels due for sync');

    let queued = 0;
    let failed = 0;

    for (const channel of dueChannels) {
      const result = await syncChannel(channel.id);
      if (result.success) {
        queued++;
      } else {
        failed++;
      }
    }

    logger.info({ queued, failed }, 'Done enqueuing channel sync jobs');
    return { queued, failed };
  } catch (error) {
    logger.error({ error }, 'Failed to enqueue due channel syncs');
    return { queued: 0, failed: 0 };
  }
}
