/**
 * Topic Videos API Endpoint
 * GET /api/graph/topic/[topicId]/videos?childId=X&limit=20
 *
 * Returns full list of videos for a topic
 * Used for on-demand loading when user clicks topic in sidebar
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getTopicVideos } from '@/lib/db/queries/graph';

export async function GET(request: NextRequest, { params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const searchParams = request.nextUrl.searchParams;
  const childId = searchParams.get('childId');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 20;

  try {
    // Validate childId required
    if (!childId) {
      return NextResponse.json({ error: 'childId query parameter is required' }, { status: 400 });
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'limit must be between 1 and 50' }, { status: 400 });
    }

    // Verify child profile exists
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!childProfile) {
      return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
    }

    // Verify topic exists and belongs to child
    const topic = await prisma.graphNode.findFirst({
      where: { id: topicId, childId },
      select: { id: true, label: true },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Get videos (no caching - this is on-demand, fresh data preferred)
    const videos = await getTopicVideos(childId, topicId, limit);

    return NextResponse.json({
      topic: {
        id: topic.id,
        label: topic.label,
      },
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error('Error fetching topic videos:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topic videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
