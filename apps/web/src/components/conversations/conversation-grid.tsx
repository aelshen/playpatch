/**
 * Conversation Grid Component
 * Displays conversations in a responsive grid layout
 */

'use client';

import { ConversationCard } from './conversation-card';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
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
}

interface ConversationGridProps {
  conversations: Conversation[];
  mode: 'toddler' | 'explorer';
  profileId: string;
  onFavoriteToggle?: (conversationId: string, isFavorite: boolean) => void;
}

export function ConversationGrid({
  conversations,
  mode,
  profileId,
  onFavoriteToggle,
}: ConversationGridProps) {
  if (conversations.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center',
          mode === 'toddler'
            ? 'rounded-3xl bg-white/80 p-12 shadow-xl'
            : 'rounded-lg bg-white/50 p-8'
        )}
      >
        <MessageCircle
          className="text-gray-400 mb-4"
          size={mode === 'toddler' ? 64 : 48}
        />
        <p
          className={cn(
            'text-gray-600 font-medium',
            mode === 'toddler' ? 'text-2xl' : 'text-lg'
          )}
        >
          No conversations yet
        </p>
        <p
          className={cn(
            'text-gray-500 mt-2',
            mode === 'toddler' ? 'text-xl' : 'text-sm'
          )}
        >
          Start chatting with AI while watching videos!
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        mode === 'toddler'
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}
    >
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          mode={mode}
          profileId={profileId}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  );
}
