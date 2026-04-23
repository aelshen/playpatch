/**
 * Video Grid Component
 */

'use client';

import Link from 'next/link';
import { formatDuration } from '@/lib/utils/shared';

interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  thumbnailPath: string | null;
  sourceUrl: string;
  sourceType: string;
  status: string;
  approvalStatus: string;
  ageRating: string;
  categories: string[];
  createdAt: Date;
  channel?: {
    id: string;
    name: string;
  } | null;
}

interface VideoGridProps {
  videos: Video[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOWNLOADING: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
};

const approvalColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

function VideoCard({ video }: { video: Video }) {
  const isError = video.status === 'ERROR';

  return (
    <div className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg">
      <Link href={`/admin/content/${video.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200">
          {video.thumbnailPath ? (
            <img
              src={video.thumbnailPath}
              alt={video.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              🎬
            </div>
          )}
          <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
            {formatDuration(video.duration)}
          </div>
          {isError && (
            <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
            {video.title}
          </h3>
          {video.channel && (
            <p className="mb-2 text-sm text-gray-600">{video.channel.name}</p>
          )}

          {/* Status Badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            {/* Source Type Badge */}
            {video.sourceType === 'YOUTUBE' && (
              <span className="rounded-full bg-red-100 text-red-800 px-2 py-1 text-xs font-medium">
                ▶️ YouTube
              </span>
            )}
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                statusColors[video.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {video.status}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                approvalColors[video.approvalStatus] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {video.approvalStatus}
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{video.ageRating.replace('_', ' ')}</span>
            <span>{video.categories.length} categories</span>
          </div>
        </div>
      </Link>

    </div>
  );
}

export function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
