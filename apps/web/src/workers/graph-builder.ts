/**
 * Graph Builder Worker
 * BullMQ worker that processes graph build jobs
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { buildGraphForChild, updateGraphFromWatchSession } from '@/lib/graph/builder';
import { logger } from '@/lib/logger';
import { QUEUE_NAMES } from '@/lib/queue/client';

interface GraphBuildJobData {
  childId: string;
  videoId: string;
  watchSessionId: string;
  fullRebuild?: boolean;
}

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const graphBuilderWorker = new Worker<GraphBuildJobData>(
  QUEUE_NAMES.GRAPH_BUILD,
  async (job: Job<GraphBuildJobData>) => {
    const { childId, videoId, watchSessionId, fullRebuild } = job.data;

    logger.info({
      message: 'Processing graph build job',
      jobId: job.id,
      childId,
      videoId,
      fullRebuild,
    });

    try {
      let result;

      if (fullRebuild) {
        result = await buildGraphForChild(childId);
      } else {
        result = await updateGraphFromWatchSession(childId, videoId, watchSessionId);
      }

      logger.info({
        message: 'Graph build job completed',
        jobId: job.id,
        childId,
        ...result,
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Graph build job failed',
        jobId: job.id,
        childId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection,
    concurrency: 2, // Allow 2 concurrent builds
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute to prevent overload
    },
  }
);

// Event handlers
graphBuilderWorker.on('completed', (job) => {
  logger.debug({ message: 'Graph builder job completed', jobId: job.id });
});

graphBuilderWorker.on('failed', (job, error) => {
  logger.error({
    message: 'Graph builder job failed',
    jobId: job?.id,
    error: error.message,
  });
});

graphBuilderWorker.on('error', (error) => {
  logger.error({ message: 'Graph builder worker error', error: error.message });
});
