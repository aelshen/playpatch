/**
 * POST /api/channels
 * Create a new YouTube channel and queue videos for import
 *
 * GET /api/channels
 * List all channels for the family
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import {
  getYouTubeChannelInfo,
  getChannelVideoList,
  isYouTubeChannelUrl,
  extractChannelId,
  ChannelVideoListOptions,
} from '@/lib/media/youtube';
import { addVideoImportJob } from '@/lib/queue/jobs';
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

    // Validate required fields
    if (!url) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    if (!isYouTubeChannelUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube channel URL' }, { status: 400 });
    }

    if (!syncMode || !syncFrequency) {
      return NextResponse.json(
        { error: 'Sync mode and frequency are required' },
        { status: 400 }
      );
    }

    logger.info({ userId: user.id, url, syncMode, syncFrequency }, 'Creating channel');

    // Fetch channel info
    const channelInfo = await getYouTubeChannelInfo(url);
    const sourceId = extractChannelId(url) || channelInfo.id;

    // Check if channel already exists for this family
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

    // Create channel in database
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
        lastSyncAt: new Date(),
        nextSyncAt: calculateNextSync(syncFrequency),
      },
    });

    logger.info({ channelId: channel.id, channelName: channel.name }, 'Channel created');

    // Fetch videos to import
    const videoListOptions: ChannelVideoListOptions = {
      limit: initialVideoLimit,
      ...filters,
    };

    const videos = await getChannelVideoList(url, videoListOptions);

    logger.info({ channelId: channel.id, videoCount: videos.length }, 'Queueing videos for import');

    // Queue videos for import
    const jobPromises = videos.map(video =>
      addVideoImportJob({
        familyId: user.familyId,
        sourceUrl: video.url,
        sourceType: 'YOUTUBE',
        channelId: channel.id,
        metadata: {
          title: video.title,
          duration: video.duration,
          thumbnailUrl: video.thumbnailUrl,
          uploadDate: video.uploadDate,
          viewCount: video.viewCount,
        },
      })
    );

    await Promise.all(jobPromises);

    logger.info(
      { channelId: channel.id, queuedCount: videos.length },
      'Videos queued for import'
    );

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        thumbnailUrl: channel.thumbnailUrl,
        videoCount: videos.length,
      },
      queuedVideos: videos.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create channel');

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const channels = await prisma.channel.findMany({
      where: {
        familyId: user.familyId,
      },
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch channels');
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

/**
 * Calculate next sync time based on frequency
 */
function calculateNextSync(frequency: SyncFrequency): Date {
  const now = new Date();

  switch (frequency) {
    case 'HOURLY':
      now.setHours(now.getHours() + 1);
      break;
    case 'DAILY':
      now.setDate(now.getDate() + 1);
      break;
    case 'WEEKLY':
      now.setDate(now.getDate() + 7);
      break;
    case 'MANUAL':
      // Set far in future for manual sync
      now.setFullYear(now.getFullYear() + 10);
      break;
  }

  return now;
}
