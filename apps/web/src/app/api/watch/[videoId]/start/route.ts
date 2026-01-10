/**
 * Watch Session Start API
 * SSK-075: Video Player Component
 *
 * API endpoint for starting a watch session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentChildProfile } from '@/lib/auth/session';
import { createWatchSession } from '@/lib/db/queries/watch-sessions';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/watch/[videoId]/start
 * Create a new watch session
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;

    logger.info({ videoId }, 'Starting watch session');

    // Get current child profile
    const childProfile = await getCurrentChildProfile();
    if (!childProfile) {
      logger.warn({ videoId }, 'No child profile selected');
      return NextResponse.json(
        { error: 'No child profile selected' },
        { status: 401 }
      );
    }

    logger.info({ videoId, childId: childProfile.id }, 'Creating watch session');

    // Create watch session
    const session = await createWatchSession({
      childId: childProfile.id,
      videoId,
    });

    logger.info({ sessionId: session.id, videoId, childId: childProfile.id }, 'Watch session created');

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start watch session');
    return NextResponse.json(
      { error: 'Failed to start watch session' },
      { status: 500 }
    );
  }
}
