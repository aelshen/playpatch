/**
 * Resume Conversation API Endpoint
 * POST /api/profiles/[profileId]/conversations/[conversationId]/resume
 * Generate redirect URL to resume a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function POST(
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
        uiMode: true,
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

    // Verify conversation exists and belongs to this child
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        childId: true,
        videoId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.childId !== profileId) {
      return NextResponse.json(
        { error: 'Unauthorized access to conversation' },
        { status: 403 }
      );
    }

    // Generate redirect URL with mode and conversationId
    const mode = childProfile.uiMode.toLowerCase();
    const redirectUrl = `/child/${mode}/watch/${conversation.videoId}?conversationId=${conversationId}`;

    logger.info(
      { conversationId, childId: profileId, videoId: conversation.videoId },
      'Generated resume conversation URL'
    );

    return NextResponse.json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    logger.error(
      { error, profileId: params.profileId, conversationId: params.conversationId },
      'Failed to generate resume URL'
    );

    return NextResponse.json(
      {
        error: 'Failed to resume conversation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
