/**
 * Video Player Custom Hook
 * SSK-075: Video Player Component
 *
 * Manages video player state and HLS.js integration
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

export interface UseVideoPlayerOptions {
  videoUrl: string;
  resumePosition?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export interface UseVideoPlayerReturn {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement>;

  // State
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  error: Error | null;
  qualityLevels: Array<{ index: number; height: number; bitrate: number }>;
  currentQuality: number;

  // Controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  setQuality: (level: number) => void;
  retry: () => void;
}

export function useVideoPlayer(options: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { videoUrl, resumePosition = 0, onTimeUpdate, onEnded, onError } = options;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Refs for callbacks to avoid re-initializing HLS on callback changes
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onTimeUpdate, onEnded, onError]);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [qualityLevels, setQualityLevels] = useState<Array<{ index: number; height: number; bitrate: number }>>([]);
  const [currentQuality, setCurrentQualityState] = useState(-1); // -1 = auto

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startPosition: resumePosition,
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      // Handle HLS events
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[HLS] Manifest parsed');

        // Get quality levels
        const levels = hls.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
        }));
        setQualityLevels(levels);
        setCurrentQualityState(hls.currentLevel);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQualityState(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('[HLS] Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('[HLS] Fatal network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('[HLS] Fatal media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal error, cannot recover');
              const err = new Error(`HLS Error: ${data.type} - ${data.details}`);
              setError(err);
              onErrorRef.current?.(err);
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoUrl;
    } else {
      const err = new Error('HLS is not supported in this browser');
      setError(err);
      onErrorRef.current?.(err);
    }
  }, [videoUrl, resumePosition]); // Removed onError from deps

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdateRef.current?.(video.currentTime);
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChange = () => setVolumeState(video.volume);
    const handleRateChange = () => setPlaybackRateState(video.playbackRate);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, []); // No dependencies - event handlers use refs

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Control functions
  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await videoRef.current?.parentElement?.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  }, []);

  const setQuality = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQualityState(level);
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    if (hlsRef.current) {
      hlsRef.current.startLoad();
    } else if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  return {
    // Refs
    videoRef,

    // State
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

    // Controls
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    toggleFullscreen,
    setQuality,
    retry,
  };
}
