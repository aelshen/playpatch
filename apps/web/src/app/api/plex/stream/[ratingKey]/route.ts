/**
 * GET /api/plex/stream/[ratingKey]
 * Returns a proxied HLS manifest from Plex's universal transcoder.
 * Segment URLs in the manifest are rewritten to go through /api/plex/segment
 * so the Plex token never reaches the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
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
      return NextResponse.json({ error: 'No Plex server connected' }, { status: 401 });
    }

    const base = conn.serverUrl.replace(/\/$/, '');

    // Request HLS transcoded stream from Plex
    // Build params manually to avoid double-encoding the path
    const plexParams = [
      `path=%2Flibrary%2Fmetadata%2F${params.ratingKey}`,
      'protocol=hls',
      'directStream=1',
      'directPlay=0',
      'hasMDE=1',
      'mediaIndex=0',
      'partIndex=0',
      `X-Plex-Token=${encodeURIComponent(conn.token)}`,
      'X-Plex-Product=PlayPatch',
      'X-Plex-Client-Identifier=playpatch-web',
      'X-Plex-Version=1.0',
      'X-Plex-Platform=Chrome',
      'X-Plex-Platform-Version=100',
      'X-Plex-Device=OSX',
      'X-Plex-Device-Name=PlayPatch',
    ].join('&');

    const transcodeBase = `${base}/video/:/transcode/universal/`;
    const plexHlsUrl = `${transcodeBase}start.m3u8?${plexParams}`;

    const res = await fetch(plexHlsUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      logger.error({ status: res.status, ratingKey: params.ratingKey }, 'Plex HLS request failed');
      return NextResponse.json({ error: 'Failed to start Plex stream' }, { status: 502 });
    }

    const manifest = await res.text();

    // Rewrite all non-comment, non-empty lines (URLs) to go through our segment proxy
    // Relative URLs in the manifest are relative to the transcode base, not server root
    const rewritten = rewriteManifest(manifest, transcodeBase, conn.token);

    return new NextResponse(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error({ error, ratingKey: params.ratingKey }, 'Plex HLS proxy error');
    return NextResponse.json({ error: 'Stream error' }, { status: 500 });
  }
}

/**
 * Rewrite URLs in an HLS manifest to go through /api/plex/segment.
 * Handles both master playlists (which reference sub-playlists) and
 * media playlists (which reference .ts/.mp4 segments).
 */
function rewriteManifest(manifest: string, plexBase: string, token: string): string {
  return manifest
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      // Build the full Plex URL for this line
      let fullUrl: string;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        fullUrl = trimmed;
      } else {
        const normalBase = plexBase.endsWith('/') ? plexBase : plexBase + '/';
        fullUrl = normalBase + (trimmed.startsWith('/') ? trimmed.slice(1) : trimmed);
      }

      // Ensure the Plex token is present
      try {
        const u = new URL(fullUrl);
        if (!u.searchParams.has('X-Plex-Token')) {
          u.searchParams.set('X-Plex-Token', token);
        }
        fullUrl = u.toString();
      } catch {
        // Not a valid URL, leave as-is
        return line;
      }

      // Encode and route through our segment proxy
      const encoded = Buffer.from(fullUrl).toString('base64url');
      return `/api/plex/segment?u=${encoded}`;
    })
    .join('\n');
}
