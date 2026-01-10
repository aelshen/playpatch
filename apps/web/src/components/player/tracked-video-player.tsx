/**
 * Tracked Video Player Component
 * SSK-075: Video Player Component
 *
 * Video player with watch session tracking
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoPlayer } from './video-player';

interface TrackedVideoPlayerProps {
  video: {
    id: string;
    title: string;
    familyId: string;
    thumbnailPath?: string | null;
  };
  resumePosition?: number;
  className?: string;
}

export function TrackedVideoPlayer({
  video,
  resumePosition = 0,
  className = '',
}: TrackedVideoPlayerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start a new watch session
  const startSession = useCallback(async () => {
    if (hasStartedSession) return;

    try {
      const response = await fetch(`/api/watch/${video.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setHasStartedSession(true);
        console.log('[Session] Started:', data.sessionId);
      } else {
        console.error('[Session] Failed to start session');
      }
    } catch (error) {
      console.error('[Session] Error starting session:', error);
    }
  }, [video.id, hasStartedSession]);

  // Update watch progress
  const updateProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!sessionId) return;

      // Debounce updates - only send if it's been at least 5 seconds since last update
      const now = Date.now();
      if (now - lastUpdateRef.current < 5000) {
        return;
      }

      try {
        const response = await fetch(`/api/watch/${video.id}/progress`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            lastPosition: Math.floor(currentTime),
            duration: Math.floor(duration),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          lastUpdateRef.current = now;
          lastPositionRef.current = currentTime;

          if (data.completed) {
            console.log('[Session] Video completed');
          }
        }
      } catch (error) {
        console.error('[Session] Error updating progress:', error);
      }
    },
    [sessionId, video.id]
  );

  // Handle time updates from player
  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      // Start session on first play
      if (!hasStartedSession && currentTime > 0) {
        startSession();
      }
    },
    [hasStartedSession, startSession]
  );

  // Set up heartbeat interval
  useEffect(() => {
    if (sessionId) {
      // Clear any existing interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Set up new interval for heartbeat updates
      heartbeatIntervalRef.current = setInterval(() => {
        // This will be called by the player's onTimeUpdate
        // We just need to ensure the interval exists
      }, 10000);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [sessionId]);

  // Enhanced time update handler with duration tracking
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const handleTimeUpdateWithTracking = useCallback(
    (currentTime: number) => {
      handleTimeUpdate(currentTime);

      // Update progress if we have a session and duration
      if (sessionId && videoDuration > 0) {
        // Check if enough time has passed since last update
        const timeSinceLastUpdate = currentTime - lastPositionRef.current;
        if (timeSinceLastUpdate >= 10) {
          updateProgress(currentTime, videoDuration);
        }
      }
    },
    [handleTimeUpdate, sessionId, videoDuration, updateProgress]
  );

  // We need to track duration separately since the player might not expose it initially
  // We'll use a wrapper to capture duration when the player loads
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDuration = () => {
      const videoElement = videoPlayerRef.current?.querySelector('video');
      if (videoElement && videoElement.duration && !isNaN(videoElement.duration)) {
        setVideoDuration(videoElement.duration);
      }
    };

    // Check periodically until we get the duration
    const interval = setInterval(checkDuration, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    if (sessionId && videoDuration > 0) {
      updateProgress(videoDuration, videoDuration);
    }
  }, [sessionId, videoDuration, updateProgress]);

  return (
    <div ref={videoPlayerRef} className={className}>
      <VideoPlayer
        video={video}
        resumePosition={resumePosition}
        onTimeUpdate={handleTimeUpdateWithTracking}
        onEnded={handleVideoEnded}
      />
    </div>
  );
}
