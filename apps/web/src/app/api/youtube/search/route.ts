/**
 * GET /api/youtube/search
 * Search YouTube for child-safe content using yt-dlp.
 *
 * Query params:
 *   q         — search query (required)
 *   limit     — number of results, default 10, max 20
 *   ageRating — optional age rating scope (e.g. AGE_4_PLUS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { searchYouTube } from '@/lib/media/youtube-search';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const q = searchParams.get('q');
    if (!q || !q.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const rawLimit = parseInt(searchParams.get('limit') ?? '10', 10);
    const limit = Math.min(isNaN(rawLimit) ? 10 : rawLimit, 20);

    const ageRating = searchParams.get('ageRating') ?? undefined;

    logger.info({ userId: user.id, q, limit, ageRating }, 'YouTube search request');

    const results = await searchYouTube(q, { limit, ageRating });

    return NextResponse.json({ results });
  } catch (error) {
    logger.error({ error }, 'YouTube search failed');

    const message = error instanceof Error ? error.message : 'Failed to search YouTube';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
