/**
 * Child Watch Page
 * SSK-075: Video Player Component
 *
 * Video watching page for children - YouTube-style layout
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { getCurrentChildProfile } from '@/lib/auth/session';
import { TrackedVideoPlayer } from '@/components/player/tracked-video-player';
import { SafeYouTubePlayer } from '@/components/player/safe-youtube-player';
import { ageRatingToNumber, getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { VideoViewerLayout } from '@/components/child/watch/video-viewer-layout';
import { VideoInfoSection } from '@/components/child/watch/video-info-section';
import { VideoActionsWrapper } from '@/components/child/watch/video-actions-wrapper';
import { SmartSuggestionsSidebar } from '@/components/child/watch/smart-suggestions-sidebar';

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

  // Check if video is watchable — either via embed or HLS
  const isWatchable =
    video.approvalStatus === 'APPROVED' &&
    (video.playbackMode === 'EMBED' || video.playbackMode === 'HLS');

  if (!isWatchable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Video Not Ready</h1>
          <p className="mb-6 text-gray-400">
            {video.approvalStatus === 'PENDING'
              ? 'This video is awaiting approval.'
              : video.approvalStatus === 'REJECTED'
                ? 'This video is not available.'
                : video.status === 'DOWNLOADING'
                  ? 'This video is being downloaded.'
                  : video.status === 'PROCESSING'
                    ? 'This video is being processed.'
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
    include: {
      channel: true,
    },
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get past conversations for this video
  const pastConversations = await prisma.aIConversation.findMany({
    where: {
      childId: childProfile.id,
      videoId: video.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 3,
  });

  // Get view count for this video
  const viewCount = await prisma.watchSession.count({
    where: {
      videoId: video.id,
    },
  });

  // Check if video is favorited
  const favorite = await prisma.favorite.findUnique({
    where: {
      childId_videoId: {
        childId: childProfile.id,
        videoId: video.id,
      },
    },
  });

  return (
    <VideoViewerLayout
      backButton={
        <Link
          href={`/child/${childProfile.uiMode.toLowerCase()}`}
          className="flex items-center gap-2 text-white hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Back</span>
        </Link>
      }
      videoPlayer={
        video.playbackMode === 'HLS' ? (
          <TrackedVideoPlayer
            video={{
              id: video.id,
              title: video.title,
              familyId: video.familyId,
              thumbnailPath: video.thumbnailPath,
            }}
            resumePosition={resumePosition}
            className="h-full w-full"
          />
        ) : (
          <SafeYouTubePlayer
            videoId={video.sourceId!}
            title={video.title}
            className="h-full w-full"
          />
        )
      }
      actionBar={
        <VideoActionsWrapper
          videoId={video.id}
          childProfileId={childProfile.id}
          isFavorited={!!favorite}
        />
      }
      videoInfo={
        <VideoInfoSection
          title={video.title}
          channel={video.channel}
          description={video.description}
          viewCount={viewCount}
          ageRating={video.ageRating.replace('AGE_', '').replace('_PLUS', '')}
        />
      }
      sidebar={
        <SmartSuggestionsSidebar
          videoId={video.id}
          childProfileId={childProfile.id}
          childName={childProfile.name}
          fallbackVideos={relatedVideos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailPath: v.thumbnailPath,
            duration: v.duration,
            channel: v.channel,
          }))}
          pastConversations={pastConversations.map((conv) => ({
            id: conv.id,
            startedAt: conv.startedAt,
            lastMessage: conv.messages[0]?.content || 'Tap to view chat',
          }))}
          uiMode={childProfile.uiMode}
          showChatToggle={true}
        />
      }
    />
  );
}
