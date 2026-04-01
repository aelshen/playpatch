/**
 * Server Action: trigger AI analysis for videos missing it.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentFamilyId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

/**
 * Queue AI analysis for all videos in the family that are missing aiAnalysis.
 * Returns the number of jobs queued.
 */
export async function runMissingAnalysisAction(): Promise<{
  queued: number;
  error?: string;
}> {
  try {
    const familyId = await getCurrentFamilyId();

    const videos = await prisma.video.findMany({
      where: {
        familyId,
        aiAnalysis: { equals: null },
      },
      select: { id: true },
    });

    const { addTopicExtractionJob } = await import('@/lib/queue/client');

    let queued = 0;
    for (const video of videos) {
      try {
        await addTopicExtractionJob({
          videoId: video.id,
          familyId,
          trigger: 'manual_rebuild',
        });
        queued++;
      } catch (err) {
        logger.warn({ videoId: video.id, err }, 'Failed to queue analysis job');
      }
    }

    logger.info({ familyId, queued }, 'Queued missing AI analysis jobs');
    revalidatePath('/admin/content');
    return { queued };
  } catch (error) {
    logger.error({ error }, 'runMissingAnalysisAction failed');
    return { queued: 0, error: 'Failed to queue analysis jobs.' };
  }
}
