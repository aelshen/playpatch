/**
 * Conversation Detail API Endpoint
 * GET /api/profiles/[profileId]/conversations/[conversationId]
 * Get full conversation with all messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getConversation } from '@/lib/ai/service';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: { profileId: string; conversationId: string } }
) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, conversationId } = params;

    // Verify child profile exists and belongs to user's family
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        ageRating: true,
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

    // Get conversation using existing service
    logger.info(
      { conversationId, childId: profileId },
      'Fetching conversation detail'
    );

    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify conversation belongs to this child
    if (conversation.childId !== profileId) {
      return NextResponse.json(
        { error: 'Unauthorized access to conversation' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        childId: conversation.childId,
        childName: conversation.child.name,
        videoId: conversation.videoId,
        videoTitle: conversation.video.title,
        videoThumbnail: conversation.video.thumbnailPath,
        startedAt: conversation.startedAt,
        endedAt: conversation.endedAt,
        isFavorite: conversation.isFavorite,
        topics: conversation.topics,
        childAgeRating: childProfile.ageRating,
        hasFlags: conversation.hasFlags,
        flags: conversation.flags,
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          wasFiltered: msg.wasFiltered,
        })),
      },
    });
  } catch (error) {
    logger.error(
      { error, profileId: params.profileId, conversationId: params.conversationId },
      'Failed to fetch conversation detail'
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
