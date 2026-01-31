/**
 * Video Download Worker
 * SSK-038: Video Download Worker
 *
 * Background worker that downloads videos from YouTube using yt-dlp
 * and uploads them to MinIO/S3 storage
 */

import { Worker, Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/db/client';
import { uploadFile } from '@/lib/storage/client';
import { logger } from '@/lib/logger';
import { videoTranscodeQueue } from '@/lib/queue/client';
import Redis from 'ioredis';

const execAsync = promisify(exec);

export interface VideoDownloadJobData {
  videoId: string;
  sourceUrl: string;
  sourceType: 'YOUTUBE' | 'VIMEO' | 'REALDEBRID' | 'OTHER';
  familyId: string;
}

const DOWNLOAD_DIR = process.env.TEMP_DOWNLOAD_DIR || '/tmp/safestream/downloads';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Download video using yt-dlp with fallback strategies
 */
async function downloadVideo(
  url: string,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<{ filePath: string; fileSize: number; format: string }> {
  logger.info({ url, outputPath }, 'Starting video download');

  try {
    // Import enhanced download with fallback strategies
    const { downloadVideoWithFallback, DownloadError } = await import('./video-download-enhanced');

    // Check for cookies file (users can optionally provide YouTube cookies)
    const cookiesPath = process.env.YOUTUBE_COOKIES_PATH || undefined;

    const result = await downloadVideoWithFallback({
      url,
      outputPath,
      cookiesPath,
      onProgress,
    });

    if (result.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size ${result.fileSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    logger.info({ url, fileSize: result.fileSize }, 'Download completed successfully');

    return result;
  } catch (error: any) {
    // If it's a DownloadError with user-friendly message, use that
    if (error.name === 'DownloadError') {
      const errorMsg = [
        error.userFriendlyMessage,
        '',
        'Suggestions:',
        ...error.suggestions.map((s: string) => `- ${s}`)
      ].join('\n');

      logger.error({ error, url, userMessage: errorMsg }, 'Download failed with user-friendly error');
      throw new Error(errorMsg);
    }

    // Otherwise use generic error
    logger.error({ error, url }, 'Download failed');
    throw error;
  }
}

/**
 * Download video from RealDebrid HTTPS link
 */
async function downloadFromRealDebrid(
  videoId: string,
  magnetUri: string,
  fileId: number,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<{ filePath: string; fileSize: number; format: string }> {
  logger.info({ videoId, fileId }, 'Starting RealDebrid download');

  // Import RealDebrid functions
  const {
    addMagnet,
    selectFiles,
    waitForDownload,
    getDownloadLinks,
  } = await import('@/lib/media/realdebrid');

  try {
    // Create download directory if it doesn't exist
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Add magnet to RealDebrid
    const { id: torrentId } = await addMagnet(magnetUri);
    logger.info({ videoId, torrentId }, 'Magnet added to RealDebrid');

    if (onProgress) onProgress(20);

    // Select specific file
    await selectFiles(torrentId, [fileId]);
    logger.info({ videoId, torrentId, fileId }, 'Files selected');

    if (onProgress) onProgress(30);

    // Wait for RealDebrid to download the torrent
    await waitForDownload(torrentId);
    logger.info({ videoId, torrentId }, 'RealDebrid download completed');

    if (onProgress) onProgress(60);

    // Get HTTPS download links
    const links = await getDownloadLinks(torrentId);
    const targetLink = links.find(l => l.filename.includes(fileId.toString())) || links[0];

    if (!targetLink) {
      throw new Error('No download link found for file');
    }

    logger.info({ videoId, filename: targetLink.filename }, 'Got download link');

    // Download file via HTTPS
    const response = await fetch(targetLink.link);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const fileSize = targetLink.size;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
    }

    // Save to disk
    const buffer = await response.arrayBuffer();
    await writeFile(outputPath, Buffer.from(buffer));

    logger.info({ videoId, fileSize }, 'RealDebrid download completed');

    // Determine format from filename
    const format = targetLink.filename.split('.').pop() || 'mp4';

    return {
      filePath: outputPath,
      fileSize,
      format: format === 'mkv' ? 'mkv' : 'mp4', // Support mkv
    };
  } catch (error) {
    logger.error({ error, videoId }, 'RealDebrid download failed');
    throw error;
  }
}

/**
 * Download and save thumbnail
 */
async function downloadThumbnail(
  url: string,
  videoId: string
): Promise<string> {
  logger.info({ url, videoId }, 'Downloading thumbnail');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download thumbnail: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const thumbnailKey = `${videoId}.jpg`;

    // Upload to storage
    const { uploadBuffer, BUCKETS } = await import('@/lib/storage/client');
    await uploadBuffer(
      BUCKETS.THUMBNAILS,
      thumbnailKey,
      Buffer.from(buffer),
      { 'Content-Type': 'image/jpeg' }
    );

    // Return just the filename - the API endpoint will add the 'thumbnails/' prefix
    logger.info({ videoId, thumbnailKey }, 'Thumbnail uploaded');

    return thumbnailKey;
  } catch (error) {
    logger.error({ error, videoId }, 'Failed to download thumbnail');
    // Non-fatal error, return empty string
    return '';
  }
}

/**
 * Process video download job
 */
async function processVideoDownload(job: Job<VideoDownloadJobData>) {
  const { videoId, sourceUrl, sourceType, familyId } = job.data;

  logger.info({ videoId, sourceUrl, sourceType }, 'Processing video download job');

  try {
    // Update status to DOWNLOADING
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'DOWNLOADING' },
    });

    // Update job progress
    await job.updateProgress(10);

    // Get video record
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Download thumbnail if URL exists
    if (video.thumbnailPath && video.thumbnailPath.startsWith('http')) {
      const thumbnailPath = await downloadThumbnail(video.thumbnailPath, videoId);
      if (thumbnailPath) {
        await prisma.video.update({
          where: { id: videoId },
          data: { thumbnailPath },
        });
      }
    }

    await job.updateProgress(20);

    // Download video based on source type
    const outputPath = join(DOWNLOAD_DIR, `${videoId}.mp4`);
    let filePath: string;
    let fileSize: number;
    let format: string;

    if (sourceType === 'REALDEBRID') {
      // Extract torrent hash and file ID from sourceId (format: hash:fileId)
      const metadata = video.metadata as any;
      const fileId = metadata?.fileId;

      if (!fileId) {
        throw new Error('Missing file ID in video metadata');
      }

      const result = await downloadFromRealDebrid(
        videoId,
        sourceUrl,
        fileId,
        outputPath,
        (progress) => job.updateProgress(20 + (progress * 0.4))
      );
      filePath = result.filePath;
      fileSize = result.fileSize;
      format = result.format;
    } else {
      // YouTube, Vimeo, etc. - use yt-dlp
      const result = await downloadVideo(sourceUrl, outputPath);
      filePath = result.filePath;
      fileSize = result.fileSize;
      format = result.format;
    }

    await job.updateProgress(60);

    // Upload to storage
    logger.info({ videoId, fileSize }, 'Uploading video to storage');

    const videoKey = `${familyId}/${videoId}/original.${format}`;
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);

    const { uploadBuffer, BUCKETS } = await import('@/lib/storage/client');
    await uploadBuffer(
      BUCKETS.VIDEOS,
      videoKey,
      fileBuffer,
      { 'Content-Type': 'video/mp4' }
    );

    logger.info({ videoId, videoKey }, 'Video uploaded to storage');

    await job.updateProgress(80);

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'PROCESSING',
        localPath: videoKey,
        isDownloaded: true,
      },
    });

    // Clean up local file
    try {
      await unlink(filePath);
      logger.info({ filePath }, 'Cleaned up temporary file');
    } catch (error) {
      logger.warn({ error, filePath }, 'Failed to clean up temporary file');
    }

    await job.updateProgress(90);

    // Queue transcoding job
    await videoTranscodeQueue.add('transcode-video', {
      videoId,
      sourceKey: videoKey,
      familyId,
    });

    logger.info({ videoId }, 'Queued transcoding job');

    await job.updateProgress(100);

    logger.info({ videoId }, 'Video download completed successfully');

    return { success: true, videoId, videoKey };
  } catch (error) {
    logger.error({ error, videoId }, 'Video download failed');

    // Update video status to ERROR
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'ERROR',
        notes: error instanceof Error ? error.message : 'Download failed',
      },
    });

    throw error;
  }
}

/**
 * Create and start the video download worker
 */
export function createVideoDownloadWorker() {
  const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker('video-download', processVideoDownload, {
    connection: redisConnection,
    concurrency: 2, // Process 2 downloads at a time
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Video download job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Video download job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err }, 'Video download worker error');
  });

  logger.info('Video download worker started');

  return worker;
}

// Start worker if this file is run directly
if (require.main === module) {
  createVideoDownloadWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}
