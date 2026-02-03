/**
 * Full Child Graph API Endpoint
 * GET /api/graph/[childId]?limit=50
 *
 * Returns top N ranked nodes and edges for a child's knowledge graph
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getGraphFromCache, setGraphInCache } from '@/lib/graph/cache';
import { getChildGraph } from '@/lib/db/queries/graph';

export async function GET(request: NextRequest, { params }: { params: { childId: string } }) {
  const { childId } = params;
  const searchParams = request.nextUrl.searchParams;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 50;

  try {
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'limit must be between 1 and 100' }, { status: 400 });
    }

    // Verify child profile exists
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!childProfile) {
      return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
    }

    // Check cache first
    const cached = await getGraphFromCache('full', { childId, limit });
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss - query database
    const graph = await getChildGraph({ childId, limit });

    // Store in cache for next request
    await setGraphInCache('full', { childId, limit }, graph);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Error fetching child graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
