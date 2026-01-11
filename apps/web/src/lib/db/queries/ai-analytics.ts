/**
 * AI Analytics Query Functions
 * Database queries for AI conversation analytics
 */

import { prisma } from '../client';

export interface AIConversationStats {
  totalConversations: number;
  totalMessages: number;
  avgConversationLength: number;
  avgResponseTime: number;
  filterRate: number;
  totalTokensUsed: number;
  topicsDiscussed: string[];
}

export interface TopicCount {
  name: string;
  count: number;
  videos: string[];
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface SafetyStats {
  totalMessages: number;
  filteredMessages: number;
  filterRate: number;
  flagsByType: Record<string, number>;
  safetyTrends: Array<{ date: string; flagged: number; total: number }>;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  totalTokensUsed: number;
  errorRate: number;
  performanceTrend: TimeSeriesDataPoint[];
}

/**
 * Get aggregate AI conversation statistics
 */
export async function getAIConversationStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<AIConversationStats> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    startedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get conversations
  const conversations = await prisma.aIConversation.findMany({
    where,
    include: {
      messages: true,
    },
  });

  // Calculate statistics
  const totalConversations = conversations.length;
  const allMessages = conversations.flatMap((c) => c.messages);
  const totalMessages = allMessages.length;

  const avgConversationLength =
    totalConversations > 0 ? totalMessages / totalConversations : 0;

  // Calculate avg response time
  const responseTimes = allMessages
    .filter((m) => m.processingTime !== null)
    .map((m) => m.processingTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

  // Calculate filter rate
  const filteredMessages = allMessages.filter((m) => m.wasFiltered).length;
  const filterRate = totalMessages > 0 ? (filteredMessages / totalMessages) * 100 : 0;

  // Calculate total tokens used
  const totalTokensUsed = allMessages
    .filter((m) => m.tokenCount !== null)
    .reduce((sum, m) => sum + (m.tokenCount || 0), 0);

  // Extract unique topics
  const topicsSet = new Set<string>();
  conversations.forEach((c) => {
    c.topics.forEach((topic) => topicsSet.add(topic));
  });
  const topicsDiscussed = Array.from(topicsSet);

  return {
    totalConversations,
    totalMessages,
    avgConversationLength,
    avgResponseTime,
    filterRate,
    totalTokensUsed,
    topicsDiscussed,
  };
}

/**
 * Get topics discussed with counts
 */
export async function getTopicsDiscussed(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
}): Promise<TopicCount[]> {
  const { childId, startDate, endDate, limit = 20 } = params;

  // Base where clause
  const where: any = {
    startedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get conversations with topics
  const conversations = await prisma.aIConversation.findMany({
    where,
    select: {
      topics: true,
      videoId: true,
    },
  });

  // Count topics
  const topicMap = new Map<string, { count: number; videos: Set<string> }>();

  conversations.forEach((conv) => {
    conv.topics.forEach((topic) => {
      const existing = topicMap.get(topic);
      if (existing) {
        existing.count++;
        existing.videos.add(conv.videoId);
      } else {
        topicMap.set(topic, { count: 1, videos: new Set([conv.videoId]) });
      }
    });
  });

  // Convert to array and sort by count
  const topics = Array.from(topicMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      videos: Array.from(data.videos),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return topics;
}

/**
 * Get AI conversations grouped by time period
 */
export async function getAIConversationsByPeriod(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week';
}): Promise<TimeSeriesDataPoint[]> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    startedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get conversations
  const conversations = await prisma.aIConversation.findMany({
    where,
    select: {
      startedAt: true,
    },
    orderBy: {
      startedAt: 'asc',
    },
  });

  // Group by date
  const dateMap = new Map<string, number>();

  conversations.forEach((conv) => {
    const dateKey = conv.startedAt.toISOString().split('T')[0]; // YYYY-MM-DD
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  });

  return Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get safety filtering statistics
 */
export async function getSafetyFilteringStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<SafetyStats> {
  const { childId, startDate, endDate } = params;

  // Base where clause for conversations
  const conversationWhere: any = {
    startedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    conversationWhere.childId = childId;
  }

  // Get all messages through conversations
  const conversations = await prisma.aIConversation.findMany({
    where: conversationWhere,
    include: {
      messages: true,
    },
  });

  const allMessages = conversations.flatMap((c) => c.messages);
  const totalMessages = allMessages.length;
  const filteredMessages = allMessages.filter((m) => m.wasFiltered).length;
  const filterRate = totalMessages > 0 ? (filteredMessages / totalMessages) * 100 : 0;

  // Count flags by type (from conversation flags)
  const flagsByType: Record<string, number> = {};
  conversations.forEach((conv) => {
    if (conv.flags && Array.isArray(conv.flags)) {
      (conv.flags as any[]).forEach((flag: any) => {
        if (flag.type) {
          flagsByType[flag.type] = (flagsByType[flag.type] || 0) + 1;
        }
      });
    }
  });

  // Generate safety trends (grouped by day)
  const dateMap = new Map<string, { flagged: number; total: number }>();

  conversations.forEach((conv) => {
    const dateKey = conv.startedAt.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey) || { flagged: 0, total: 0 };

    const convMessages = conv.messages;
    const convFiltered = convMessages.filter((m) => m.wasFiltered).length;

    existing.total += convMessages.length;
    existing.flagged += convFiltered;

    dateMap.set(dateKey, existing);
  });

  const safetyTrends = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    flagged: data.flagged,
    total: data.total,
  }));

  return {
    totalMessages,
    filteredMessages,
    filterRate,
    flagsByType,
    safetyTrends,
  };
}

/**
 * Get AI performance metrics
 */
export async function getAIPerformanceMetrics(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<PerformanceMetrics> {
  const { childId, startDate, endDate } = params;

  // Base where clause
  const where: any = {
    startedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (childId && childId !== 'all') {
    where.childId = childId;
  }

  // Get conversations with messages
  const conversations = await prisma.aIConversation.findMany({
    where,
    include: {
      messages: true,
    },
  });

  const allMessages = conversations.flatMap((c) => c.messages);

  // Calculate avg response time
  const responseTimes = allMessages
    .filter((m) => m.processingTime !== null)
    .map((m) => m.processingTime!);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

  // Calculate total tokens used
  const totalTokensUsed = allMessages
    .filter((m) => m.tokenCount !== null)
    .reduce((sum, m) => sum + (m.tokenCount || 0), 0);

  // Error rate (conversations with flags / total)
  const conversationsWithFlags = conversations.filter((c) => c.hasFlags).length;
  const errorRate =
    conversations.length > 0 ? (conversationsWithFlags / conversations.length) * 100 : 0;

  // Performance trend (avg response time by day)
  const dateMap = new Map<string, { times: number[]; count: number }>();

  conversations.forEach((conv) => {
    const dateKey = conv.startedAt.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey) || { times: [], count: 0 };

    conv.messages.forEach((msg) => {
      if (msg.processingTime !== null) {
        existing.times.push(msg.processingTime);
        existing.count++;
      }
    });

    dateMap.set(dateKey, existing);
  });

  const performanceTrend = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    count: data.times.length > 0
      ? data.times.reduce((sum, time) => sum + time, 0) / data.times.length
      : 0,
  }));

  return {
    avgResponseTime,
    totalTokensUsed,
    errorRate,
    performanceTrend,
  };
}
