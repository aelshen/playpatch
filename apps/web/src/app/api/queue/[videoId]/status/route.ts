/**
 * Video-specific Queue Status API
 * Get real-time download status for a specific video
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { videoDownloadQueue } from '@/lib/queue/client';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    await getCurrentUser();
    const { videoId } = params;

    // Get video status from database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        status: true,
        notes: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get job status from queue
    const jobs = await videoDownloadQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const job = jobs.find((j) => j.data.videoId === videoId);

    let queueStatus = null;
    if (job) {
      const state = await job.getState();
      queueStatus = {
        state,
        progress: job.progress || 0,
        failedReason: job.failedReason,
        jobId: job.id,
        attempts: job.attemptsMade,
      };
    }

    return NextResponse.json({
      videoId,
      dbStatus: video.status,
      notes: video.notes,
      queue: queueStatus,
    });
  } catch (error) {
    console.error('Video queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video status' },
      { status: 500 }
    );
  }
}
