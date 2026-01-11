/**
 * Video Info Section
 * Displays video title, channel, views, and description
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoInfoSectionProps {
  /**
   * Video title
   */
  title: string;

  /**
   * Channel information
   */
  channel?: {
    name: string;
    thumbnailPath?: string | null;
  };

  /**
   * Video description
   */
  description?: string | null;

  /**
   * View count
   */
  viewCount?: number;

  /**
   * Age rating badge
   */
  ageRating?: string;

  /**
   * Additional class names
   */
  className?: string;
}

export function VideoInfoSection({
  title,
  channel,
  description,
  viewCount,
  ageRating,
  className,
}: VideoInfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Truncate description to 3 lines if not expanded
  const shouldTruncate = description && description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded
    ? description.slice(0, 150) + '...'
    : description;

  return (
    <div className={cn('rounded-lg bg-gray-800 p-6', className)}>
      {/* Title */}
      <h1 className="mb-3 text-xl font-bold text-white md:text-2xl">{title}</h1>

      {/* Channel info and metadata */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Channel */}
        {channel && (
          <div className="flex items-center gap-2">
            {channel.thumbnailPath && (
              <img
                src={
                  channel.thumbnailPath.startsWith('http')
                    ? channel.thumbnailPath
                    : `/api/thumbnails/${channel.thumbnailPath}`
                }
                alt={channel.name}
                className="h-8 w-8 rounded-full bg-gray-700 object-cover"
              />
            )}
            <span className="text-sm font-medium text-gray-300">{channel.name}</span>
          </div>
        )}

        {/* View count */}
        {viewCount !== undefined && viewCount > 0 && (
          <>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-400">
              {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
            </span>
          </>
        )}

        {/* Age rating badge */}
        {ageRating && (
          <>
            <span className="text-gray-600">•</span>
            <span className="rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
              {ageRating}+
            </span>
          </>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {displayDescription}
          </p>

          {/* Show more/less button */}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              {isExpanded ? (
                <>
                  <span>Show less</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
