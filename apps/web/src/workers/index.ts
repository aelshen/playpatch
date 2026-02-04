/**
 * Background Workers Entry Point
 * Starts all video processing workers
 */

import { createVideoDownloadWorker } from './video-download';
import { createVideoTranscodeWorker } from './video-transcode';
import { graphBuilderWorker } from './graph-builder';
import { topicExtractionWorker } from './topic-extraction';
import { logger } from '@/lib/logger';
import { initializeStorage } from '@/lib/storage/client';

async function main() {
  logger.info('SafeStream Workers starting...');

  try {
    // Initialize storage backend
    logger.info('Initializing storage backend...');
    await initializeStorage();
    logger.info('✓ Storage backend initialized');

    // Start video download worker
    const downloadWorker = createVideoDownloadWorker();
    logger.info('✓ Video download worker started');

    // Start video transcode worker
    const transcodeWorker = createVideoTranscodeWorker();
    logger.info('✓ Video transcode worker started');

    // Graph builder worker (already started on import)
    logger.info('✓ Graph builder worker started');

    // Topic extraction worker (already started on import)
    logger.info('✓ Topic extraction worker started');

    logger.info('All workers initialized and ready');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down workers...');
      await downloadWorker.close();
      await transcodeWorker.close();
      await graphBuilderWorker.close();
      await topicExtractionWorker.close();
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
