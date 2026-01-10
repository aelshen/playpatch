/**
 * Explorer Mode Home Screen (Ages 5-12)
 * SSK-073: Explorer Mode Home Screen (placeholder)
 */

import { redirect } from 'next/navigation';
import { getChildSession, clearChildSessionAction } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from '@/components/child/video-grid';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';

export default async function ExplorerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'EXPLORER') {
    redirect('/child/toddler');
  }

  // Fetch approved videos appropriate for child's age
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  // Get age-appropriate videos
  const allowedRatings = childProfile?.ageRating
    ? getAllowedAgeRatings(childProfile.ageRating)
    : ['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS'];

  const videos = await prisma.video.findMany({
    where: {
      status: 'READY',
      approvalStatus: 'APPROVED',
      ageRating: { in: allowedRatings },
    },
    include: {
      channel: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-xl">🧒</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {childSession.name}!
                </h1>
                <p className="text-sm text-gray-600">Ready to explore?</p>
              </div>
            </div>
            <form action={clearChildSessionAction}>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Exit
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended Videos</h2>
          <p className="text-gray-600">Watch your favorite videos!</p>
        </div>
        <ChildVideoGrid videos={videos} />
      </main>
    </div>
  );
}
