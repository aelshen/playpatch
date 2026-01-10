/**
 * Watch Session Database Queries
 * SSK-075: Video Player Component
 *
 * Functions for tracking video watch sessions
 */

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export interface CreateWatchSessionParams {
  childId: string;
  videoId: string;
}

export interface UpdateWatchProgressParams {
  sessionId: string;
  lastPosition: number;
  duration?: number;
}

export interface MarkSessionCompleteParams {
  sessionId: string;
  duration: number;
}

/**
 * Create a new watch session
 */
export async function createWatchSession(params: CreateWatchSessionParams) {
  const { childId, videoId } = params;

  try {
    const session = await prisma.watchSession.create({
      data: {
        childId,
        videoId,
        startedAt: new Date(),
        lastPosition: 0,
        duration: 0,
        completed: false,
      },
    });

    logger.info({ sessionId: session.id, childId, videoId }, 'Watch session created');

    return session;
  } catch (error) {
    logger.error({ error, childId, videoId }, 'Failed to create watch session');
    throw error;
  }
}

/**
 * Update watch progress for an existing session
 */
export async function updateWatchProgress(params: UpdateWatchProgressParams) {
  const { sessionId, lastPosition, duration } = params;

  try {
    const session = await prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        lastPosition,
        ...(duration !== undefined && { duration }),
      },
    });

    logger.debug({ sessionId, lastPosition, duration }, 'Watch progress updated');

    return session;
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to update watch progress');
    throw error;
  }
}

/**
 * Mark a watch session as complete
 */
export async function markSessionComplete(params: MarkSessionCompleteParams) {
  const { sessionId, duration } = params;

  try {
    const session = await prisma.watchSession.update({
      where: { id: sessionId },
      data: {
        completed: true,
        endedAt: new Date(),
        duration,
      },
    });

    logger.info({ sessionId, duration }, 'Watch session marked as complete');

    return session;
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to mark session complete');
    throw error;
  }
}

/**
 * Get the last watch position for a video
 */
export async function getLastWatchPosition(childId: string, videoId: string): Promise<number> {
  try {
    const session = await prisma.watchSession.findFirst({
      where: {
        childId,
        videoId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        lastPosition: true,
        completed: true,
      },
    });

    // If the last session was completed, start from beginning
    if (session?.completed) {
      return 0;
    }

    return session?.lastPosition || 0;
  } catch (error) {
    logger.error({ error, childId, videoId }, 'Failed to get last watch position');
    return 0;
  }
}

/**
 * Get watch statistics for a child
 */
export async function getChildWatchStats(childId: string) {
  try {
    const stats = await prisma.watchSession.aggregate({
      where: {
        childId,
      },
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    const completedCount = await prisma.watchSession.count({
      where: {
        childId,
        completed: true,
      },
    });

    return {
      totalWatchTime: stats._sum.duration || 0,
      totalSessions: stats._count.id || 0,
      completedVideos: completedCount,
    };
  } catch (error) {
    logger.error({ error, childId }, 'Failed to get watch stats');
    return {
      totalWatchTime: 0,
      totalSessions: 0,
      completedVideos: 0,
    };
  }
}

/**
 * Get watch sessions for a specific time period
 */
export async function getWatchSessionsByPeriod(
  childId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const sessions = await prisma.watchSession.findMany({
      where: {
        childId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return sessions;
  } catch (error) {
    logger.error({ error, childId }, 'Failed to get watch sessions by period');
    return [];
  }
}

/**
 * Get most watched videos for a child
 */
export async function getMostWatchedVideos(childId: string, limit: number = 10) {
  try {
    const videoStats = await prisma.watchSession.groupBy({
      by: ['videoId'],
      where: {
        childId,
      },
      _count: {
        id: true,
      },
      _sum: {
        duration: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Fetch video details
    const videoIds = videoStats.map((stat) => stat.videoId);
    const videos = await prisma.video.findMany({
      where: {
        id: {
          in: videoIds,
        },
      },
      select: {
        id: true,
        title: true,
        thumbnailPath: true,
      },
    });

    // Combine stats with video details
    const result = videoStats.map((stat) => {
      const video = videos.find((v) => v.id === stat.videoId);
      return {
        video,
        watchCount: stat._count.id,
        totalWatchTime: stat._sum.duration || 0,
      };
    });

    return result;
  } catch (error) {
    logger.error({ error, childId }, 'Failed to get most watched videos');
    return [];
  }
}
