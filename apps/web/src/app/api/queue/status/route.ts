/**
 * Queue Status API
 * Get real-time status of download queues
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { videoDownloadQueue } from '@/lib/queue/client';

export async function GET(request: Request) {
  try {
    await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (videoId) {
      // Get status for specific video
      const jobs = await videoDownloadQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const job = jobs.find((j) => j.data.videoId === videoId);

      if (!job) {
        return NextResponse.json({ status: 'not_found' });
      }

      const state = await job.getState();
      const progress = job.progress || 0;
      const failedReason = job.failedReason;

      return NextResponse.json({
        status: state,
        progress,
        failedReason,
        jobId: job.id,
      });
    }

    // Get overall queue stats
    const [waitingCount, activeCount, completedCount, failedCount] = await Promise.all([
      videoDownloadQueue.getWaitingCount(),
      videoDownloadQueue.getActiveCount(),
      videoDownloadQueue.getCompletedCount(),
      videoDownloadQueue.getFailedCount(),
    ]);

    // Get actual jobs
    const [waitingJobs, activeJobs, failedJobs] = await Promise.all([
      videoDownloadQueue.getWaiting(0, 20),
      videoDownloadQueue.getActive(0, 10),
      videoDownloadQueue.getFailed(0, 10),
    ]);

    return NextResponse.json({
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      total: waitingCount + activeCount + completedCount + failedCount,
      jobs: {
        waiting: waitingJobs.map((j) => ({
          id: j.id,
          videoId: j.data.videoId,
          videoUrl: j.data.sourceUrl,
          addedAt: j.timestamp,
        })),
        active: activeJobs.map((j) => ({
          id: j.id,
          videoId: j.data.videoId,
          videoUrl: j.data.sourceUrl,
          progress: j.progress || 0,
          startedAt: j.processedOn,
        })),
        failed: failedJobs.map((j) => ({
          id: j.id,
          videoId: j.data.videoId,
          videoUrl: j.data.sourceUrl,
          failedReason: j.failedReason,
          attempts: j.attemptsMade,
        })),
      },
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
}
