/**
 * Player Controls Component
 * SSK-075: Video Player Component
 *
 * UI controls for video playback
 */

'use client';

import { useState } from 'react';
import { ProgressBar } from './progress-bar';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  qualityLevels: Array<{ index: number; height: number; bitrate: number }>;
  currentQuality: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onQualityChange: (level: number) => void;
  onToggleFullscreen: () => void;
  videoElement?: HTMLVideoElement | null;
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  isFullscreen,
  qualityLevels,
  currentQuality,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onQualityChange,
  onToggleFullscreen,
  videoElement,
}: PlayerControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          buffered={videoElement?.buffered}
          onSeek={onSeek}
        />
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="text-white hover:text-blue-400 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={volume > 0 ? 'Mute' : 'Unmute'}
            >
              {volume === 0 ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            {showVolumeSlider && (
              <div className="absolute bottom-full left-0 mb-2 rounded bg-black/90 p-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="h-24 w-2 cursor-pointer appearance-none bg-gray-600 [writing-mode:bt-lr]"
                  style={{
                    background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Settings menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Settings"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>

            {/* Settings dropdown */}
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 min-w-48 rounded bg-black/90 p-2 text-sm text-white">
                {/* Playback speed */}
                <div className="mb-2">
                  <div className="mb-1 font-medium">Playback Speed</div>
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => onPlaybackRateChange(rate)}
                      className={`block w-full rounded px-3 py-1 text-left hover:bg-white/10 ${
                        playbackRate === rate ? 'bg-blue-500/50' : ''
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>

                {/* Quality */}
                {qualityLevels.length > 0 && (
                  <div>
                    <div className="mb-1 font-medium">Quality</div>
                    <button
                      onClick={() => onQualityChange(-1)}
                      className={`block w-full rounded px-3 py-1 text-left hover:bg-white/10 ${
                        currentQuality === -1 ? 'bg-blue-500/50' : ''
                      }`}
                    >
                      Auto
                    </button>
                    {qualityLevels.map((level) => (
                      <button
                        key={level.index}
                        onClick={() => onQualityChange(level.index)}
                        className={`block w-full rounded px-3 py-1 text-left hover:bg-white/10 ${
                          currentQuality === level.index ? 'bg-blue-500/50' : ''
                        }`}
                      >
                        {level.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
