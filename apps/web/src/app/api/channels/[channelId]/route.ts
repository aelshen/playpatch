/**
 * DELETE /api/channels/[channelId]
 * Delete a channel and all its associated videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function DELETE(
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
