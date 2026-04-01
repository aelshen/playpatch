/**
 * Conversation Card Component
 * Mode-agnostic conversation card with mode-specific styling
 */

'use client';

import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationCardProps {
  conversation: {
    id: string;
    videoId: string;
    videoTitle: string;
    videoThumbnail: string | null;
    videoDuration: number;
    startedAt: Date;
    isFavorite: boolean;
    topics: string[];
    lastMessage: {
      role: string;
      content: string;
      createdAt: Date;
    } | null;
  };
  mode: 'toddler' | 'explorer';
  profileId: string;
  onFavoriteToggle?: (conversationId: string, isFavorite: boolean) => void;
}

export function ConversationCard({
  conversation,
  mode,
  profileId,
  onFavoriteToggle,
}: ConversationCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(conversation.id, !conversation.isFavorite);
  };

  // Mode-specific styling
  const cardClasses = cn(
    'group relative overflow-hidden shadow-lg transition-all hover:shadow-2xl',
    mode === 'toddler'
      ? 'rounded-3xl border-4 border-white/50'
      : 'rounded-lg border border-gray-200'
  );

  const thumbnailClasses = cn(
    'relative overflow-hidden bg-gray-800',
    mode === 'toddler' ? 'aspect-video' : 'aspect-video'
  );

  const contentClasses = cn(
    'bg-white',
    mode === 'toddler' ? 'p-6' : 'p-4'
  );

  const titleClasses = cn(
    'font-bold text-gray-900 line-clamp-2 mb-2',
    mode === 'toddler' ? 'text-2xl' : 'text-lg'
  );

  const messageClasses = cn(
    'text-gray-600 line-clamp-2 mb-3',
    mode === 'toddler' ? 'text-lg' : 'text-sm'
  );

  const topicClasses = cn(
    'inline-block px-2 py-1 mr-2 mb-2 font-medium',
    mode === 'toddler'
      ? 'rounded-full text-sm bg-purple-100 text-purple-700 border-2 border-purple-200'
      : 'rounded-md text-xs bg-blue-50 text-blue-700'
  );

  const dateClasses = cn(
    'text-gray-500',
    mode === 'toddler' ? 'text-base' : 'text-xs'
  );

  const favoriteButtonClasses = cn(
    'transition-colors',
    mode === 'toddler' ? 'p-3' : 'p-2',
    conversation.isFavorite
      ? 'text-red-500 fill-red-500'
      : 'text-gray-400 hover:text-red-500'
  );

  const favoriteIconSize = mode === 'toddler' ? 32 : 20;

  return (
    <Link href={`/child/${mode}/chats/${conversation.id}`}>
      <div className={cardClasses}>
        {/* Thumbnail */}
        <div className={thumbnailClasses}>
          {conversation.videoThumbnail && (
            <img
              src={
                conversation.videoThumbnail.startsWith('http')
                  ? conversation.videoThumbnail
                  : `/api/thumbnails/${conversation.videoThumbnail}`
              }
              alt={conversation.videoTitle}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
          )}

          {/* Message indicator overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <MessageCircle
              className="text-white opacity-0 transition-opacity group-hover:opacity-90"
              size={mode === 'toddler' ? 48 : 32}
            />
          </div>

          {/* Duration badge */}
          {conversation.videoDuration > 0 && (
            <div
              className={cn(
                'absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-white',
                mode === 'toddler' ? 'text-base' : 'text-xs'
              )}
            >
              {Math.floor(conversation.videoDuration / 60)}:
              {(conversation.videoDuration % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={contentClasses}>
          <div className="flex items-start justify-between mb-2">
            <h3 className={titleClasses}>{conversation.videoTitle}</h3>
            <button
              onClick={handleFavoriteClick}
              className={favoriteButtonClasses}
              aria-label={conversation.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart size={favoriteIconSize} />
            </button>
          </div>

          {/* Last message preview */}
          {conversation.lastMessage && (
            <p className={messageClasses}>
              <span className="font-semibold">
                {conversation.lastMessage.role === 'CHILD' ? 'You' : 'AI'}:{' '}
              </span>
              {conversation.lastMessage.content}
            </p>
          )}

          {/* Topics */}
          {conversation.topics.length > 0 && (
            <div className="flex flex-wrap mb-3">
              {conversation.topics.slice(0, 3).map((topic) => (
                <span key={topic} className={topicClasses}>
                  {topic}
                </span>
              ))}
              {conversation.topics.length > 3 && (
                <span className={topicClasses}>
                  +{conversation.topics.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <p className={dateClasses}>
            {formatDistanceToNow(new Date(conversation.startedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
