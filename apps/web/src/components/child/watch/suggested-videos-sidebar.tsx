/**
 * Suggested Videos Sidebar
 * Displays recommended/related videos in vertical list with AI chat toggle
 */

'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AiChatPanel } from './ai-chat-panel';

interface Video {
  id: string;
  title: string;
  thumbnailPath?: string | null;
  duration?: number | null;
  channel?: {
    name: string;
  } | null;
}

interface PastConversation {
  id: string;
  startedAt: Date;
  lastMessage: string;
}

interface SuggestedVideosSidebarProps {
  /**
   * List of suggested videos
   */
  videos: Video[];

  /**
   * Whether to show AI chat toggle button
   */
  showChatToggle?: boolean;

  /**
   * Whether AI chat is expanded
   */
  isChatExpanded?: boolean;

  /**
   * Callback when chat toggle is clicked
   */
  onChatToggle?: () => void;

  /**
   * Callback to load more videos
   */
  onLoadMore?: () => void;

  /**
   * Whether more videos can be loaded
   */
  hasMore?: boolean;

  /**
   * Whether videos are loading
   */
  isLoading?: boolean;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Current video ID for AI chat context
   */
  videoId?: string;

  /**
   * Child profile ID for AI chat
   */
  childProfileId?: string;

  /**
   * Child name for AI chat
   */
  childName?: string;

  /**
   * Past conversations for this video
   */
  pastConversations?: PastConversation[];

  /**
   * UI mode (TODDLER or EXPLORER)
   */
  uiMode?: string;
}

export function SuggestedVideosSidebar({
  videos,
  pastConversations = [],
  uiMode = 'EXPLORER',
  showChatToggle = false,
  isChatExpanded = false,
  onChatToggle,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className,
  videoId,
  childProfileId,
  childName,
}: SuggestedVideosSidebarProps) {
  const mode = uiMode.toLowerCase() as 'toddler' | 'explorer';
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with optional chat toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {isChatExpanded ? 'AI Chat' : 'Suggested Videos'}
        </h2>

        {showChatToggle && (
          <button
            onClick={onChatToggle}
            className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
            title={isChatExpanded ? 'Show suggested videos' : 'Open AI chat'}
          >
            {isChatExpanded ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Suggestions</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>AI Chat</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Video list */}
      {!isChatExpanded && (
        <>
          <div className="space-y-3">
            {videos.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No suggestions available
              </p>
            ) : (
              videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/child/watch/${video.id}`}
                  className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-gray-700"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-md bg-gray-700">
                    {video.thumbnailPath && (
                      <img
                        src={
                          video.thumbnailPath.startsWith('http')
                            ? video.thumbnailPath
                            : `/api/thumbnails/${video.thumbnailPath}`
                        }
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    )}
                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                        {Math.floor(video.duration / 60)}:
                        {(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Video info */}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="mb-1 text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400">
                      {video.title}
                    </h3>
                    {video.channel && (
                      <p className="text-xs text-gray-400">{video.channel.name}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Past Chats Section */}
          {pastConversations.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle size={20} />
                Past Chats
              </h3>
              <div className="space-y-2">
                {pastConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/child/${mode}/chats/${conversation.id}`}
                    className="block rounded-lg bg-gray-700/50 p-3 transition-colors hover:bg-gray-600"
                  >
                    <p className="text-sm text-gray-300 line-clamp-2 mb-1">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.startedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </Link>
                ))}
              </div>
              {videoId && (
                <Link
                  href={`/child/${mode}/chats?videoId=${videoId}`}
                  className="block text-center rounded-lg bg-blue-500/20 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                >
                  View All Chats
                </Link>
              )}
            </div>
          )}

          {/* Load more button */}
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="w-full rounded-lg bg-gray-700 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load More'
              )}
            </button>
          )}
        </>
      )}

      {/* AI chat panel */}
      {isChatExpanded && videoId && childProfileId && childName && (
        <div className="min-h-[500px]">
          <AiChatPanel
            videoId={videoId}
            childProfileId={childProfileId}
            childName={childName}
            isExpanded={isChatExpanded}
            onToggle={onChatToggle}
          />
        </div>
      )}
    </div>
  );
}
