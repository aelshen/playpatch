/**
 * Topic Extraction Worker
 * Processes videos with AI to extract topics and build graph
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_NAMES, type TopicExtractionJobData } from '@/lib/queue/client';
import { processVideoWithAI } from '@/lib/graph/builder';
import { logger } from '@/lib/logger';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Worker that processes topic extraction jobs
 *
 * Rate limited to prevent OpenAI quota exhaustion:
 * - Concurrency: 2 (process 2 videos simultaneously)
 * - Rate limit: 10 jobs per minute
 */
export const topicExtractionWorker = new Worker<TopicExtractionJobData>(
  QUEUE_NAMES.TOPIC_EXTRACTION,
  async (job: Job<TopicExtractionJobData>) => {
    const { videoId, familyId, trigger } = job.data;

    logger.info({
      message: 'Processing topic extraction job',
      jobId: job.id,
      videoId,
      familyId,
      trigger,
    });

    const startTime = Date.now();
    const result = await processVideoWithAI(videoId, familyId);
    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info({
        message: 'Topic extraction job completed',
        jobId: job.id,
        videoId,
        duration,
        ...result,
      });
    } else {
      logger.error({
        message: 'Topic extraction job failed',
        jobId: job.id,
        videoId,
        error: result.error,
        duration,
      });

      // Throw to trigger retry
      if (result.error) {
        throw new Error(result.error);
      }
    }

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 2, // Allow 2 concurrent AI extractions
    limiter: {
      max: 10, // Max 10 jobs per minute
      duration: 60000,
    },
  }
);

// Handle worker events
topicExtractionWorker.on('completed', (job) => {
  logger.info({
    message: 'Topic extraction worker: job completed',
    jobId: job.id,
    videoId: job.data.videoId,
  });
});

topicExtractionWorker.on('failed', (job, err) => {
  logger.error({
    message: 'Topic extraction worker: job failed',
    jobId: job?.id,
    videoId: job?.data.videoId,
    error: err.message,
  });
});

topicExtractionWorker.on('error', (err) => {
  logger.error({
    message: 'Topic extraction worker error',
    error: err.message,
  });
});

/**
 * Create and return the worker (for use in workers/index.ts)
 */
export function createTopicExtractionWorker() {
  return topicExtractionWorker;
}
