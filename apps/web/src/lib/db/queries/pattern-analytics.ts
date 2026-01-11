/**
 * Pattern Analytics Query Functions
 * Database queries for viewing patterns and content flow
 */

import { prisma } from '../client';

export interface HeatmapDataPoint {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  watchTime: number; // minutes
  sessionCount: number;
}

export interface ContentFlow {
  categoryTransitions: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  topicTransitions: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

export interface DeviceStats {
  deviceTypes: Record<string, number>;
  totalSessions: number;
}

/**
 * Get heatmap data (viewing patterns by day/hour)
 */
export async function getHeatmapData(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<HeatmapDataPoint[]> {
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

  // Get all watch sessions
  const sessions = await prisma.watchSession.findMany({
    where,
    select: {
      startedAt: true,
      duration: true,
    },
  });

  // Group by day and hour
  const heatmapMap = new Map<string, { watchTime: number; sessionCount: number }>();

  sessions.forEach((session) => {
    const date = session.startedAt;
    const day = date.getDay(); // 0-6 (Sun-Sat)
    const hour = date.getHours(); // 0-23

    const key = `${day}-${hour}`;
    const existing = heatmapMap.get(key) || { watchTime: 0, sessionCount: 0 };

    existing.watchTime += session.duration / 60; // Convert seconds to minutes
    existing.sessionCount++;

    heatmapMap.set(key, existing);
  });

  // Convert to array
  const heatmapData: HeatmapDataPoint[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const data = heatmapMap.get(key) || { watchTime: 0, sessionCount: 0 };

      heatmapData.push({
        day,
        hour,
        watchTime: Math.round(data.watchTime),
        sessionCount: data.sessionCount,
      });
    }
  }

  return heatmapData;
}

/**
 * Get content flow data (category/topic transitions)
 */
export async function getContentFlowData(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<ContentFlow> {
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

  // Get watch sessions with video details
  const sessions = await prisma.watchSession.findMany({
    where,
    include: {
      video: {
        select: {
          categories: true,
          topics: true,
        },
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  });

  // Track category transitions
  const categoryTransitionMap = new Map<string, number>();

  for (let i = 0; i < sessions.length - 1; i++) {
    const currentVideo = sessions[i].video;
    const nextVideo = sessions[i + 1].video;

    // Check if same child (sessions are already filtered by child if provided)
    // Create transitions for each category combination
    currentVideo.categories.forEach((fromCategory) => {
      nextVideo.categories.forEach((toCategory) => {
        if (fromCategory !== toCategory) {
          const key = `${fromCategory}→${toCategory}`;
          categoryTransitionMap.set(key, (categoryTransitionMap.get(key) || 0) + 1);
        }
      });
    });
  }

  // Track topic transitions (similar logic)
  const topicTransitionMap = new Map<string, number>();

  for (let i = 0; i < sessions.length - 1; i++) {
    const currentVideo = sessions[i].video;
    const nextVideo = sessions[i + 1].video;

    // Only track if topics exist
    if (currentVideo.topics.length > 0 && nextVideo.topics.length > 0) {
      currentVideo.topics.slice(0, 3).forEach((fromTopic) => {
        nextVideo.topics.slice(0, 3).forEach((toTopic) => {
          if (fromTopic !== toTopic) {
            const key = `${fromTopic}→${toTopic}`;
            topicTransitionMap.set(key, (topicTransitionMap.get(key) || 0) + 1);
          }
        });
      });
    }
  }

  // Convert to arrays
  const categoryTransitions = Array.from(categoryTransitionMap.entries())
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20

  const topicTransitions = Array.from(topicTransitionMap.entries())
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20

  return {
    categoryTransitions,
    topicTransitions,
  };
}

/**
 * Get device usage statistics
 */
export async function getDeviceUsageStats(params: {
  childId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<DeviceStats> {
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

  // Get all watch sessions with device info
  const sessions = await prisma.watchSession.findMany({
    where,
    select: {
      deviceType: true,
    },
  });

  const totalSessions = sessions.length;

  // Count by device type
  const deviceTypes: Record<string, number> = {};

  sessions.forEach((session) => {
    const type = session.deviceType || 'unknown';
    deviceTypes[type] = (deviceTypes[type] || 0) + 1;
  });

  return {
    deviceTypes,
    totalSessions,
  };
}
