/**
 * Smart Suggestions Sidebar
 * Client-side component that fetches smart recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { SuggestedVideosSidebar } from './suggested-videos-sidebar';

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

interface SmartSuggestionsSidebarProps {
  videoId: string;
  childProfileId: string;
  childName?: string;
  fallbackVideos: Video[];
  pastConversations?: PastConversation[];
  uiMode?: string;
  showChatToggle?: boolean;
  isChatExpanded?: boolean;
  onChatToggle?: () => void;
}

export function SmartSuggestionsSidebar({
  videoId,
  childProfileId,
  childName,
  fallbackVideos,
  pastConversations = [],
  uiMode = 'EXPLORER',
  showChatToggle = false,
  isChatExpanded: externalIsChatExpanded,
  onChatToggle: externalOnChatToggle,
}: SmartSuggestionsSidebarProps) {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalIsChatExpanded, setInternalIsChatExpanded] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isChatExpanded = externalIsChatExpanded ?? internalIsChatExpanded;
  const onChatToggle =
    externalOnChatToggle ?? (() => setInternalIsChatExpanded(!internalIsChatExpanded));

  useEffect(() => {
    // Fetch smart recommendations on mount
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/recommendations/${videoId}?childProfileId=${childProfileId}&limit=10`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        if (data.recommendations?.length > 0) {
          setVideos(data.recommendations);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
        // Keep fallback videos on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [videoId, childProfileId]);

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-400">
          {error}. Showing related videos instead.
        </div>
      )}

      <SuggestedVideosSidebar
        videos={videos}
        pastConversations={pastConversations}
        uiMode={uiMode}
        showChatToggle={showChatToggle}
        isChatExpanded={isChatExpanded}
        onChatToggle={onChatToggle}
        isLoading={isLoading}
        videoId={videoId}
        childProfileId={childProfileId}
        childName={childName}
      />
    </div>
  );
}
