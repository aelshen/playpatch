/**
 * Video Actions Bar
 * Action buttons for video (like, playlist, request)
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoActionsBarProps {
  /**
   * Video ID
   */
  videoId: string;

  /**
   * Whether video is favorited
   */
  isFavorited?: boolean;

  /**
   * Callback when like button is clicked
   */
  onLikeClick?: () => Promise<void> | void;

  /**
   * Callback when playlist button is clicked
   */
  onPlaylistClick?: () => void;

  /**
   * Callback when request button is clicked
   */
  onRequestClick?: () => void;

  /**
   * Additional class names
   */
  className?: string;
}

export function VideoActionsBar({
  videoId,
  isFavorited = false,
  onLikeClick,
  onPlaylistClick,
  onRequestClick,
  className,
}: VideoActionsBarProps) {
  const [isLiked, setIsLiked] = useState(isFavorited);
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeClick = async () => {
    if (isLiking) return;

    setIsLiking(true);
    setIsLiked(!isLiked);

    try {
      await onLikeClick?.();
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Like button */}
      <button
        onClick={handleLikeClick}
        disabled={isLiking}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          isLiked
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        )}
        title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className={cn('h-5 w-5 transition-transform', isLiking && 'scale-125')}
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="hidden sm:inline">{isLiked ? 'Liked' : 'Like'}</span>
      </button>

      {/* Add to Playlist button */}
      <button
        onClick={onPlaylistClick}
        className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
        title="Add to playlist"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="hidden sm:inline">Save</span>
      </button>

      {/* Request More button */}
      <button
        onClick={onRequestClick}
        className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
        title="Request more videos like this"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <span className="hidden sm:inline">Request</span>
      </button>
    </div>
  );
}
