/**
 * Topic Neighborhood API Endpoint
 * GET /api/graph/[childId]/topic/[topicId]?depth=1
 *
 * Returns single topic with immediate neighbors
 * Used for click-to-focus interaction in graph
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getGraphFromCache, setGraphInCache } from '@/lib/graph/cache';
import { getTopicNeighborhood } from '@/lib/db/queries/graph';

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string; topicId: string } }
) {
  const { childId, topicId } = params;
  const searchParams = request.nextUrl.searchParams;
  const depthStr = searchParams.get('depth');
  const depth = depthStr ? parseInt(depthStr, 10) : 1;

  try {
    // Validate depth (max 2 hops to prevent huge result sets)
    if (isNaN(depth) || depth < 1 || depth > 2) {
      return NextResponse.json({ error: 'depth must be 1 or 2' }, { status: 400 });
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
      select: { id: true },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Check cache first
    const cached = await getGraphFromCache('neighborhood', { childId, topicId, depth });
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss - query database
    const graph = await getTopicNeighborhood({ childId, topicId, depth });

    // Store in cache
    await setGraphInCache('neighborhood', { childId, topicId, depth }, graph);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Error fetching topic neighborhood:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch topic neighborhood',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
