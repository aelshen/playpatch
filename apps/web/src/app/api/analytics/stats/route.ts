/**
 * Analytics Stats API
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Get aggregate watch statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { subDays } from 'date-fns';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/stats
 * Get aggregate watch statistics for a child or all children
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

    // Calculate date filter
    let startDate: Date | undefined;
    if (dateRange === '7d') {
      startDate = subDays(new Date(), 7);
    } else if (dateRange === '30d') {
      startDate = subDays(new Date(), 30);
    }

    // Build where clause
    const where: any = {};

    // Filter by child profile if not "all", always scoped to the caller's family
    if (profileId !== 'all') {
      // Include familyId filter to prevent cross-family access with a guessed profileId
      where.childId = profileId;
      where.child = { user: { familyId: user.familyId } };
    } else {
      // Scope to the caller's family
      where.child = { user: { familyId: user.familyId } };
    }

    // Filter by date range
    if (startDate) {
      where.startedAt = { gte: startDate };
    }

    // Get aggregate stats
    const stats = await prisma.watchSession.aggregate({
      where,
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        duration: true,
      },
    });

    // Get completed videos count
    const completedCount = await prisma.watchSession.count({
      where: {
        ...where,
        completed: true,
      },
    });

    // Get unique videos watched
    const uniqueVideos = await prisma.watchSession.findMany({
      where,
      select: {
        videoId: true,
      },
      distinct: ['videoId'],
    });

    return NextResponse.json({
      totalWatchTime: stats._sum.duration || 0,
      totalSessions: stats._count.id || 0,
      completedVideos: completedCount,
      averageSessionDuration: Math.round(stats._avg.duration || 0),
      uniqueVideosWatched: uniqueVideos.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch analytics stats');
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
