/**
 * POST /api/sync/channels
 * Manually trigger channel sync or scheduled sync via cron
 *
 * Can sync specific channel or all due channels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { syncChannel, syncDueChannels } from '@/lib/sync/channel-sync';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Check for cron secret for scheduled syncs (optional)
    const cronSecret = request.headers.get('x-cron-secret');
    const validCronSecret = process.env.CRON_SECRET;

    // If cron secret provided and valid, skip auth
    const isCronJob = cronSecret && validCronSecret && cronSecret === validCronSecret;

    // Otherwise require user authentication
    if (!isCronJob) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { channelId } = body;

    logger.info({ channelId, isCronJob }, 'Sync channels request');

    // If channelId provided, sync specific channel
    if (channelId) {
      const result = await syncChannel(channelId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Sync failed' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Synced channel successfully`,
        newVideos: result.newVideos,
      });
    }

    // Otherwise sync all due channels
    const result = await syncDueChannels();

    return NextResponse.json({
      success: true,
      message: 'Channel sync completed',
      synced: result.synced,
      failed: result.failed,
      newVideos: result.newVideos,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to sync channels');

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to sync channels' },
      { status: 500 }
    );
  }
}
