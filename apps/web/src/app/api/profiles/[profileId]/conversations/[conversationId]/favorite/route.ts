/**
 * Toggle Favorite API Endpoint
 * POST /api/profiles/[profileId]/conversations/[conversationId]/favorite
 * Toggle favorite status of a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { profileId: string; conversationId: string } }
) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, conversationId } = params;

    // Parse request body
    const body = await request.json();
    const { isFavorite } = body;

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite must be a boolean' },
        { status: 400 }
      );
    }

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

    // Verify conversation exists and belongs to this child
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        childId: true,
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

    // Update favorite status
    logger.info(
      { conversationId, childId: profileId, isFavorite },
      'Updating conversation favorite status'
    );

    const updated = await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { isFavorite },
      select: {
        id: true,
        isFavorite: true,
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    logger.error(
      { error, profileId: params.profileId, conversationId: params.conversationId },
      'Failed to toggle favorite status'
    );

    return NextResponse.json(
      {
        error: 'Failed to update favorite status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
