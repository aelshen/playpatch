/**
 * Progress Bar Component
 * SSK-075: Video Player Component
 *
 * Draggable seek bar with buffered range display and time tooltip
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered?: TimeRanges;
  onSeek: (time: number) => void;
  className?: string;
}

export function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  className = '',
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate buffered percentage
  const getBufferedPercentage = useCallback(() => {
    if (!buffered || buffered.length === 0 || duration === 0) return 0;

    // Get the end of the last buffered range
    const bufferedEnd = buffered.end(buffered.length - 1);
    return (bufferedEnd / duration) * 100;
  }, [buffered, duration]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate time from mouse/touch position
  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!progressRef.current) return 0;

      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      return percentage * duration;
    },
    [duration]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      const time = getTimeFromPosition(e.clientX);
      onSeek(time);
    },
    [getTimeFromPosition, onSeek]
  );

  // Handle mouse move (while dragging or hovering)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = getTimeFromPosition(e.clientX);

      setHoverX(x);
      setHoverTime(time);

      if (isDragging) {
        onSeek(time);
      }
    },
    [getTimeFromPosition, isDragging, onSeek]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setIsDragging(true);
      const touch = e.touches[0];
      const time = getTimeFromPosition(touch.clientX);
      onSeek(time);
    },
    [getTimeFromPosition, onSeek]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const time = getTimeFromPosition(touch.clientX);
      onSeek(time);
    },
    [getTimeFromPosition, isDragging, onSeek]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse up listener while dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  return (
    <div className={`relative ${className}`}>
      {/* Time tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute bottom-full mb-2 -translate-x-1/2 rounded bg-black/90 px-2 py-1 text-xs text-white"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Progress bar container */}
      <div
        ref={progressRef}
        className="group relative h-2 cursor-pointer rounded-full bg-gray-600 transition-all hover:h-3"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Buffered range */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gray-400"
          style={{ width: `${getBufferedPercentage()}%` }}
        />

        {/* Current progress */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Scrubber handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      {/* Time display */}
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
