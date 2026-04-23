/**
 * GET /api/plex/segment?u=<base64url-encoded-plex-url>
 * Proxies HLS segments and sub-playlists from Plex.
 * Validates the URL points to the family's registered Plex server.
 * Sub-playlists (m3u8) are themselves rewritten so all segment URLs stay proxied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const conn = await prisma.plexConnection.findUnique({ where: { familyId: user.familyId } });
    if (!conn?.isVerified) return new NextResponse('No Plex connected', { status: 401 });

    const encoded = request.nextUrl.searchParams.get('u');
    if (!encoded) return new NextResponse('Missing u param', { status: 400 });

    let plexUrl: string;
    try {
      plexUrl = Buffer.from(encoded, 'base64url').toString();
    } catch {
      return new NextResponse('Invalid u param', { status: 400 });
    }

    // Security: ensure URL targets the family's registered Plex server
    const base = conn.serverUrl.replace(/\/$/, '');
    if (!plexUrl.startsWith(base)) {
      logger.warn({ plexUrl, base }, 'Plex segment URL does not match registered server');
      return new NextResponse('Forbidden', { status: 403 });
    }

    const upstream = await fetch(plexUrl, { signal: AbortSignal.timeout(30000) });
    if (!upstream.ok) {
      return new NextResponse('Segment fetch failed', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? '';

    // If this is another HLS playlist, rewrite it too
    // Use the URL's directory as the base for relative URL resolution
    if (contentType.includes('mpegurl') || plexUrl.includes('.m3u8')) {
      const text = await upstream.text();
      const urlBase = plexUrl.substring(0, plexUrl.lastIndexOf('/') + 1);
      const rewritten = rewriteManifest(text, urlBase, conn.token);
      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store',
        },
      });
    }

    // Otherwise stream the segment (video/mp2t, video/mp4, etc.)
    const headers = new Headers();
    if (contentType) headers.set('content-type', contentType);
    const cl = upstream.headers.get('content-length');
    if (cl) headers.set('content-length', cl);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    logger.error({ error }, 'Plex segment proxy error');
    return new NextResponse('Segment error', { status: 500 });
  }
}

function rewriteManifest(manifest: string, plexBase: string, token: string): string {
  // plexBase should be the directory URL (ending with /) from which relative URLs resolve
  const base = plexBase.endsWith('/') ? plexBase : plexBase + '/';
  return manifest
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      let fullUrl: string;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        fullUrl = trimmed;
      } else if (trimmed.startsWith('/')) {
        // Absolute path — resolve against server root
        const serverRoot = base.match(/^https?:\/\/[^/]+/)?.[0] ?? '';
        fullUrl = serverRoot + trimmed;
      } else {
        // Relative path — resolve against base directory
        fullUrl = base + trimmed;
      }

      try {
        const u = new URL(fullUrl);
        if (!u.searchParams.has('X-Plex-Token')) {
          u.searchParams.set('X-Plex-Token', token);
        }
        fullUrl = u.toString();
      } catch {
        return line;
      }

      const enc = Buffer.from(fullUrl).toString('base64url');
      return `/api/plex/segment?u=${enc}`;
    })
    .join('\n');
}
