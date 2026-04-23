/**
 * GET /api/plex/libraries
 * Returns movie and show libraries from the connected Plex server.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { listPlexLibraries } from '@/lib/media/plex';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) {
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 400 });
    }

    const libraries = await listPlexLibraries(conn.serverUrl, conn.token);
    return NextResponse.json({ libraries });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Plex libraries');
    return NextResponse.json({ error: 'Failed to fetch libraries' }, { status: 500 });
  }
}
