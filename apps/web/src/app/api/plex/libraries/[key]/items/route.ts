/**
 * GET /api/plex/libraries/[key]/items
 * Lists items in a Plex library section with optional search and pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { listPlexItems } from '@/lib/media/plex';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) {
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('q') ?? undefined;
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10), 100);

    const result = await listPlexItems(conn.serverUrl, conn.token, params.key, {
      search,
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Plex library items');
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
