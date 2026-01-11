/**
 * Smart Recommendation Engine
 * Content-based recommendations using categories, topics, and watch history
 */

import type { Video, Channel, AgeRating } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import {
  getChildWatchedVideoIds,
  getVideosWithSimilarTopics,
  getVideosInCategories,
  getMostWatchedVideos,
  getVideosFromChannel,
} from '@/lib/db/queries/recommendations';

export interface VideoWithChannel extends Video {
  channel: Channel | null;
}

export interface RecommendationParams {
  currentVideoId: string;
  childProfileId: string;
  familyId: string;
  limit?: number;
}

export interface ScoredVideo {
  video: VideoWithChannel;
  score: number;
  reasons: string[];
}

/**
 * Scoring weights for recommendation algorithm
 */
const WEIGHTS = {
  CATEGORY_MATCH: 0.4, // 40%
  TOPIC_OVERLAP: 0.3, // 30%
  WATCH_HISTORY: 0.2, // 20%
  AGE_APPROPRIATENESS: 0.1, // 10%
};

/**
 * Get recommended videos for a child based on current video
 */
export async function getRecommendedVideos({
  currentVideoId,
  childProfileId,
  familyId,
  limit = 10,
}: RecommendationParams): Promise<VideoWithChannel[]> {
  // Get current video details
  const currentVideo = await prisma.video.findUnique({
    where: { id: currentVideoId },
    include: { channel: true },
  });

  if (!currentVideo) {
    return [];
  }

  // Get child profile
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
  });

  if (!childProfile) {
    return [];
  }

  // Get recently watched video IDs (last 7 days)
  const recentlyWatchedIds = await getChildWatchedVideoIds(childProfileId, 7);
  const excludeIds = [...recentlyWatchedIds, currentVideoId];

  // Get candidate videos from multiple sources
  let topicVideos: VideoWithChannel[] = [];
  let categoryVideos: VideoWithChannel[] = [];
  let channelVideos: VideoWithChannel[] = [];
  let popularVideos: VideoWithChannel[] = [];

  try {
    // Videos with similar topics
    if (currentVideo.topics && Array.isArray(currentVideo.topics) && currentVideo.topics.length > 0) {
      topicVideos = await getVideosWithSimilarTopics(
        currentVideo.topics as string[],
        childProfile.ageRating,
        excludeIds,
        30
      );
    }
  } catch (error) {
    console.error('Error fetching topic videos:', error);
  }

  try {
    // Videos in same categories
    if (currentVideo.categories && Array.isArray(currentVideo.categories) && currentVideo.categories.length > 0) {
      categoryVideos = await getVideosInCategories(
        currentVideo.categories as string[],
        childProfile.ageRating,
        excludeIds,
        30
      );
    }
  } catch (error) {
    console.error('Error fetching category videos:', error);
  }

  try {
    // Videos from same channel
    if (currentVideo.channelId) {
      channelVideos = await getVideosFromChannel(
        currentVideo.channelId,
        childProfile.ageRating,
        excludeIds,
        20
      );
    }
  } catch (error) {
    console.error('Error fetching channel videos:', error);
  }

  try {
    // Popular videos (fallback)
    popularVideos = await getMostWatchedVideos(familyId, childProfile.ageRating, excludeIds, 20);
  } catch (error) {
    console.error('Error fetching popular videos:', error);
  }

  // Combine all candidates (remove duplicates)
  const candidateMap = new Map<string, VideoWithChannel>();
  [...topicVideos, ...categoryVideos, ...channelVideos, ...popularVideos].forEach((video) => {
    if (!candidateMap.has(video.id)) {
      candidateMap.set(video.id, video);
    }
  });

  const candidates = Array.from(candidateMap.values());

  // If no candidates found, return empty array
  if (candidates.length === 0) {
    console.log('No candidate videos found for recommendations');
    return [];
  }

  // Score each candidate
  const scoredVideos = candidates.map((video) =>
    scoreVideo(video, currentVideo, childProfile.ageRating)
  );

  // Sort by score (highest first) and return top N
  scoredVideos.sort((a, b) => b.score - a.score);

  return scoredVideos.slice(0, limit).map((sv) => sv.video);
}

