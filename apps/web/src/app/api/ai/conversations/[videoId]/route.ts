/**
 * AI Conversations API Endpoint
 * GET /api/ai/conversations/[videoId]?childProfileId=X
 * Get conversation history for a child watching a video
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationsForVideo } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params;

  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const childProfileId = searchParams.get('childProfileId');

    if (!childProfileId) {
      return NextResponse.json(
        { error: 'childProfileId is required' },
        { status: 400 }
      );
    }

    // Verify child profile exists and belongs to user's family
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childProfileId },
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

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get conversations
    logger.info(
      { childId: childProfile.id, videoId },
      'Fetching AI conversations'
    );

    const conversations = await getConversationsForVideo(childProfile.id, videoId);

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        createdAt: conv.createdAt,
        messages: conv.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      })),
      count: conversations.length,
    });
  } catch (error) {
    logger.error({ error, videoId }, 'Failed to fetch AI conversations');

    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
