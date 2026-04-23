/**
 * GET /api/plex/metadata/[ratingKey]/children
 * Returns children of a Plex item (seasons of a show, or episodes of a season).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getPlexChildren } from '@/lib/media/plex';
import { logger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: { ratingKey: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) {
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 400 });
    }

    const result = await getPlexChildren(conn.serverUrl, conn.token, params.ratingKey);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Plex children');
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}