/**
 * Score a candidate video based on similarity to current video
 */
function scoreVideo(
  candidate: VideoWithChannel,
  currentVideo: Video,
  childAgeRating: AgeRating
): ScoredVideo {
  let score = 0;
  const reasons: string[] = [];

  // 1. Category match score (40%)
  const categoryScore = calculateCategoryScore(
    candidate.categories as string[],
    currentVideo.categories as string[]
  );
  score += categoryScore * WEIGHTS.CATEGORY_MATCH;
  if (categoryScore > 0) {
    reasons.push('Similar category');
  }

  // 2. Topic overlap score (30%)
  const topicScore = calculateTopicScore(
    candidate.topics as string[],
    currentVideo.topics as string[]
  );
  score += topicScore * WEIGHTS.TOPIC_OVERLAP;
  if (topicScore > 0) {
    reasons.push('Related topics');
  }

  // 3. Watch history score (20%)
  // Videos from same channel are more likely to be watched
  const historyScore = candidate.channelId === currentVideo.channelId ? 1.0 : 0.5;
  score += historyScore * WEIGHTS.WATCH_HISTORY;
  if (candidate.channelId === currentVideo.channelId) {
    reasons.push('Same channel');
  }

  // 4. Age appropriateness score (10%)
  const ageScore = calculateAgeScore(candidate.ageRating, childAgeRating);
  score += ageScore * WEIGHTS.AGE_APPROPRIATENESS;

  return {
    video: candidate,
    score,
    reasons,
  };
}

/**
 * Calculate category match score (0-1)
 */
function calculateCategoryScore(
  candidateCategories: string[] | null,
  currentCategories: string[] | null
): number {
  if (!candidateCategories || !currentCategories) return 0;
  if (candidateCategories.length === 0 || currentCategories.length === 0) return 0;

  const candidateSet = new Set(candidateCategories);
  const matches = currentCategories.filter((cat) => candidateSet.has(cat)).length;

  // Jaccard similarity
  const union = new Set([...candidateCategories, ...currentCategories]).size;
  return matches / union;
}

/**
 * Calculate topic overlap score (0-1)
 */
function calculateTopicScore(
  candidateTopics: string[] | null,
  currentTopics: string[] | null
): number {
  if (!candidateTopics || !currentTopics) return 0;
  if (candidateTopics.length === 0 || currentTopics.length === 0) return 0;

  const candidateSet = new Set(candidateTopics.map((t) => t.toLowerCase()));
  const matches = currentTopics.filter((topic) =>
    candidateSet.has(topic.toLowerCase())
  ).length;

  // Jaccard similarity
  const union = new Set([
    ...candidateTopics.map((t) => t.toLowerCase()),
    ...currentTopics.map((t) => t.toLowerCase()),
  ]).size;
  return matches / union;
}

/**
 * Calculate age appropriateness score (0-1)
 * Perfect match = 1.0, lower rating = 0.8, higher rating = 0 (filtered out)
 */
function calculateAgeScore(candidateRating: AgeRating, childRating: AgeRating): number {
  const ratingOrder: AgeRating[] = ['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS'];

  const candidateIndex = ratingOrder.indexOf(candidateRating);
  const childIndex = ratingOrder.indexOf(childRating);

  if (candidateIndex === childIndex) {
    return 1.0; // Perfect match
  } else if (candidateIndex < childIndex) {
    return 0.8; // Lower rating (still appropriate but less engaging)
  } else {
    return 0; // Higher rating (should be filtered out by queries)
  }
}

/**
 * Calculate overlap between two arrays (for testing)
 */
export function calculateOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;

  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const matches = arr2.filter((item) => set1.has(item.toLowerCase())).length;

  const union = new Set([...arr1.map((s) => s.toLowerCase()), ...arr2.map((s) => s.toLowerCase())])
    .size;
  return matches / union;
}
