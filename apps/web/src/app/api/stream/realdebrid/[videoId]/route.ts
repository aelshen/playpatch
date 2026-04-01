/**
 * RealDebrid Streaming Proxy
 *
 * Proxies video streams from RealDebrid to allow direct playback
 * without downloading to local storage (Stremio-style)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { getDownloadLinks } from '@/lib/media/realdebrid';
import { getCurrentUserOrNull } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    videoId: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { videoId } = context.params;

  try {
    // Require authenticated user
    const user = await getCurrentUserOrNull();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get video from database and verify it belongs to user's family
    const video = await prisma.video.findFirst({
      where: { id: videoId, familyId: user.familyId },
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        sourceType: true,
        metadata: true,
        status: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Only works for RealDebrid videos
    if (video.sourceType !== 'REALDEBRID') {
      return NextResponse.json(
        { error: 'Not a RealDebrid video' },
        { status: 400 }
      );
    }

    const metadata = video.metadata as any;
    const torrentHash = metadata?.torrentHash;

    if (!torrentHash) {
      return NextResponse.json(
        { error: 'Missing torrent hash in metadata' },
        { status: 400 }
      );
    }

    logger.info({ videoId, torrentHash }, 'Fetching RealDebrid streaming link');

    // Get download links from RealDebrid
    const links = await getDownloadLinks(torrentHash);

    if (!links || links.length === 0) {
      return NextResponse.json(
        { error: 'No streaming links available' },
        { status: 404 }
      );
    }

    // Find the right file (match by fileId if available)
    const fileId = metadata?.fileId;
    const targetLink = fileId
      ? links.find(l => l.filename.includes(fileId.toString()))
      : links[0];

    if (!targetLink) {
      return NextResponse.json(
        { error: 'Streaming link not found' },
        { status: 404 }
      );
    }

    if (!targetLink.streamable) {
      return NextResponse.json(
        { error: 'This file is not streamable from RealDebrid' },
        { status: 400 }
      );
    }

    logger.info({ videoId, link: targetLink.link }, 'Proxying RealDebrid stream');

    // Fetch from RealDebrid and proxy to client
    const response = await fetch(targetLink.link, {
      headers: {
        // Forward range header for seeking support
        ...(request.headers.get('range') && {
          'Range': request.headers.get('range')!,
        }),
      },
    });

    if (!response.ok) {
      logger.error({ videoId, status: response.status }, 'RealDebrid stream failed');
      return NextResponse.json(
        { error: 'Failed to fetch stream from RealDebrid' },
        { status: response.status }
      );
    }

    // Create streaming response
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'video/mp4');
    headers.set('Content-Length', response.headers.get('content-length') || '0');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000');

    // Forward range headers for seeking
    if (response.headers.get('content-range')) {
      headers.set('Content-Range', response.headers.get('content-range')!);
    }

    // Stream the response
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });

  } catch (error) {
    logger.error({ error, videoId }, 'RealDebrid streaming error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
