/**
 * Interaction Analytics Query Functions
 * Database queries for favorites, requests, and content satisfaction
 */

import { prisma } from '../client';
import { RequestType, RequestStatus } from '@prisma/client';

export interface FavoriteStats {
  totalFavorites: number;
  favoriteTrend: Array<{ date: string; count: number }>;
  topFavorited: Array<{
    videoId: string;
    videoTitle: string;
    favoriteCount: number;
  }>;
  categoryDistribution: Record<string, number>;
}

export interface RequestStats {
  totalRequests: number;
  requestsByType: Record<RequestType, number>;
  fulfillmentRate: number;
  pendingRequests: number;
  topRequestedTopics: string[];
  requestTrend: Array<{ date: string; count: number }>;
}

export interface SatisfactionMetrics {
  avgRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>; // star rating -> count
  satisfactionTrend: Array<{ date: string; avgRating: number }>;
  topRatedVideos: Array<{
    videoId: string;
    videoTitle: string;
    avgRating: number;
    ratingCount: number;
  }>;
}

/**
 * Get favorites statistics
 */
export async function getFavoriteStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<FavoriteStats> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get all favorites in date range
  const favorites = await prisma.favorite.findMany({
    where,
    include: {
      video: {
        select: {
          id: true,
          title: true,
          categories: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const totalFavorites = favorites.length;

  // Generate favorites trend (by day)
  const dateMap = new Map<string, number>();
  favorites.forEach((fav) => {
    const dateKey = fav.createdAt.toISOString().split('T')[0];
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  });

  const favoriteTrend = Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Get top favorited videos
  const videoCountMap = new Map<string, { title: string; count: number }>();
  favorites.forEach((fav) => {
    const existing = videoCountMap.get(fav.videoId);
    if (existing) {
      existing.count++;
    } else {
      videoCountMap.set(fav.videoId, {
        title: fav.video.title,
        count: 1,
      });
    }
  });

  const topFavorited = Array.from(videoCountMap.entries())
    .map(([videoId, data]) => ({
      videoId,
      videoTitle: data.title,
      favoriteCount: data.count,
    }))
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, 10);

  // Get category distribution
  const categoryDistribution: Record<string, number> = {};
  favorites.forEach((fav) => {
    fav.video.categories.forEach((category) => {
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
  });

  return {
    totalFavorites,
    favoriteTrend,
    topFavorited,
    categoryDistribution,
  };
}

/**
 * Get request statistics
 */
export async function getRequestStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<RequestStats> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get all requests
  const requests = await prisma.requestFromChild.findMany({
    where,
    orderBy: {
      createdAt: 'asc',
    },
  });

  const totalRequests = requests.length;

  // Count by type
  const requestsByType: Record<RequestType, number> = {
    MORE_LIKE_THIS: 0,
    SPECIFIC_TOPIC: 0,
    NEW_CHANNEL: 0,
    OTHER: 0,
  };

  requests.forEach((req) => {
    requestsByType[req.requestType]++;
  });

  // Calculate fulfillment rate
  const fulfilledRequests = requests.filter(
    (r) => r.status === RequestStatus.FULFILLED
  ).length;
  const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 0;

  // Count pending requests
  const pendingRequests = requests.filter(
    (r) => r.status === RequestStatus.PENDING
  ).length;

  // Extract top requested topics (from SPECIFIC_TOPIC requests)
  const topicCounts = new Map<string, number>();
  requests
    .filter((r) => r.requestType === RequestType.SPECIFIC_TOPIC && r.message)
    .forEach((req) => {
      const topic = req.message!.toLowerCase().trim();
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

  const topRequestedTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  // Generate request trend (by day)
  const dateMap = new Map<string, number>();
  requests.forEach((req) => {
    const dateKey = req.createdAt.toISOString().split('T')[0];
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  });

  const requestTrend = Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    totalRequests,
    requestsByType,
    fulfillmentRate,
    pendingRequests,
    topRequestedTopics,
    requestTrend,
  };
}

/**
 * Get content satisfaction metrics from journal entries
 */
export async function getContentSatisfactionMetrics(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<SatisfactionMetrics> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    rating: {
      not: null,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get journal entries with ratings
  const entries = await prisma.journalEntry.findMany({
    where,
    include: {
      video: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const totalRatings = entries.length;

  // Calculate average rating
  const ratings = entries.map((e) => e.rating!);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

  // Rating distribution (1-5 stars)
  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  entries.forEach((entry) => {
    const rating = entry.rating!;
    ratingDistribution[rating]++;
  });

  // Generate satisfaction trend (avg rating by day)
  const dateMap = new Map<string, { ratings: number[]; count: number }>();

  entries.forEach((entry) => {
    const dateKey = entry.createdAt.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey) || { ratings: [], count: 0 };

    existing.ratings.push(entry.rating!);
    existing.count++;

    dateMap.set(dateKey, existing);
  });

  const satisfactionTrend = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    avgRating:
      data.ratings.length > 0
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        : 0,
  }));

  // Get top rated videos
  const videoRatingsMap = new Map<
    string,
    { title: string; ratings: number[]; count: number }
  >();

  entries.forEach((entry) => {
    const existing = videoRatingsMap.get(entry.videoId);
    if (existing) {
      existing.ratings.push(entry.rating!);
      existing.count++;
    } else {
      videoRatingsMap.set(entry.videoId, {
        title: entry.video.title,
        ratings: [entry.rating!],
        count: 1,
      });
    }
  });

  const topRatedVideos = Array.from(videoRatingsMap.entries())
    .map(([videoId, data]) => ({
      videoId,
      videoTitle: data.title,
      avgRating:
        data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
      ratingCount: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10);

  return {
    avgRating,
    totalRatings,
    ratingDistribution,
    satisfactionTrend,
    topRatedVideos,
  };
}
