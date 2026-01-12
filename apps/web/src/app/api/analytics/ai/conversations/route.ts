/**
 * AI Conversations API Endpoint
 * GET /api/analytics/ai/conversations
 * Returns paginated list of AI conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || 'all';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const skip = (page - 1) * limit;

    // Validate required parameters
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (profileId && profileId !== 'all') {
      where.childId = profileId;
    }

    // Get conversations with pagination
    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where,
        include: {
          child: {
            select: {
              id: true,
              name: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
            },
          },
          messages: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.aIConversation.count({ where }),
    ]);

    // Calculate duration and message count for each conversation
    const conversationsWithStats = conversations.map((conv) => {
      const duration = conv.endedAt
        ? Math.round((conv.endedAt.getTime() - conv.startedAt.getTime()) / 1000 / 60) // minutes
        : 0;

      return {
        id: conv.id,
        childId: conv.childId,
        childName: conv.child.name,
        videoId: conv.videoId,
        videoTitle: conv.video.title,
        startedAt: conv.startedAt,
        duration,
        messageCount: conv.messages.length,
        topics: conv.topics,
        wasFiltered: conv.hasFlags,
      };
    });

    logger.info(
      {
        userId: user.id,
        profileId,
        page,
        total,
      },
      'AI conversations retrieved'
    );

    return NextResponse.json({
      conversations: conversationsWithStats,
      total,
      page,
      limit,
    });
  } catch (error) {
    logger.error({ error }, 'AI conversations API error');

    return NextResponse.json(
      {
        error: 'Failed to retrieve AI conversations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
