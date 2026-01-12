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
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
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

  // Fetch child profile for age rating
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  const ageRating = childProfile?.ageRating || 'AGE_4_PLUS';
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Fetch new videos for toddlers
  const newVideos = await prisma.video.findMany({
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
    take: 8,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 pb-12">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-lg p-6 mb-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-xl">
                <span className="text-4xl">👶</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Hi {childSession.name}!</h1>
                <p className="text-xl text-gray-600">Let's watch!</p>
              </div>
            </div>
            <form action={clearChildSessionAction}>
              <button
                type="submit"
                className="rounded-2xl bg-white px-8 py-4 text-xl font-bold text-gray-700 shadow-xl hover:bg-gray-50 border-4 border-gray-200"
              >
                Exit
              </button>
            </form>
          </div>

          {/* Search Bar - Bigger for toddlers */}
          <div className="max-w-3xl mx-auto">
            <ChildSearchBar mode="toddler" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 space-y-10">
        {/* Continue Watching */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <ContinueWatching childId={childSession.profileId} mode="toddler" />
          </div>
        </Suspense>

        {/* Favorites */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <FavoritesSection childId={childSession.profileId} mode="toddler" />
          </div>
        </Suspense>

        {/* New Videos */}
        <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            <h2 className="text-3xl font-bold text-gray-900">New Videos</h2>
          </div>
          <ChildVideoGrid videos={newVideos} />
        </div>

        {/* Animals */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection
              category="Animals"
              ageRating={ageRating}
              mode="toddler"
              icon="🦁"
            />
          </div>
        </Suspense>

        {/* Music & Songs */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection
              category="Music"
              ageRating={ageRating}
              mode="toddler"
              icon="🎵"
            />
          </div>
        </Suspense>

        {/* Colors & Shapes */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection
              category="Learning"
              ageRating={ageRating}
              mode="toddler"
              icon="🌈"
            />
          </div>
        </Suspense>

        {/* Stories */}
        <Suspense fallback={<div className="h-80 animate-pulse bg-white/60 rounded-3xl shadow-xl" />}>
          <div className="rounded-3xl bg-white/80 p-8 shadow-xl">
            <CategorySection
              category="Stories"
              ageRating={ageRating}
              mode="toddler"
              icon="📚"
            />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
