/**
 * Video Serving API
 * SSK-075: Video Player Component
 *
 * Serves HLS playlists and video segments from storage
 * URL pattern: /api/video/{familyId}/{videoId}/hls/{file}
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadFile, BUCKETS } from '@/lib/storage/client';
import { logger } from '@/lib/logger';
import { getCurrentUserOrNull } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/video/[...path]
 * Serves video files (HLS playlists and segments)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path;

    // Expected format: [familyId, videoId, 'hls', ...fileName]
    // e.g., /api/video/family123/video456/hls/master.m3u8
    // e.g., /api/video/family123/video456/hls/360p.m3u8
    // e.g., /api/video/family123/video456/hls/360p_000.ts

    if (!path || path.length < 4) {
      return NextResponse.json(
        { error: 'Invalid video path' },
        { status: 400 }
      );
    }

    const familyId = path[0];

    // Require authenticated user and verify they belong to the requested family
    const user = await getCurrentUserOrNull();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (user.familyId !== familyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    const videoId = path[1];
    const hlsMarker = path[2];
    const fileName = path.slice(3).join('/'); // Handle nested paths

    if (hlsMarker !== 'hls') {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 }
      );
    }

    // Construct storage key
    // Storage format: videos/{familyId}/{videoId}/hls/{fileName}
    const storageKey = `${familyId}/${videoId}/hls/${fileName}`;

    logger.info({ storageKey, fileName }, 'Serving video file');

    // Download file from storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFile(BUCKETS.VIDEOS, storageKey);
    } catch (error) {
      logger.error({ error, storageKey }, 'File not found in storage');
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

    // Determine content type based on file extension
    const contentType = fileName.endsWith('.m3u8')
      ? 'application/vnd.apple.mpegurl'
      : fileName.endsWith('.ts')
      ? 'video/mp2t'
      : 'application/octet-stream';

    // Handle byte-range requests for seeking
    const range = request.headers.get('range');

    if (range) {
      // Parse range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0] || '0', 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
      const chunkSize = end - start + 1;

      const chunk = fileBuffer.slice(start, end + 1);

      return new Response(chunk as any, {
        status: 206, // Partial Content
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileBuffer.length}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Return full file
    return new Response(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error serving video file');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
