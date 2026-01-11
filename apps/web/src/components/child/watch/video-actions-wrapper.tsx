/**
 * Video Actions Wrapper
 * Client-side wrapper for video actions with API integration
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoActionsBar } from './video-actions-bar';
import { AddToPlaylistModal } from './add-to-playlist-modal';
import { RequestMoreModal } from './request-more-modal';

interface VideoActionsWrapperProps {
  videoId: string;
  childProfileId: string;
  isFavorited: boolean;
}

export function VideoActionsWrapper({
  videoId,
  childProfileId,
  isFavorited,
}: VideoActionsWrapperProps) {
  const router = useRouter();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleLikeClick = async () => {
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childProfileId,
          videoId,
        }),
      });

      if (response.ok) {
        // Refresh the page to update favorite status
        router.refresh();
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error; // Let VideoActionsBar handle the error
    }
  };

  const handlePlaylistClick = () => {
    setShowPlaylistModal(true);
  };

  const handleRequestClick = () => {
    setShowRequestModal(true);
  };

  return (
    <>
      <VideoActionsBar
        videoId={videoId}
        isFavorited={isFavorited}
        onLikeClick={handleLikeClick}
        onPlaylistClick={handlePlaylistClick}
        onRequestClick={handleRequestClick}
      />

      <AddToPlaylistModal
        videoId={videoId}
        childProfileId={childProfileId}
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
      />

      <RequestMoreModal
        videoId={videoId}
        childProfileId={childProfileId}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </>
  );
}
