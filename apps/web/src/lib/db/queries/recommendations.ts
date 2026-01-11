/**
 * Recommendation Database Queries
 * Queries for building smart video recommendations
 */

import { prisma } from '../client';
import type { AgeRating } from '@prisma/client';

/**
 * Get video IDs watched by a child in the last N days
 */
export async function getChildWatchedVideoIds(
  childId: string,
  days: number = 30
): Promise<string[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const sessions = await prisma.watchSession.findMany({
      where: {
        childId,
        startedAt: {
          gte: cutoffDate,
        },
      },
      select: {
        videoId: true,
      },
      distinct: ['videoId'],
    });

    return sessions.map((s) => s.videoId);
  } catch (error) {
    console.error('Error in getChildWatchedVideoIds:', error);
    return [];
  }
}

/**
 * Get videos with similar topics
 */
export async function getVideosWithSimilarTopics(
  topics: string[],
  ageRating: AgeRating,
  excludeIds: string[] = [],
  limit: number = 20
) {
  if (!topics || topics.length === 0) {
    return [];
  }

  try {
    // Get allowed age ratings (current and below)
    const allowedRatings = getAllowedAgeRatingsForQuery(ageRating);

    return await prisma.video.findMany({
      where: {
        id: {
          notIn: excludeIds.length > 0 ? excludeIds : undefined,
        },
        status: 'READY',
        approvalStatus: 'APPROVED',
        ageRating: {
          in: allowedRatings,
        },
        topics: {
          hasSome: topics,
        },
      },
      include: {
        channel: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error in getVideosWithSimilarTopics:', error);
    return [];
  }
}

/**
 * Get videos in specific categories
 */
export async function getVideosInCategories(
  categories: string[],
  ageRating: AgeRating,
  excludeIds: string[] = [],
  limit: number = 20
) {
  if (!categories || categories.length === 0) {
    return [];
  }

  try {
    const allowedRatings = getAllowedAgeRatingsForQuery(ageRating);

    return await prisma.video.findMany({
      where: {
        id: {
          notIn: excludeIds.length > 0 ? excludeIds : undefined,
        },
        status: 'READY',
        approvalStatus: 'APPROVED',
        ageRating: {
          in: allowedRatings,
        },
        categories: {
          hasSome: categories,
        },
      },
      include: {
        channel: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error in getVideosInCategories:', error);
    return [];
  }
}

/**
 * Get most watched videos across all children (for popularity)
 */
export async function getMostWatchedVideos(
  familyId: string,
  ageRating: AgeRating,
  excludeIds: string[] = [],
  limit: number = 20
) {
  try {
    const allowedRatings = getAllowedAgeRatingsForQuery(ageRating);

    // Get watch session counts grouped by video
    const watchCounts = await prisma.watchSession.groupBy({
      by: ['videoId'],
      _count: {
        videoId: true,
      },
      orderBy: {
        _count: {
          videoId: 'desc',
        },
      },
      take: limit * 2, // Get more to filter
    });

    if (watchCounts.length === 0) {
      // No watch sessions yet, return most recent videos instead
      return prisma.video.findMany({
        where: {
          id: {
            notIn: excludeIds,
          },
          familyId,
          status: 'READY',
          approvalStatus: 'APPROVED',
          ageRating: {
            in: allowedRatings,
          },
        },
        include: {
          channel: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    }

    const videoIds = watchCounts.map((wc) => wc.videoId);

    // Fetch full video details
    const videos = await prisma.video.findMany({
      where: {
        id: {
          in: videoIds,
          notIn: excludeIds,
        },
        familyId,
        status: 'READY',
        approvalStatus: 'APPROVED',
        ageRating: {
          in: allowedRatings,
        },
      },
      include: {
        channel: true,
      },
      take: limit,
    });

    // Sort by watch count
    const videoMap = new Map(videos.map((v) => [v.id, v]));
    return watchCounts
      .map((wc) => videoMap.get(wc.videoId))
      .filter((v) => v !== undefined)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in getMostWatchedVideos:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Get videos from same channel
 */
export async function getVideosFromChannel(
  channelId: string,
  ageRating: AgeRating,
  excludeIds: string[] = [],
  limit: number = 20
) {
  try {
    const allowedRatings = getAllowedAgeRatingsForQuery(ageRating);

    return await prisma.video.findMany({
      where: {
        channelId,
        id: {
          notIn: excludeIds.length > 0 ? excludeIds : undefined,
        },
        status: 'READY',
        approvalStatus: 'APPROVED',
        ageRating: {
          in: allowedRatings,
        },
      },
      include: {
        channel: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error in getVideosFromChannel:', error);
    return [];
  }
}

/**
 * Helper: Get allowed age ratings for a given child's rating
 */
function getAllowedAgeRatingsForQuery(ageRating: AgeRating): AgeRating[] {
  const ratingOrder: AgeRating[] = ['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS'];
  const currentIndex = ratingOrder.indexOf(ageRating);
  return ratingOrder.slice(0, currentIndex + 1);
}
