/**
 * Video Transcoding Worker
 * SSK-039: Video Transcoding Worker
 *
 * Background worker that transcodes videos to HLS format using FFmpeg
 */

import { Worker, Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/db/client';
import { downloadFile, uploadFile } from '@/lib/storage/client';
import { logger } from '@/lib/logger';
import { createClient } from 'redis';

const execAsync = promisify(exec);

export interface VideoTranscodeJobData {
  videoId: string;
  sourceKey: string;
  familyId: string;
}

const TRANSCODE_DIR = process.env.TEMP_TRANSCODE_DIR || '/tmp/safestream/transcode';

// HLS transcoding profiles
const HLS_PROFILES = [
  { name: '360p', height: 360, bitrate: '800k', audioBitrate: '96k' },
  { name: '480p', height: 480, bitrate: '1400k', audioBitrate: '128k' },
  { name: '720p', height: 720, bitrate: '2800k', audioBitrate: '128k' },
];

/**
 * Transcode video to HLS format with multiple quality levels
 */
async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  videoId: string,
  onProgress?: (progress: number) => void
): Promise<{ playlistPath: string; segmentPaths: string[] }> {
  logger.info({ inputPath, outputDir, videoId }, 'Starting HLS transcoding');

  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Get video duration for progress calculation
  const { stdout: durationOutput } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
  );
  const duration = parseFloat(durationOutput.trim());

  // Build FFmpeg command for adaptive HLS
  const variantPlaylists: string[] = [];
  const streamMaps: string[] = [];
  let streamIndex = 0;

  for (const profile of HLS_PROFILES) {
    const variantName = `${profile.name}`;
    variantPlaylists.push(variantName);

    streamMaps.push(
      `-map 0:v:0 -map 0:a:0`,
      `-c:v:${streamIndex} libx264 -preset medium -crf 23`,
      `-maxrate:v:${streamIndex} ${profile.bitrate}`,
      `-bufsize:v:${streamIndex} ${parseInt(profile.bitrate) * 2}k`,
      `-vf:${streamIndex} scale=-2:${profile.height}`,
      `-c:a:${streamIndex} aac -b:a:${streamIndex} ${profile.audioBitrate}`,
      `-hls_time 6`,
      `-hls_playlist_type vod`,
      `-hls_segment_filename ${outputDir}/${variantName}_%03d.ts`,
      `${outputDir}/${variantName}.m3u8`
    );

    streamIndex++;
  }

  // Master playlist command
  const command = [
    'ffmpeg',
    `-i "${inputPath}"`,
    ...streamMaps,
    '-y', // Overwrite output files
  ].join(' ');

  logger.info({ command }, 'Executing FFmpeg command');

  try {
    await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
    });

    // Create master playlist
    const masterPlaylist = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      ...HLS_PROFILES.map((profile, index) => {
        return [
          `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(profile.bitrate) * 1000},RESOLUTION=${Math.round(profile.height * 16/9)}x${profile.height}`,
          `${profile.name}.m3u8`,
        ].join('\n');
      }),
    ].join('\n');

    const masterPath = join(outputDir, 'master.m3u8');
    await writeFile(masterPath, masterPlaylist);

    // Get all generated files
    const files = await readdir(outputDir);
    const segmentPaths = files.filter(f => f.endsWith('.ts') || f.endsWith('.m3u8'));

    logger.info({ videoId, segmentCount: segmentPaths.length }, 'HLS transcoding completed');

    return {
      playlistPath: 'master.m3u8',
      segmentPaths,
    };
  } catch (error) {
    logger.error({ error, videoId }, 'HLS transcoding failed');
    throw error;
  }
}

/**
 * Generate video thumbnails at different timestamps
 */
async function generateThumbnails(
  inputPath: string,
  outputDir: string,
  videoId: string,
  count: number = 5
): Promise<string[]> {
  logger.info({ videoId, count }, 'Generating thumbnails');

  const thumbnailPaths: string[] = [];

  try {
    // Get video duration
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    );
    const duration = parseFloat(durationOutput.trim());

    // Generate thumbnails at evenly spaced intervals
    for (let i = 0; i < count; i++) {
      const timestamp = (duration / (count + 1)) * (i + 1);
      const thumbnailPath = join(outputDir, `thumb_${i}.jpg`);

      await execAsync(
        `ffmpeg -ss ${timestamp} -i "${inputPath}" -vframes 1 -q:v 2 "${thumbnailPath}" -y`
      );

      thumbnailPaths.push(`thumb_${i}.jpg`);
    }

    logger.info({ videoId, count: thumbnailPaths.length }, 'Thumbnails generated');

    return thumbnailPaths;
  } catch (error) {
    logger.error({ error, videoId }, 'Thumbnail generation failed');
    return [];
  }
}

