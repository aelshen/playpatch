/**
 * Explorer Mode Home Screen (Ages 5-12)
 * Enhanced with search, favorites, continue watching, and categories
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getChildSession } from '@/lib/actions/profile-selection';
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

export default async function ExplorerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'EXPLORER') {
    redirect('/child/toddler');
  }

  // Fetch child profile for age rating and time limits
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  const ageRating = childProfile?.ageRating || 'AGE_10_PLUS';
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Calculate time remaining for today
  const timeRemaining = await getTimeRemainingToday(
    childSession.profileId,
    childProfile?.timeLimits as TimeLimits | null
  );

  // Fetch new/recommended videos
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
    take: 12,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 shadow backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg">
                <span className="text-xl">🧒</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hi {childSession.name}!</h1>
                <p className="text-sm text-gray-600">What do you want to watch?</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TimeRemainingBadge
                profileId={childSession.profileId}
                initialMinutesRemaining={timeRemaining}
              />
              <Link
                href="/child/exit"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Exit
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <ChildSearchBar mode="explorer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        {/* Continue Watching */}
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <ContinueWatching childId={childSession.profileId} mode="explorer" />
        </Suspense>

        {/* Favorites */}
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <FavoritesSection childId={childSession.profileId} mode="explorer" />
        </Suspense>

        {/* New & Recommended */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">New & Recommended</h2>
          </div>
          <ChildVideoGrid videos={newVideos} />
        </div>

        {/* Categories */}
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <CategorySection category="Science" ageRating={ageRating} mode="explorer" icon="🔬" />
        </Suspense>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <CategorySection category="Animals" ageRating={ageRating} mode="explorer" icon="🦁" />
        </Suspense>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <CategorySection category="Music" ageRating={ageRating} mode="explorer" icon="🎵" />
        </Suspense>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <CategorySection category="Art" ageRating={ageRating} mode="explorer" icon="🎨" />
        </Suspense>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white/50" />}>
          <CategorySection category="Stories" ageRating={ageRating} mode="explorer" icon="📚" />
        </Suspense>
      </main>
    </div>
  );
}
