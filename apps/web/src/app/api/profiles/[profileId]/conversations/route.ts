/**
 * List Conversations API Endpoint
 * GET /api/profiles/[profileId]/conversations
 * Get paginated list of conversations for a child profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = params;
    const searchParams = request.nextUrl.searchParams;

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Filter params
    const search = searchParams.get('search') || '';
    const favorited = searchParams.get('favorited') === 'true';
    const videoId = searchParams.get('videoId') || undefined;

    // Verify child profile exists and belongs to user's family
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        user: {
          select: {
            familyId: true,
            family: {
              select: {
                users: {
                  where: { id: user.id },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Child profile not found' },
        { status: 404 }
      );
    }

    if (childProfile.user.family.users.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized access to child profile' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      childId: profileId,
    };

    if (favorited) {
      where.isFavorite = true;
    }

    if (videoId) {
      where.videoId = videoId;
    }

    // Search by video title or topics
    if (search) {
      where.OR = [
        {
          video: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          topics: {
            has: search,
          },
        },
      ];
    }

    // Get conversations with video info and message preview
    logger.info(
      { childId: profileId, page, limit, search, favorited, videoId },
      'Fetching conversations list'
    );

    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnailPath: true,
              duration: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              role: true,
              content: true,
              createdAt: true,
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

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        videoId: conv.videoId,
        videoTitle: conv.video.title,
        videoThumbnail: conv.video.thumbnailPath,
        videoDuration: conv.video.duration,
        startedAt: conv.startedAt,
        endedAt: conv.endedAt,
        isFavorite: conv.isFavorite,
        topics: conv.topics,
        messageCount: conv.messages.length,
        lastMessage: conv.messages[0] || null,
        hasFlags: conv.hasFlags,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ error, profileId: params.profileId }, 'Failed to fetch conversations');

    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
