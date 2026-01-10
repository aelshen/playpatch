/**
 * Toddler Mode Home Screen (Ages 2-4)
 * SSK-072: Toddler Mode Home Screen (placeholder)
 */

import { redirect } from 'next/navigation';
import { getChildSession, clearChildSessionAction } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from '@/components/child/video-grid';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';

export default async function ToddlerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'TODDLER') {
    redirect('/child/explorer');
  }

  // Fetch approved videos appropriate for toddlers
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  // Get age-appropriate videos
  const allowedRatings = childProfile?.ageRating
    ? getAllowedAgeRatings(childProfile.ageRating)
    : ['AGE_2_PLUS', 'AGE_4_PLUS'];

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
    take: 12,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-3xl">👶</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hi {childSession.name}!</h1>
              <p className="text-lg text-gray-600">What do you want to watch?</p>
            </div>
          </div>
          <form action={clearChildSessionAction}>
            <button
              type="submit"
              className="rounded-full bg-white px-6 py-3 text-lg font-medium text-gray-700 shadow-lg hover:bg-gray-50"
            >
              Exit
            </button>
          </form>
        </div>

        {/* Videos */}
        <div className="rounded-2xl bg-white/80 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Watch Videos</h2>
          <ChildVideoGrid videos={videos} />
        </div>
      </div>
    </div>
  );
}
