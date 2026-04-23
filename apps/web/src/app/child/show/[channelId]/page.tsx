/**
 * Show Detail Page — lists all episodes for a Plex channel/show
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getChildSession } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { formatDuration } from '@/lib/utils/shared';

/** Strip the show name prefix and reformat "(N) (YYYY)" suffixes into a clean label + year. */
function parseEpisodeTitle(rawTitle: string, showName: string): { label: string; year: string | null } {
  let title = rawTitle;
  if (title.startsWith(showName)) title = title.slice(showName.length).trim();

  const yearMatch = title.match(/\s*\((\d{4})\)$/);
  const year = yearMatch ? yearMatch[1] : null;
  if (yearMatch) title = title.slice(0, yearMatch.index).trim();

  // Trailing "(N)" → ", Part N"  e.g. "The Crab with the Golden Claws (1)" → "The Crab with the Golden Claws, Part 1"
  title = title.replace(/\s*\((\d+)\)$/, ', Part $1').trim();
  // Whole-string "(N)" (when show name was stripped) → "Part N"
  title = title.replace(/^\((\d+)\)$/, 'Part $1').trim();

  return { label: title || showName, year };
}

export default async function ShowDetailPage({ params }: { params: { channelId: string } }) {
  const childSession = await getChildSession();
  if (!childSession) redirect('/profiles');

  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childSession.profileId },
  });

  const ageRating = childProfile?.ageRating || 'AGE_10_PLUS';
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Get family for security scoping
  const familyUser = childProfile?.userId
    ? await prisma.user.findUnique({ where: { id: childProfile.userId }, select: { familyId: true } })
    : null;
  const familyId = familyUser?.familyId ?? '';

  const channel = await prisma.channel.findUnique({
    where: { id: params.channelId },
    include: {
      videos: {
        where: {
          approvalStatus: 'APPROVED',
          playbackMode: { in: ['EMBED', 'HLS'] },
          ageRating: { in: allowedRatings },
        },
        orderBy: { sourceId: 'asc' },
      },
    },
  });

  if (!channel || channel.familyId !== familyId) notFound();


  // Get watch progress for all episodes
  const videoIds = channel.videos.map((v) => v.id);
  const sessions = await prisma.watchSession.findMany({
    where: {
      childId: childSession.profileId,
      videoId: { in: videoIds },
    },
    orderBy: { startedAt: 'desc' },
    distinct: ['videoId'],
    select: { videoId: true, duration: true, completed: true, lastPosition: true },
  });
  const progressMap = new Map(sessions.map((s) => [s.videoId, s]));

  const posterThumbnail = channel.videos.find((v) => v.thumbnailPath)?.thumbnailPath;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 shadow backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Link
            href="/child/explorer"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{channel.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Show header */}
        <div className="mb-8 flex gap-6">
          <div className="hidden sm:block w-40 flex-shrink-0">
            <div className="aspect-video overflow-hidden rounded-xl bg-gray-800 shadow-lg">
              {posterThumbnail ? (
                <img
                  src={posterThumbnail.startsWith('http') ? posterThumbnail : `/api/thumbnails/${posterThumbnail}`}
                  alt={channel.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                  <span className="text-4xl">📺</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900">{channel.name}</h2>
            {channel.description && (
              <p className="mt-2 text-gray-600 line-clamp-3">{channel.description}</p>
            )}
            <p className="mt-3 text-sm text-gray-500">
              {channel.videos.length} {channel.videos.length === 1 ? 'episode' : 'episodes'}
            </p>
          </div>
        </div>

        {/* Episode list */}
        <div className="space-y-3">
          {channel.videos.map((video, index) => {
            const progress = progressMap.get(video.id);
            const isCompleted = progress?.completed;
            const lastPosition = progress?.lastPosition ?? 0;
            const progressPct =
              video.duration > 0 ? Math.min((lastPosition / video.duration) * 100, 100) : 0;
            const { label: episodeLabel, year } = parseEpisodeTitle(video.title, channel.name);

            return (
              <Link
                key={video.id}
                href={`/child/watch/${video.id}`}
                className="group flex gap-4 rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative w-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800 aspect-video">
                  {video.thumbnailPath ? (
                    <img
                      src={video.thumbnailPath.startsWith('http') ? video.thumbnailPath : `/api/thumbnails/${video.thumbnailPath}`}
                      alt={episodeLabel}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-3xl">🎬</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute right-1 top-1 rounded-full bg-green-500 p-1">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {/* Progress bar */}
                  {progressPct > 0 && !isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                      <div className="h-full bg-blue-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    Episode {index + 1}{year ? ` · ${year}` : ''}
                  </p>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                    {episodeLabel}
                  </h3>
                  {video.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    {video.duration > 0 && <span>{formatDuration(video.duration)}</span>}
                    {isCompleted && <span className="text-green-600 font-medium">Watched</span>}
                    {!isCompleted && lastPosition > 60 && (
                      <span className="text-blue-600 font-medium">Continue watching</span>
                    )}
                  </div>
                </div>

                {/* Play arrow */}
                <div className="flex items-center text-gray-300 group-hover:text-blue-500 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
