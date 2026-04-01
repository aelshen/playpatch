/**
 * Toddler Mode Home Screen (Ages 2-4)
 * Enhanced with simple search, favorites, and big colorful sections
 */

import { redirect } from 'next/navigation';
import { getChildSession, clearChildSessionAction } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from '@/components/child/video-grid';
import { ChildSearchBar } from '@/components/child/search-bar';
import { FavoritesSection } from '@/components/child/favorites-section';
import { ContinueWatching } from '@/components/child/continue-watching';
import { CategorySection } from '@/components/child/category-section';
import { TimeRemainingBadge } from '@/components/child/time-remaining-badge';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { getTimeRemainingToday, TimeLimits } from '@/lib/utils/time-limits';
import { Sparkles } from 'lucide-react';
import { Suspense } from 'react';

export default async function ToddlerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'TODDLER') {
    redirect('/child/explorer');
  }

  // Fetch child profile for age rating and time limits
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  const ageRating = childProfile?.ageRating || 'AGE_4_PLUS';
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Calculate time remaining for today
  const timeRemaining = await getTimeRemainingToday(
    childSession.profileId,
    childProfile?.timeLimits as TimeLimits | null
  );

  // Fetch new videos for toddlers
  const newVideos = await prisma.video.findMany({
    where: {
      approvalStatus: 'APPROVED',
      playbackMode: { in: ['EMBED', 'HLS'] },
      ageRating: { in: allowedRatings },
    },
    include: {
      channel: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 8,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 pb-12">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-40 mb-8 bg-white/95 p-6 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-xl">
                <span className="text-4xl">👶</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Hi {childSession.name}!</h1>
                <p className="text-xl text-gray-600">Let&apos;s watch!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TimeRemainingBadge
                profileId={childSession.profileId}
                initialMinutesRemaining={timeRemaining}
                className="text-base"
              />
              <form action={clearChildSessionAction}>
                <button
                  type="submit"
                  className="rounded-2xl border-4 border-gray-200 bg-white px-8 py-4 text-xl font-bold text-gray-700 shadow-xl hover:bg-gray-50"
                >
                  Exit
                </button>
              </form>
            </div>
          </div>

          {/* Search Bar - Bigger for toddlers */}
          <div className="mx-auto max-w-3xl">
            <ChildSearchBar mode="toddler" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl space-y-10 px-6">
        {/* Continue Watching */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <ContinueWatching childId={childSession.profileId} mode="toddler" />
          </div>
        </Suspense>

        {/* Favorites */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <FavoritesSection childId={childSession.profileId} mode="toddler" />
          </div>
        </Suspense>

        {/* New Videos */}
        <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-10 w-10 fill-yellow-500 text-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">New Videos</h2>
          </div>
          <ChildVideoGrid videos={newVideos} />
        </div>

        {/* Animals */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection category="Animals" ageRating={ageRating} mode="toddler" icon="🦁" />
          </div>
        </Suspense>

        {/* Music & Songs */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection category="Music" ageRating={ageRating} mode="toddler" icon="🎵" />
          </div>
        </Suspense>

        {/* Colors & Shapes */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection category="Learning" ageRating={ageRating} mode="toddler" icon="🌈" />
          </div>
        </Suspense>

        {/* Stories */}
        <Suspense
          fallback={<div className="h-80 animate-pulse rounded-3xl bg-white/60 shadow-xl" />}
        >
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection category="Stories" ageRating={ageRating} mode="toddler" icon="📚" />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
