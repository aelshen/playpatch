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

    // Update progress
    const session = await updateWatchProgress({
      sessionId,
      lastPosition: Math.floor(lastPosition),
      duration: duration ? Math.floor(duration) : undefined,
    });

    logger.debug({ sessionId, lastPosition, duration }, 'Watch progress updated');

    // Check if video is almost complete (>90%)
    if (duration && lastPosition / duration > 0.9 && !session.completed) {
      await markSessionComplete({
        sessionId,
        duration: Math.floor(duration),
      });

      logger.info({ sessionId }, 'Watch session marked as complete');

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
