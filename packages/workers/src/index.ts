/**
 * @safestream/workers
 * Background job workers for video processing and maintenance
 */

import { logger } from './utils/logger';
import { createVideoDownloadWorker } from '../../../apps/web/src/workers/video-download';
import { createVideoTranscodeWorker } from '../../../apps/web/src/workers/video-transcode';

async function main() {
  logger.info('SafeStream Workers starting...');

  try {
    // Start video download worker
    const downloadWorker = createVideoDownloadWorker();
    logger.info('✓ Video download worker started');

    // Start video transcode worker
    const transcodeWorker = createVideoTranscodeWorker();
    logger.info('✓ Video transcode worker started');

    logger.info('All workers initialized and ready');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down workers...');
      await downloadWorker.close();
      await transcodeWorker.close();
      logger.info('Workers stopped');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error(error, 'Failed to initialize workers');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(error, 'Failed to start workers');
  process.exit(1);
});
