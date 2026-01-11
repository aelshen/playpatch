/**
 * Video Actions Wrapper
 * Client-side wrapper for video actions with API integration
 */

'use client';

import { useState } from 'react';
import { VideoActionsBar } from './video-actions-bar';

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
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleLikeClick = async () => {
    // TODO: Implement in Phase 4
    // Will call /api/favorites endpoint
    console.log('Like clicked - to be implemented in Phase 4');
  };

  const handlePlaylistClick = () => {
    // TODO: Implement in Phase 4
    // Will open playlist modal
    setShowPlaylistModal(true);
    console.log('Playlist clicked - to be implemented in Phase 4');
  };

  const handleRequestClick = () => {
    // TODO: Implement in Phase 4
    // Will open request modal
    setShowRequestModal(true);
    console.log('Request clicked - to be implemented in Phase 4');
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

      {/* Modals will be implemented in Phase 4 */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="rounded-lg bg-gray-800 p-6">
            <p className="text-white">Playlist modal - to be implemented in Phase 4</p>
            <button
              onClick={() => setShowPlaylistModal(false)}
              className="mt-4 rounded-lg bg-gray-700 px-4 py-2 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="rounded-lg bg-gray-800 p-6">
            <p className="text-white">Request modal - to be implemented in Phase 4</p>
            <button
              onClick={() => setShowRequestModal(false)}
              className="mt-4 rounded-lg bg-gray-700 px-4 py-2 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
