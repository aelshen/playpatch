/**
 * Video-Centered Graph API Endpoint
 * GET /api/graph/[childId]/video/[videoId]
 *
 * Returns subgraph focused on a specific video's topics
 * Used for "Explore Topics" button on video watch page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getGraphFromCache, setGraphInCache } from '@/lib/graph/cache';
import { getVideoGraph } from '@/lib/db/queries/graph';

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string; videoId: string } }
) {
  const { childId, videoId } = params;

  try {
    // Verify child profile exists
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!childProfile) {
      return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check cache first
    const cached = await getGraphFromCache('video', { childId, videoId });
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss - query database
    const graph = await getVideoGraph({ childId, videoId });

    // Store in cache
    await setGraphInCache('video', { childId, videoId }, graph);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Error fetching video graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch video graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
