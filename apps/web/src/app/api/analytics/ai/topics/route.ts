/**
 * AI Topics API Endpoint
 * GET /api/analytics/ai/topics
 * Returns topics discussed in AI conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getTopicsDiscussed } from '@/lib/db/queries';
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
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

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

    // Get topics discussed, scoped to the authenticated user's family
    const topics = await getTopicsDiscussed({
      childId: profileId,
      familyId: user.familyId as string,
      startDate,
      endDate,
      limit,
    });

    logger.info(
      {
        userId: user.id,
        profileId,
        topicCount: topics.length,
      },
      'AI topics retrieved'
    );

    return NextResponse.json({ topics });
  } catch (error) {
    logger.error({ error }, 'AI topics API error');

    return NextResponse.json(
      {
        error: 'Failed to retrieve AI topics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
