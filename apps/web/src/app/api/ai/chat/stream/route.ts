/**
 * AI Chat Streaming API Endpoint
 * POST /api/ai/chat/stream
 * Stream AI responses in real-time
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamAIChatMessage, isAIAvailable } from '@/lib/ai';
import { getCurrentChildProfile } from '@/lib/auth/session';
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
    // Verify child session
    const childProfile = await getCurrentChildProfile();
    if (!childProfile) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if AI features are enabled
    const aiAvailable = await isAIAvailable();
    if (!aiAvailable) {
      return new Response(
        JSON.stringify({ error: 'AI chat is currently unavailable. Please try again later.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = chatMessageSchema.safeParse(body);

    if (!validatedData.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validatedData.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { conversationId, videoId, childProfileId, message } = validatedData.data;

    // Ensure session matches the requested child profile
    if (childProfile.id !== childProfileId) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to child profile' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check family AI settings
    const childUser = await prisma.user.findUnique({
      where: { id: childProfile.userId },
      select: { family: { select: { settings: { select: { allowAI: true } } } } },
    });

    if (!childUser?.family?.settings?.allowAI) {
      return new Response(JSON.stringify({ error: 'AI chat is not enabled for this family' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify video exists, is approved, and is watchable
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, approvalStatus: true, playbackMode: true },
    });

    if (!video) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (video.approvalStatus !== 'APPROVED' || !['EMBED', 'HLS'].includes(video.playbackMode)) {
      return new Response(JSON.stringify({ error: 'Video is not available for chat' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate child age from age rating (approximate)
    const ageRatingToAge: Record<string, number> = {
      AGE_2_PLUS: 3,
      AGE_4_PLUS: 5,
      AGE_7_PLUS: 8,
      AGE_10_PLUS: 11,
    };
    const childAge = ageRatingToAge[childProfile.ageRating] || 8;

    logger.info(
      {
        childId: childProfile.id,
        videoId,
        conversationId,
        messageLength: message.length,
      },
      'Processing streaming AI chat message'
    );

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the AI response
          for await (const chunk of streamAIChatMessage({
            conversationId,
            childId: childProfile.id,
            videoId,
            message,
            childAge,
            childName: childProfile.name,
          })) {
            // Send each chunk as Server-Sent Event
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          logger.error({ error }, 'Streaming error');
          const errorData = JSON.stringify({
            error: 'Stream failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error({ error }, 'AI chat streaming API error');

    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
