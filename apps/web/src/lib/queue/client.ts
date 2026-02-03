/**
 * BullMQ Queue Client
 * SSK-008: Background Job Queue Setup
 */

import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 1 day
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
};

// Define queue names
export const QUEUE_NAMES = {
  VIDEO_DOWNLOAD: 'video-download',
  VIDEO_TRANSCODE: 'video-transcode',
  VIDEO_TRANSCRIBE: 'video-transcribe',
  THUMBNAIL_GENERATE: 'thumbnail-generate',
  CHANNEL_SYNC: 'channel-sync',
  CLEANUP: 'cleanup',
  REPORT_GENERATION: 'report-generation',
  GRAPH_BUILD: 'graph-build',
} as const;

// Create queues
export const videoDownloadQueue = new Queue(QUEUE_NAMES.VIDEO_DOWNLOAD, defaultQueueOptions);
export const videoTranscodeQueue = new Queue(QUEUE_NAMES.VIDEO_TRANSCODE, defaultQueueOptions);
export const videoTranscribeQueue = new Queue(QUEUE_NAMES.VIDEO_TRANSCRIBE, defaultQueueOptions);
export const thumbnailGenerateQueue = new Queue(
  QUEUE_NAMES.THUMBNAIL_GENERATE,
  defaultQueueOptions
);
export const channelSyncQueue = new Queue(QUEUE_NAMES.CHANNEL_SYNC, defaultQueueOptions);
export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, defaultQueueOptions);
export const reportGenerationQueue = new Queue(QUEUE_NAMES.REPORT_GENERATION, defaultQueueOptions);

export const graphBuilderQueue = new Queue(QUEUE_NAMES.GRAPH_BUILD, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    // Graph builds can take longer, don't want aggressive retries
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

/**
 * Add video download job
 */
export async function addVideoDownloadJob(data: {
  videoId: string;
  sourceUrl: string;
  sourceType: string;
}) {
  return await videoDownloadQueue.add('download', data, {
    priority: 1,
  });
}

/**
 * Add video transcode job
 */
export async function addVideoTranscodeJob(data: { videoId: string; localPath: string }) {
  return await videoTranscodeQueue.add('transcode', data, {
    priority: 2,
  });
}

/**
 * Add video transcribe job
 */
export async function addVideoTranscribeJob(data: { videoId: string; localPath: string }) {
  return await videoTranscribeQueue.add('transcribe', data, {
    priority: 3,
  });
}

/**
 * Add thumbnail generation job
 */
export async function addThumbnailGenerateJob(data: { videoId: string; localPath: string }) {
  return await thumbnailGenerateQueue.add('generate', data, {
    priority: 2,
  });
}

/**
 * Add video import job (for channel sync)
 */
export async function addVideoImportJob(data: {
  videoId: string;
  familyId: string;
  sourceUrl: string;
  sourceType: string;
  channelId?: string;
  metadata?: {
    title?: string;
    duration?: number;
    thumbnailUrl?: string;
    uploadDate?: string;
    viewCount?: number;
  };
}) {
  return await videoDownloadQueue.add('import', data, {
    priority: 2,
  });
}

/**
 * Add channel sync job
 */
export async function addChannelSyncJob(data: { channelId: string }) {
  return await channelSyncQueue.add('sync', data);
}

/**
 * Add graph build job for a child
 * Triggered after watch session completes
 */
export async function addGraphBuildJob(data: {
  childId: string;
  videoId: string;
  watchSessionId: string;
  fullRebuild?: boolean; // True for full rebuild, false for incremental update
}) {
  // Deduplicate jobs for same child within 5 seconds
  // Prevents rapid-fire updates during quick video switches
  const jobId = `graph-build:${data.childId}:${data.fullRebuild ? 'full' : 'incremental'}`;

  return await graphBuilderQueue.add('build', data, {
    jobId,
    // If job with same ID exists and is waiting, skip this one
    delay: 5000, // Wait 5 seconds before processing
  });
}

/**
 * Get queue stats
 */
export async function getQueueStats(queueName: string) {
  const queue = new Queue(queueName, { connection });
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Get all queue stats
 */
export async function getAllQueueStats() {
  const stats: Record<string, any> = {};

  for (const queueName of Object.values(QUEUE_NAMES)) {
    stats[queueName] = await getQueueStats(queueName);
  }

  return stats;
}

export const queues = {
  videoDownload: videoDownloadQueue,
  videoTranscode: videoTranscodeQueue,
  videoTranscribe: videoTranscribeQueue,
  thumbnailGenerate: thumbnailGenerateQueue,
  channelSync: channelSyncQueue,
  cleanup: cleanupQueue,
  reportGeneration: reportGenerationQueue,
  graphBuilder: graphBuilderQueue,
};

export default queues;
