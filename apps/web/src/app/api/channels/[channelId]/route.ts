/**
 * PUT /api/channels/[channelId]
 * Update channel settings
 *
 * DELETE /api/channels/[channelId]
 * Delete a channel and all its associated videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { AgeRating, SyncMode, SyncFrequency } from '@prisma/client';

interface UpdateChannelRequest {
  syncMode?: SyncMode;
  syncFrequency?: SyncFrequency;
  autoAgeRating?: AgeRating | null;
  autoCategories?: string[];
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;

    // Verify channel belongs to user's family
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body: UpdateChannelRequest = await request.json();
    const { syncMode, syncFrequency, autoAgeRating, autoCategories } = body;

    // Build update data object
    const updateData: any = {};

    if (syncMode !== undefined) {
      updateData.syncMode = syncMode;
    }

    if (syncFrequency !== undefined) {
      updateData.syncFrequency = syncFrequency;
      // Recalculate next sync time if frequency changed
      updateData.nextSyncAt = calculateNextSync(syncFrequency);
    }

    if (autoAgeRating !== undefined) {
      updateData.autoAgeRating = autoAgeRating;
    }

    if (autoCategories !== undefined) {
      updateData.autoCategories = autoCategories;
    }

    logger.info(
      { channelId, channelName: channel.name, updates: Object.keys(updateData) },
      'Updating channel settings'
    );

    // Update the channel
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: updateData,
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    logger.info(
      { channelId, channelName: channel.name },
      'Channel settings updated successfully'
    );

    return NextResponse.json({
      success: true,
      channel: updatedChannel,
    });
  } catch (error) {
    logger.error({ error, channelId: params.channelId }, 'Failed to update channel');

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;

    // Verify channel belongs to user's family
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (channel.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.info(
      { channelId, channelName: channel.name, videoCount: channel._count.videos },
      'Deleting channel'
    );

    // Delete all videos associated with this channel
    // This will cascade delete related records (WatchSession, Favorite, etc.)
    await prisma.video.deleteMany({
      where: { channelId },
    });

    // Delete the channel
    await prisma.channel.delete({
      where: { id: channelId },
    });

    logger.info(
      { channelId, channelName: channel.name },
      'Channel deleted successfully'
    );

    return NextResponse.json({
      success: true,
      message: 'Channel and associated videos deleted successfully',
    });
  } catch (error) {
    logger.error({ error, channelId: params.channelId }, 'Failed to delete channel');

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
