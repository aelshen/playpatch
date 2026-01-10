/**
 * Analytics Sessions API
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Get recent watch sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { subDays } from 'date-fns';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/sessions
 * Get recent watch sessions for a child or all children
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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

    // Get recent watch sessions
    const sessions = await prisma.watchSession.findMany({
      where,
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
      take: limit,
    });

    return NextResponse.json({
      sessions,
      total: sessions.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch analytics sessions');
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
