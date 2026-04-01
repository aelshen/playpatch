/**
 * POST /api/channels
 * Create a new YouTube channel and enqueue initial video scan.
 * Returns immediately — videos are imported asynchronously by the channel-scan worker.
 *
 * GET /api/channels
 * List all channels for the family.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { isYouTubeChannelUrl } from '@/lib/media/youtube';
import { getChannelInfoFromUrl } from '@/lib/media/youtube-api';
import { addChannelSyncJob } from '@/lib/queue/client';
import { calculateNextSync } from '@/lib/sync/calculate-next-sync';
import { logger } from '@/lib/logger';
import { AgeRating, SyncMode, SyncFrequency } from '@prisma/client';

interface CreateChannelRequest {
  url: string;
  syncMode: SyncMode;
  syncFrequency: SyncFrequency;
  autoAgeRating?: AgeRating;
  autoCategories?: string[];
  initialVideoLimit?: number;
  filters?: {
    minDuration?: number;
    maxDuration?: number;
    daysBack?: number;
    minViews?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateChannelRequest = await request.json();
    const {
      url,
      syncMode,
      syncFrequency,
      autoAgeRating,
      autoCategories = [],
      initialVideoLimit = 10,
      filters = {},
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    if (!isYouTubeChannelUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube channel URL' }, { status: 400 });
    }

    if (!syncMode || !syncFrequency) {
      return NextResponse.json({ error: 'Sync mode and frequency are required' }, { status: 400 });
    }

    logger.info({ userId: user.id, url, syncMode, syncFrequency }, 'Creating channel');

    // Fetch channel metadata via YouTube Data API v3 — returns canonical UCxxx ID
    const channelInfo = await getChannelInfoFromUrl(url);
    const sourceId = channelInfo.canonicalId; // always UCxxx

    const existingChannel = await prisma.channel.findUnique({
      where: {
        familyId_sourceType_sourceId: {
          familyId: user.familyId,
          sourceType: 'YOUTUBE',
          sourceId,
        },
      },
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'This channel is already added to your family' },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        familyId: user.familyId,
        sourceType: 'YOUTUBE',
        sourceId,
        name: channelInfo.name,
        description: channelInfo.description,
        thumbnailUrl: channelInfo.thumbnailUrl,
        syncMode,
        syncFrequency,
        autoAgeRating,
        autoCategories,
        selectiveRules: Object.keys(filters).length > 0 ? filters : null,
        lastSyncAt: new Date(),
        nextSyncAt: calculateNextSync(syncFrequency),
      },
    });

    logger.info({ channelId: channel.id, channelName: channel.name }, 'Channel created');

    // Enqueue the initial video scan — processed asynchronously by channel-scan worker
    await addChannelSyncJob({
      channelId: channel.id,
      limit: initialVideoLimit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    logger.info(
      { channelId: channel.id, limit: initialVideoLimit },
      'Enqueued initial channel scan'
    );

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        thumbnailUrl: channel.thumbnailUrl,
      },
      message: `Channel added. Up to ${initialVideoLimit} videos will be imported in the background.`,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create channel');

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channels = await prisma.channel.findMany({
      where: { familyId: user.familyId },
      include: { _count: { select: { videos: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch channels');
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
