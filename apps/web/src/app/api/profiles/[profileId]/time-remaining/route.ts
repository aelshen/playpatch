/**
 * Time Remaining API Endpoint
 * GET /api/profiles/[profileId]/time-remaining
 * Returns time remaining today for a child profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getTimeRemainingToday, TimeLimits } from '@/lib/utils/time-limits';
import { getCurrentChildProfile } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    const childProfile = await getCurrentChildProfile();

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the authenticated child is requesting their own profile
    if (childProfile.id !== profileId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get child profile with timeLimits
    const profile = await prisma.childProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        timeLimits: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const minutesRemaining = await getTimeRemainingToday(
      profile.id,
      profile.timeLimits as TimeLimits | null
    );

    return NextResponse.json({
      profileId: profile.id,
      minutesRemaining,
      hasLimit: minutesRemaining !== null,
      isOverLimit: minutesRemaining !== null && minutesRemaining <= 0,
    });
  } catch (error) {
    console.error('Error fetching time remaining:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time remaining' },
      { status: 500 }
    );
  }
}
