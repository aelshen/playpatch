/**
 * Child Watch Page
 * SSK-075: Video Player Component
 *
 * Video watching page for children
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { getCurrentChildProfile } from '@/lib/auth/session';
import { TrackedVideoPlayer } from '@/components/player/tracked-video-player';
import { ageRatingToNumber, getAllowedAgeRatings } from '@/lib/utils/age-rating';

interface WatchPageProps {
  params: {
    videoId: string;
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = params;

  // Get current child profile
  const childProfile = await getCurrentChildProfile();
  if (!childProfile) {
    redirect('/profiles');
  }

  // Fetch video
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      channel: true,
    },
  });

  if (!video) {
    notFound();
  }

  // Check if video is ready
  if (video.status !== 'READY') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Video Not Ready</h1>
          <p className="mb-6 text-gray-400">
            {video.approvalStatus === 'PENDING'
              ? 'This video is awaiting approval.'
              : video.status === 'DOWNLOADING'
              ? 'This video is being downloaded.'
              : video.status === 'PROCESSING'
              ? 'This video is being processed.'
              : video.status === 'ERROR'
              ? 'There was an error preparing this video.'
              : 'This video is not available yet.'}
          </p>
          <Link
            href={`/child/${childProfile.uiMode.toLowerCase()}`}
            className="rounded-lg bg-blue-500 px-6 py-2 font-medium hover:bg-blue-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Check age rating
  const childAge = ageRatingToNumber(childProfile.ageRating);
  const videoAge = ageRatingToNumber(video.ageRating);

  if (childAge < videoAge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="mb-4 text-2xl font-bold">Age Restriction</h1>
          <p className="mb-6 text-gray-400">
            This video is rated {video.ageRating}+ and is not suitable for your age group.
          </p>
          <Link
            href={`/child/${childProfile.uiMode.toLowerCase()}`}
            className="rounded-lg bg-blue-500 px-6 py-2 font-medium hover:bg-blue-600"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get last watch position
  const lastSession = await prisma.watchSession.findFirst({
    where: {
      childId: childProfile.id,
      videoId: video.id,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  const resumePosition = lastSession?.lastPosition || 0;

  // Get related videos (same channel, appropriate age rating)
  const allowedRatings = getAllowedAgeRatings(childProfile.ageRating);

  const relatedVideos = await prisma.video.findMany({
    where: {
      id: { not: videoId },
      status: 'READY',
      approvalStatus: 'APPROVED',
      ageRating: { in: allowedRatings },
      channelId: video.channelId,
    },
    take: 6,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Back button */}
      <div className="absolute left-4 top-4 z-10">
        <Link
          href={`/child/${childProfile.uiMode.toLowerCase()}`}
          className="flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-white hover:bg-black/70"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Video player */}
      <div className="flex-1 flex items-center justify-center">
        <TrackedVideoPlayer
          video={{
            id: video.id,
            title: video.title,
            familyId: video.familyId,
            thumbnailPath: video.thumbnailPath,
          }}
          resumePosition={resumePosition}
          className="w-full max-w-7xl"
        />
      </div>

      {/* Video info */}
      <div className="border-t border-gray-800 bg-gray-800 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">{video.title}</h1>
        {video.channel && (
          <p className="mb-2 text-sm text-gray-400">{video.channel.name}</p>
        )}
        {video.description && (
          <p className="text-sm text-gray-300">{video.description}</p>
        )}
      </div>

      {/* Related videos */}
      {relatedVideos.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Up Next</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {relatedVideos.map((relatedVideo) => (
              <Link
                key={relatedVideo.id}
                href={`/child/watch/${relatedVideo.id}`}
                className="group"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
                  {relatedVideo.thumbnailPath && (
                    <img
                      src={
                        relatedVideo.thumbnailPath.startsWith('http')
                          ? relatedVideo.thumbnailPath
                          : `/api/thumbnails/${relatedVideo.thumbnailPath}`
                      }
                      alt={relatedVideo.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <svg
                      className="h-12 w-12 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-medium text-white line-clamp-2">
                  {relatedVideo.title}
                </h3>
                {relatedVideo.duration && (
                  <p className="text-xs text-gray-400">
                    {Math.floor(relatedVideo.duration / 60)}:
                    {(relatedVideo.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
