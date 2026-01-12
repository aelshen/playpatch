/**
 * GET /api/channels/preview
 * Preview YouTube channel information before importing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getYouTubeChannelInfo, getChannelVideoList, isYouTubeChannelUrl } from '@/lib/media/youtube';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const channelUrl = searchParams.get('url');

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube channel URL
    if (!isYouTubeChannelUrl(channelUrl)) {
      return NextResponse.json(
        { error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    logger.info({ userId: user.id, channelUrl }, 'Fetching channel preview');

    // Fetch channel info
    const channelInfo = await getYouTubeChannelInfo(channelUrl);

    // Fetch sample of recent videos (limit to 5 for preview)
    const recentVideos = await getChannelVideoList(channelUrl, { limit: 5 });

    return NextResponse.json({
      channel: channelInfo,
      recentVideos,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch channel preview');

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch channel information' },
      { status: 500 }
    );
  }
}
