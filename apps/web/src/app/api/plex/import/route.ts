/**
 * POST /api/plex/import
 * Imports a Plex media item into the PlayPatch library for parent review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { plexRatingToAgeRating } from '@/lib/media/plex';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) {
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 400 });
    }

    const body = await request.json();
    const { ratingKey, title, summary, year, contentRating, duration, thumbUrl, partKey, type } = body;

    if (!ratingKey || !title) {
      return NextResponse.json({ error: 'ratingKey and title are required' }, { status: 400 });
    }

    const sourceId = `plex:${ratingKey}`;

    // Check for duplicate within this family
    const existing = await prisma.video.findFirst({
      where: { familyId: user.familyId, sourceType: 'PLEX', sourceId },
    });
    if (existing) {
      return NextResponse.json({ error: 'This item is already in your library' }, { status: 409 });
    }

    const ageRating = plexRatingToAgeRating(contentRating ?? null) as 'AGE_2_PLUS' | 'AGE_4_PLUS' | 'AGE_7_PLUS' | 'AGE_10_PLUS';

    // sourceUrl: the Plex metadata endpoint (used by stream proxy to get part info)
    const sourceUrl = `${conn.serverUrl}/library/metadata/${ratingKey}`;

    const video = await prisma.video.create({
      data: {
        familyId: user.familyId,
        sourceUrl,
        sourceType: 'PLEX',
        sourceId,
        title: year ? `${title} (${year})` : title,
        description: summary ?? null,
        duration: duration ?? 0,
        ageRating,
        thumbnailPath: thumbUrl ?? null,
        status: 'READY',         // Plex serves it directly — no download needed
        approvalStatus: 'PENDING', // Parent must still review
        playbackMode: 'EMBED',   // We proxy via /api/plex/stream/[ratingKey]
      },
    });

    logger.info({ familyId: user.familyId, ratingKey, title }, 'Plex item imported');

    return NextResponse.json({ video: { id: video.id, title: video.title } }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Failed to import Plex item');
    return NextResponse.json({ error: 'Failed to import item' }, { status: 500 });
  }
}
