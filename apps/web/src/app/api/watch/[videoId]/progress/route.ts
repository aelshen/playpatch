/**
 * Watch Session Progress API
 * SSK-075: Video Player Component
 *
 * API endpoint for updating watch progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentChildProfile } from '@/lib/auth/session';
import {
  updateWatchProgress,
  markSessionComplete,
} from '@/lib/db/queries/watch-sessions';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/watch/[videoId]/progress
 * Update watch progress
 */
export async function PATCH(
  request: NextRequest,
  _context: { params: { videoId: string } }
) {
  try {
    const body = await request.json();
    const { sessionId, lastPosition, duration } = body;

    if (!sessionId || typeof lastPosition !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current child profile (verify session ownership)
    const childProfile = await getCurrentChildProfile();
    if (!childProfile) {
      return NextResponse.json(
        { error: 'No child profile selected' },
        { status: 401 }
      );
    }

    // Verify the watch session belongs to this child before updating
    const ownedSession = await prisma.watchSession.findFirst({
      where: { id: sessionId, childId: childProfile.id },
    });
    if (!ownedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update progress using the verified session ID
    const session = await updateWatchProgress({
      sessionId: ownedSession.id,
      lastPosition: Math.floor(lastPosition),
      duration: duration ? Math.floor(duration) : undefined,
    });

    logger.debug({ sessionId: ownedSession.id, lastPosition, duration }, 'Watch progress updated');

    // Check if video is almost complete (>90%)
    if (duration && lastPosition / duration > 0.9 && !session.completed) {
      await markSessionComplete({
        sessionId: ownedSession.id,
        duration: Math.floor(duration),
      });

      logger.info({ sessionId: ownedSession.id }, 'Watch session marked as complete');

      return NextResponse.json({
        success: true,
        completed: true,
      });
    }

    return NextResponse.json({
      success: true,
      completed: false,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update watch progress');
    return NextResponse.json(
      { error: 'Failed to update watch progress' },
      { status: 500 }
    );
  }
}
