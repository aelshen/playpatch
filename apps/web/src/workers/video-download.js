/**
 * Video Download Worker
 * SSK-038: Video Download Worker
 *
 * Background worker that downloads videos from YouTube using yt-dlp
 * and uploads them to MinIO/S3 storage
 */
import { Worker } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { videoTranscodeQueue } from '@/lib/queue/client';
import Redis from 'ioredis';
const execAsync = promisify(exec);
const DOWNLOAD_DIR = process.env.TEMP_DOWNLOAD_DIR || '/tmp/safestream/downloads';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
/**
 * Download video using yt-dlp
 */
async function downloadVideo(url, outputPath, onProgress) {
    logger.info({ url, outputPath }, 'Starting video download');
    // Create download directory if it doesn't exist
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
    // Download with yt-dlp
    // Format selection: best video+audio or best single file, max 1080p
    const command = [
        'yt-dlp',
        '--format "bestvideo[height<=1080]+bestaudio/best[height<=1080]"',
        '--merge-output-format mp4',
        '--no-playlist',
        `--output "${outputPath}"`,
        '--progress',
        '--newline',
        `"${url}"`,
    ].join(' ');
    try {
        const { stdout } = await execAsync(command, {
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for progress output
        });
        logger.info({ url, stdout }, 'Download completed');
        // Get file info
        const { stdout: statOutput } = await execAsync(`stat -f%z "${outputPath}"`);
        const fileSize = parseInt(statOutput.trim());
        if (fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
        }
        return {
            filePath: outputPath,
            fileSize,
            format: 'mp4',
        };
    }
    catch (error) {
        logger.error({ error, url }, 'Download failed');
        throw error;
    }
}
/**
 * Download and save thumbnail
 */
async function downloadThumbnail(url, videoId) {
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
        await uploadBuffer(BUCKETS.THUMBNAILS, thumbnailKey, Buffer.from(buffer), { 'Content-Type': 'image/jpeg' });
        const thumbnailPath = `thumbnails/${thumbnailKey}`;
        logger.info({ videoId, thumbnailPath }, 'Thumbnail uploaded');
        return thumbnailPath;
    }
    catch (error) {
        logger.error({ error, videoId }, 'Failed to download thumbnail');
        // Non-fatal error, return empty string
        return '';
    }
}
/**
 * Process video download job
 */
async function processVideoDownload(job) {
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
        // Download video
        const outputPath = join(DOWNLOAD_DIR, `${videoId}.mp4`);
        const { filePath, fileSize, format } = await downloadVideo(sourceUrl, outputPath);
        await job.updateProgress(60);
        // Upload to storage
        logger.info({ videoId, fileSize }, 'Uploading video to storage');
        const videoKey = `${familyId}/${videoId}/original.${format}`;
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(filePath);
        const { uploadBuffer, BUCKETS } = await import('@/lib/storage/client');
        await uploadBuffer(BUCKETS.VIDEOS, videoKey, fileBuffer, { 'Content-Type': 'video/mp4' });
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
        }
        catch (error) {
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
    }
    catch (error) {
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
