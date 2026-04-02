/**
 * Child Interests API Endpoint
 * GET /api/profiles/[profileId]/interests
 * Returns a ranked list of topics the child is curious about,
 * derived from chat curiosity signals and watch engagement signals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { getChildInterests } from '@/lib/db/queries/child-interests';

export async function GET(
  _request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = params;

    // Verify child profile exists and belongs to user's family
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        user: {
          select: {
            familyId: true,
            family: {
              select: {
                users: {
                  where: { id: user.id },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Child profile not found' },
        { status: 404 }
      );
    }

    if (childProfile.user.family.users.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized access to child profile' },
        { status: 403 }
      );
    }

    logger.info({ profileId }, 'Fetching child interests');

    const interests = await getChildInterests({
      childId: profileId,
      familyId: childProfile.user.familyId,
    });

    return NextResponse.json({ interests });
  } catch (error) {
    logger.error(
      { error, profileId: params.profileId },
      'Failed to fetch child interests'
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch child interests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
