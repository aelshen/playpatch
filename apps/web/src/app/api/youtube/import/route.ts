/**
 * POST /api/youtube/import
 * Import a YouTube video by URL into the library.
 *
 * Body: { url: string }
 * Response: { success: true, videoId: string } | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { importYouTubeVideoAction } from '@/lib/actions/video-import';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { url } = body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    logger.info({ userId: user.id, url }, 'YouTube import request via API route');

    const fd = new FormData();
    fd.set('url', url.trim());

    const result = await importYouTubeVideoAction(null, fd);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, videoId: result.videoId });
  } catch (error) {
    logger.error({ error }, 'YouTube import API route failed');
    const message = error instanceof Error ? error.message : 'Failed to import video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
