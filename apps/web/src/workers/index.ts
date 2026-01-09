/**
 * Worker Manager
 * Starts all background workers
 */

import { createVideoDownloadWorker } from './video-download';
import { createVideoTranscodeWorker } from './video-transcode';
import { logger } from '@/lib/logger';

async function startWorkers() {
  logger.info('Starting all workers...');

  try {
    // Start video download worker
    const downloadWorker = createVideoDownloadWorker();
    logger.info('✓ Video download worker started');

    // Start video transcoding worker
    const transcodeWorker = createVideoTranscodeWorker();
    logger.info('✓ Video transcoding worker started');

    logger.info('All workers started successfully');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down workers...');

      await downloadWorker.close();
      logger.info('✓ Video download worker stopped');

      await transcodeWorker.close();
      logger.info('✓ Video transcoding worker stopped');

      logger.info('All workers stopped');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start workers');
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers };
