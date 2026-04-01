/**
 * Family activity queries
 */

import { prisma } from '@/lib/db/client';

export interface RecentActivityItem {
  id: string;
  startedAt: Date;
  duration: number;
  completed: boolean;
  child: {
    id: string;
    name: string;
    theme: string;
  };
  video: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  };
}

/**
 * Get recent watch sessions across all profiles in a family.
 */
export async function getRecentFamilyActivity(
  familyId: string,
  limit = 10
): Promise<RecentActivityItem[]> {
  return prisma.watchSession.findMany({
    where: {
      child: { user: { familyId } },
    },
    include: {
      child: { select: { id: true, name: true, theme: true } },
      video: { select: { id: true, title: true, thumbnailPath: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
}
