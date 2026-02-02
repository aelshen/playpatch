/**
 * Conversation List Client Component
 * Client wrapper for managing conversation list state
 */

'use client';

import { useState, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConversationGrid } from './conversation-grid';
import { ConversationSearchBar } from './conversation-search-bar';

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

interface ConversationListClientProps {
  conversations: Conversation[];
  mode: 'toddler' | 'explorer';
  profileId: string;
  initialQuery?: string;
  initialFavorited?: boolean;
}

export function ConversationListClient({
  conversations: initialConversations,
  mode,
  profileId,
  initialQuery = '',
  initialFavorited = false,
}: ConversationListClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);

  // Optimistic updates for favorite toggle
  const [optimisticConversations, setOptimisticConversations] = useOptimistic(
    conversations,
    (state, { conversationId, isFavorite }: { conversationId: string; isFavorite: boolean }) => {
      return state.map((conv) =>
        conv.id === conversationId ? { ...conv, isFavorite } : conv
      );
    }
  );

  const handleSearch = (query: string, favorited: boolean) => {
    // Build query params
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (favorited) params.set('favorited', 'true');

    // Navigate with query params
    const queryString = params.toString();
    const basePath = `/child/${mode}/chats`;
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const handleFavoriteToggle = async (conversationId: string, isFavorite: boolean) => {
    // Optimistic update
    setOptimisticConversations({ conversationId, isFavorite });

    try {
      const response = await fetch(
        `/api/profiles/${profileId}/conversations/${conversationId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isFavorite }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      // Update actual state on success
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, isFavorite } : conv
        )
      );

      toast.success(
        isFavorite ? 'Added to favorites!' : 'Removed from favorites'
      );
    } catch (error) {
      // Revert optimistic update on error
      setConversations(conversations);
      toast.error('Failed to update favorite status');
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <ConversationSearchBar
        mode={mode}
        initialQuery={initialQuery}
        initialFavorited={initialFavorited}
        onSearch={handleSearch}
      />

      {/* Conversation grid */}
      <ConversationGrid
        conversations={optimisticConversations}
        mode={mode}
        profileId={profileId}
        onFavoriteToggle={handleFavoriteToggle}
      />
    </div>
  );
}
