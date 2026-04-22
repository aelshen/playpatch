/**
 * GET /api/plex/stream/[ratingKey]
 * Proxies Plex video stream through the PlayPatch server.
 * This keeps the Plex token server-side and handles range requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { ratingKey: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) {
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 401 });
    }

    // Get metadata to find the part key
    const metaRes = await fetch(
      `${conn.serverUrl}/library/metadata/${params.ratingKey}`,
      {
        headers: { 'X-Plex-Token': conn.token, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const meta = await metaRes.json();
    const partKey = meta?.MediaContainer?.Metadata?.[0]?.Media?.[0]?.Part?.[0]?.key;
    if (!partKey) {
      return NextResponse.json({ error: 'No playable media found' }, { status: 404 });
    }

    // Proxy the stream, forwarding Range header for seeking support
    const streamUrl = `${conn.serverUrl}${partKey}?X-Plex-Token=${conn.token}`;
    const rangeHeader = request.headers.get('range');

    const upstream = await fetch(streamUrl, {
      headers: rangeHeader ? { Range: rangeHeader } : {},
    });

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    const contentLength = upstream.headers.get('content-length');
    const contentRange = upstream.headers.get('content-range');
    const acceptRanges = upstream.headers.get('accept-ranges');

    if (contentType) headers.set('content-type', contentType);
    if (contentLength) headers.set('content-length', contentLength);
    if (contentRange) headers.set('content-range', contentRange);
    if (acceptRanges) headers.set('accept-ranges', acceptRanges);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    logger.error({ error, ratingKey: params.ratingKey }, 'Plex stream proxy error');
    return NextResponse.json({ error: 'Stream error' }, { status: 500 });
  }
}
