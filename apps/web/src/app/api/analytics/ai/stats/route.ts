/**
 * AI Stats API Endpoint
 * GET /api/analytics/ai/stats
 * Returns aggregate AI conversation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getAIConversationStats } from '@/lib/db/queries';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || 'all';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate required parameters
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Get AI conversation stats
    const stats = await getAIConversationStats({
      childId: profileId,
      startDate,
      endDate,
    });

    logger.info(
      {
        userId: user.id,
        profileId,
        startDate: startDateStr,
        endDate: endDateStr,
      },
      'AI stats retrieved'
    );

    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, 'AI stats API error');

    return NextResponse.json(
      {
        error: 'Failed to retrieve AI stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
