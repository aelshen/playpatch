import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getChildSession } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from '@/components/child/video-grid';
import { ChildSearchBar } from '@/components/child/search-bar';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { Search } from 'lucide-react';

export default async function ToddlerSearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const childSession = await getChildSession();
  if (!childSession) redirect('/profiles');
  if (childSession.uiMode !== 'TODDLER') redirect('/child/explorer');

  const query = searchParams.q?.trim() ?? '';

  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });
  const ageRating = childProfile?.ageRating ?? 'AGE_4_PLUS';
  const allowedRatings = getAllowedAgeRatings(ageRating);

  const videos = query
    ? await prisma.video.findMany({
        where: {
          approvalStatus: 'APPROVED',
          playbackMode: { in: ['EMBED', 'HLS'] },
          ageRating: { in: allowedRatings },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { channel: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        include: { channel: true },
        orderBy: { createdAt: 'desc' },
        take: 24,
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <header className="sticky top-0 z-40 bg-white/95 shadow backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href="/child/toddler"
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Search</h1>
          </div>
          <ChildSearchBar mode="toddler" initialQuery={query} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!query ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="mb-4 h-20 w-20 text-gray-300" />
            <p className="text-2xl font-medium text-gray-500">Type something to search!</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-7xl">🔍</div>
            <p className="text-2xl font-medium text-gray-700">No videos for "{query}"</p>
            <p className="mt-2 text-lg text-gray-500">Try a different word!</p>
          </div>
        ) : (
          <div>
            <p className="mb-6 text-lg text-gray-600">
              {videos.length} result{videos.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <ChildVideoGrid videos={videos} />
          </div>
        )}
      </main>
    </div>
  );
}
