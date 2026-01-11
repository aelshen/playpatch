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

interface SmartSuggestionsSidebarProps {
  videoId: string;
  childProfileId: string;
  childName?: string;
  fallbackVideos: Video[];
  showChatToggle?: boolean;
  isChatExpanded?: boolean;
  onChatToggle?: () => void;
}

export function SmartSuggestionsSidebar({
  videoId,
  childProfileId,
  childName,
  fallbackVideos,
  showChatToggle = false,
  isChatExpanded = false,
  onChatToggle,
}: SmartSuggestionsSidebarProps) {
  const [videos, setVideos] = useState<Video[]>(fallbackVideos);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setVideos(data.recommendations);
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