/**
 * Process video transcoding job
 */
async function processVideoTranscode(job: Job<VideoTranscodeJobData>) {
  const { videoId, sourceKey, familyId } = job.data;

  logger.info({ videoId, sourceKey }, 'Processing video transcoding job');

  try {
    // Update status
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    await job.updateProgress(10);

    // Download source video from storage
    const workDir = join(TRANSCODE_DIR, videoId);
    if (!existsSync(workDir)) {
      await mkdir(workDir, { recursive: true });
    }

    const inputPath = join(workDir, 'input.mp4');
    logger.info({ sourceKey, inputPath }, 'Downloading source video');

    const sourceBuffer = await downloadFile(sourceKey);
    await writeFile(inputPath, sourceBuffer);

    await job.updateProgress(20);

    // Transcode to HLS
    const hlsDir = join(workDir, 'hls');
    const { playlistPath, segmentPaths } = await transcodeToHLS(
      inputPath,
      hlsDir,
      videoId
    );

    await job.updateProgress(70);

    // Upload HLS files to storage
    logger.info({ videoId, fileCount: segmentPaths.length }, 'Uploading HLS files');

    const hlsBaseKey = `videos/${familyId}/${videoId}/hls`;

    for (const segmentFile of segmentPaths) {
      const segmentPath = join(hlsDir, segmentFile);
      const fs = require('fs');
      const segmentBuffer = fs.readFileSync(segmentPath);

      const contentType = segmentFile.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : 'video/mp2t';

      await uploadFile({
        buffer: segmentBuffer,
        key: `${hlsBaseKey}/${segmentFile}`,
        contentType,
      });
    }

    await job.updateProgress(85);

    // Generate and upload thumbnails
    const thumbs = await generateThumbnails(inputPath, workDir, videoId);
    if (thumbs.length > 0) {
      for (const thumbFile of thumbs) {
        const thumbPath = join(workDir, thumbFile);
        const fs = require('fs');
        const thumbBuffer = fs.readFileSync(thumbPath);

        await uploadFile({
          buffer: thumbBuffer,
          key: `videos/${familyId}/${videoId}/thumbnails/${thumbFile}`,
          contentType: 'image/jpeg',
        });
      }
    }

    await job.updateProgress(95);

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'READY',
        hlsPath: `${hlsBaseKey}/master.m3u8`,
        hlsMasterPlaylist: `${hlsBaseKey}/master.m3u8`,
      },
    });

    // Clean up work directory
    try {
      const { execSync } = require('child_process');
      execSync(`rm -rf "${workDir}"`);
      logger.info({ workDir }, 'Cleaned up work directory');
    } catch (error) {
      logger.warn({ error, workDir }, 'Failed to clean up work directory');
    }

    await job.updateProgress(100);

    logger.info({ videoId }, 'Video transcoding completed successfully');

    return { success: true, videoId, hlsPath: `${hlsBaseKey}/master.m3u8` };
  } catch (error) {
    logger.error({ error, videoId }, 'Video transcoding failed');

    // Update video status to ERROR
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'ERROR',
        notes: error instanceof Error ? error.message : 'Transcoding failed',
      },
    });

    throw error;
  }
}

/**
 * Create and start the video transcoding worker
 */
export function createVideoTranscodeWorker() {
  const redisConnection = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  const worker = new Worker('video-transcode', processVideoTranscode, {
    connection: redisConnection as any,
    concurrency: 1, // Process 1 transcoding at a time (CPU intensive)
    limiter: {
      max: 5,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Video transcoding job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Video transcoding job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err }, 'Video transcoding worker error');
  });

  logger.info('Video transcoding worker started');

  return worker;
}

// Start worker if this file is run directly
if (require.main === module) {
  createVideoTranscodeWorker();

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
