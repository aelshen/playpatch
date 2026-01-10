/**
 * Video Player Component
 * SSK-075: Video Player Component
 *
 * Main HLS video player with controls
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVideoPlayer } from './use-video-player';
import { PlayerControls } from './player-controls';

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    familyId: string;
    thumbnailPath?: string | null;
  };
  resumePosition?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  className?: string;
}

export function VideoPlayer({
  video,
  resumePosition = 0,
  onTimeUpdate,
  onEnded,
  className = '',
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Construct video URL
  // Format: /api/video/{familyId}/{videoId}/hls/master.m3u8
  const videoUrl = `/api/video/${video.familyId}/${video.id}/hls/master.m3u8`;

  // Construct poster URL from thumbnail
  const posterUrl = video.thumbnailPath?.startsWith('http')
    ? video.thumbnailPath
    : video.thumbnailPath
    ? `/api/thumbnails/${video.thumbnailPath}`
    : undefined;

  // Memoize error handler to prevent re-initialization
  const handleError = useCallback((err: Error) => {
    console.error('Video player error:', err);
  }, []);

  // Initialize video player
  const {
    videoRef,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    playbackRate,
    isFullscreen,
    error,
    qualityLevels,
    currentQuality,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    toggleFullscreen,
    setQuality,
    retry,
  } = useVideoPlayer({
    videoUrl,
    resumePosition,
    onTimeUpdate,
    onEnded,
    onError: handleError,
  });

  // Auto-hide controls after inactivity
  const resetControlsTimeout = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    setShowControls(true);

    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds of inactivity
      setControlsTimeout(timeout);
    }
  };

  // Handle mouse move
  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleFullscreen, seek, setVolume, currentTime, duration, volume]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Show controls when playing state changes
  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying]);

  if (error) {
    return (
      <div className={`relative bg-black ${className}`}>
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
          <svg
            className="mb-4 h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mb-2 text-xl font-semibold">Playback Error</h3>
          <p className="mb-4 text-sm text-gray-400">{error.message}</p>
          <button
            onClick={retry}
            className="rounded-lg bg-blue-500 px-6 py-2 font-medium hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="h-full w-full"
        poster={posterUrl}
        onClick={togglePlay}
      />

      {/* Loading overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="rounded-full bg-black/50 p-6 text-white transition-all hover:bg-black/70 hover:scale-110"
            aria-label="Play"
          >
            <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Controls */}
      {(showControls || !isPlaying) && (
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          qualityLevels={qualityLevels}
          currentQuality={currentQuality}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onVolumeChange={setVolume}
          onPlaybackRateChange={setPlaybackRate}
          onQualityChange={setQuality}
          onToggleFullscreen={toggleFullscreen}
          videoElement={videoRef.current}
        />
      )}
    </div>
  );
}
