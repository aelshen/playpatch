/**
 * Category-Filtered Graph API Endpoint
 * GET /api/graph/[childId]/category/[category]?limit=50
 *
 * Returns nodes in a specific category only
 * Used for category filter dropdown in Explorer mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getGraphFromCache, setGraphInCache } from '@/lib/graph/cache';
import { getCategoryGraph } from '@/lib/db/queries/graph';

export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string; category: string } }
) {
  const { childId, category } = params;
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

    // Decode category (URL encoded)
    const decodedCategory = decodeURIComponent(category);

    // Check cache first
    const cached = await getGraphFromCache('category', {
      childId,
      category: decodedCategory,
      limit,
    });
    if (cached) {
      return NextResponse.json(cached);
    }

    // Cache miss - query database
    const graph = await getCategoryGraph({
      childId,
      category: decodedCategory,
      limit,
    });

    // Store in cache
    await setGraphInCache('category', { childId, category: decodedCategory, limit }, graph);

    return NextResponse.json(graph);
  } catch (error) {
    console.error('Error fetching category graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch category graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
