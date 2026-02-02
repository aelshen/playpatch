/**
 * Analytics Most Watched API
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Get most watched videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { subDays } from 'date-fns';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/most-watched
 * Get most watched videos for a child or all children
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || 'all';
    const dateRange = searchParams.get('dateRange') || '7d';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Calculate date filter
    let startDate: Date | undefined;
    if (dateRange === '7d') {
      startDate = subDays(new Date(), 7);
    } else if (dateRange === '30d') {
      startDate = subDays(new Date(), 30);
    }

    // Build where clause
    const where: any = {};

    // Filter by child profile if not "all"
    if (profileId !== 'all') {
      where.childId = profileId;
    } else {
      // Filter by user - get all child profiles for this user
      const profiles = await prisma.childProfile.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      where.childId = { in: profiles.map((p) => p.id) };
    }

    // Filter by date range
    if (startDate) {
      where.startedAt = { gte: startDate };
    }

    // Get video stats grouped by videoId
    const videoStats = await prisma.watchSession.groupBy({
      by: ['videoId'],
      where,
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

    return NextResponse.json({
      videos: result,
      total: result.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch most watched videos');
    return NextResponse.json(
      { error: 'Failed to fetch most watched videos' },
      { status: 500 }
    );
  }
}
