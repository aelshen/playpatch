/**
 * AI Chat API Endpoint
 * POST /api/ai/chat
 * Send a message in an AI conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendAIChatMessage, isAIAvailable } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  videoId: z.string(),
  childProfileId: z.string(),
  message: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI features are enabled
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) {
      return NextResponse.json(
        {
          error: 'AI chat is currently unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = chatMessageSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validatedData.error.errors,
        },
        { status: 400 }
      );
    }

    const { conversationId, videoId, childProfileId, message } = validatedData.data;

    // Verify child profile exists and belongs to user's family
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childProfileId },
      select: {
        id: true,
        name: true,
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
                settings: {
                  select: {
                    allowAI: true,
                  },
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

    // Check if child has AI chat enabled
    if (!childProfile.user.family.settings?.allowAI) {
      return NextResponse.json(
        { error: 'AI chat is not enabled for this family' },
        { status: 403 }
      );
    }

    // Verify video exists and is approved
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        status: true,
        approvalStatus: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.status !== 'READY' || video.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Video is not available for chat' },
        { status: 400 }
      );
    }

    // Calculate child age from age rating (approximate)
    const ageRatingToAge: Record<string, number> = {
      AGE_2_PLUS: 3,
      AGE_4_PLUS: 5,
      AGE_7_PLUS: 8,
      AGE_10_PLUS: 11,
    };
    const childAge = ageRatingToAge[childProfile.ageRating] || 8;

    // Send message to AI
    logger.info(
      {
        childId: childProfile.id,
        videoId,
        conversationId,
        messageLength: message.length,
      },
      'Processing AI chat message'
    );

    const result = await sendAIChatMessage({
      conversationId,
      childId: childProfile.id,
      videoId,
      message,
      childAge,
      childName: childProfile.name,
    });

    return NextResponse.json({
      conversationId: result.conversationId,
      response: result.response,
      filtered: result.filtered,
    });
  } catch (error) {
    logger.error({ error }, 'AI chat API error');

    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export GET handler for health check
export async function GET() {
  try {
    const available = await isAIAvailable();
    return NextResponse.json({
      available,
      status: available ? 'ready' : 'unavailable',
    });
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
