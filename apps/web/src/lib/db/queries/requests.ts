/**
 * Database queries for child requests
 */

import { prisma } from '@/lib/db/client';

export type RequestStatus = 'PENDING' | 'FULFILLED' | 'DISMISSED';

export interface ChildRequestWithDetails {
  id: string;
  requestType: string;
  message: string | null;
  status: string;
  createdAt: Date;
  child: {
    id: string;
    name: string;
    theme: string;
  };
  video: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  } | null;
}

/**
 * Get all requests for a family, optionally filtered by status.
 */
export async function getRequestsByFamily(
  familyId: string,
  status?: RequestStatus
): Promise<ChildRequestWithDetails[]> {
  return prisma.requestFromChild.findMany({
    where: {
      ...(status ? { status } : {}),
      child: {
        user: { familyId },
      },
    },
    include: {
      child: {
        select: { id: true, name: true, theme: true },
      },
      video: {
        select: { id: true, title: true, thumbnailPath: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get pending request count for a family.
 */
export async function getPendingRequestCount(familyId: string): Promise<number> {
  return prisma.requestFromChild.count({
    where: {
      status: 'PENDING',
      child: { user: { familyId } },
    },
  });
}
