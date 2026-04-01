'use client';

/**
 * SafeYouTubePlayer
 *
 * Embeds a YouTube video with best-effort suppression of recommendations,
 * navigation to YouTube, and YouTube branding. Used as a fallback when
 * the video has not yet been downloaded/transcoded to HLS.
 *
 * Blocking techniques:
 *   - rel=0, iv_load_policy=3, fs=0, enablejsapi=1 embed params
 *   - Static transparent overlays on title bar, right edge (miniplayer button)
 *   - Full-width bottom bar (ResizeObserver-sized) covering share/progress/logo
 *   - State overlays via YT IFrame Player API:
 *       PAUSED  → opaque overlay hides the "more videos" suggestion panel
 *       T-22s   → transparent blocker covers end-screen cards
 *       ENDED   → full "Watch Again" screen replaces recommendations grid
 *
 * Known limitations (browser-level, cannot be blocked):
 *   - Right-click → "Watch on YouTube" context menu
 *   - Middle-click on any link inside the iframe
 *   - rel=0 limits related videos to same channel but cannot fully suppress them
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const END_CARD_BUFFER_SECS = 22;

// ---------------------------------------------------------------------------
// YT API loader (singleton)
// ---------------------------------------------------------------------------
let ytApiLoading = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYTApi(onReady: () => void) {
  if (ytApiReady) {
    onReady();
    return;
  }
  ytApiCallbacks.push(onReady);
  if (ytApiLoading) return;
  ytApiLoading = true;

  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytApiCallbacks.forEach((cb) => cb());
    ytApiCallbacks.length = 0;
  };

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

// ---------------------------------------------------------------------------
// Overlay state
// ---------------------------------------------------------------------------
type OverlayKind = 'none' | 'paused' | 'near-end' | 'ended';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface SafeYouTubePlayerProps {
  /** YouTube video ID (video.sourceId) */
  videoId: string;
  /** Video title — shown on the ended overlay */
  title: string;
  className?: string;
}

export function SafeYouTubePlayer({ videoId, title, className }: SafeYouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [overlay, setOverlay] = useState<OverlayKind>('none');
  const [bottomBarPx, setBottomBarPx] = useState(64);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(
    (player: YTPlayer) => {
      stopPoll();
      pollRef.current = setInterval(() => {
        const t = player.getCurrentTime();
        const d = player.getDuration();
        if (d > 0 && d - t <= END_CARD_BUFFER_SECS) {
          setOverlay((prev) => (prev === 'ended' ? 'ended' : 'near-end'));
        }
      }, 500);
    },
    [stopPoll]
  );

  // ResizeObserver: YouTube controls are fixed ~48px, scale up for small players
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      setBottomBarPx(h < 300 ? Math.round(h * 0.18) : 64);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    setOverlay('none');
    playerRef.current?.destroy();
    playerRef.current = null;

    loadYTApi(() => {
      if (!containerRef.current) return;
      const instance = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          iv_load_policy: 3,
          controls: 1,
          fs: 0,
          enablejsapi: 1,
          color: 'white',
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current = instance;
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setOverlay((prev) => {
                if (prev === 'ended' || prev === 'near-end') return prev;
                return 'none';
              });
              startPoll(instance);
            } else if (e.data === S.PAUSED) {
              stopPoll();
              setOverlay((prev) => (prev === 'ended' || prev === 'near-end' ? prev : 'paused'));
            } else if (e.data === S.ENDED) {
              stopPoll();
              setOverlay('ended');
            }
          },
        },
      });
    });

    return () => {
      stopPoll();
      try {
        playerRef.current?.destroy();
      } catch {
        /* cross-origin teardown */
      }
      playerRef.current = null;
    };
  }, [videoId, startPoll, stopPoll]);

  const handleWatchAgain = () => {
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
    setOverlay('none');
  };

  const handleResumeFromNearEnd = () => {
    setOverlay('none');
    playerRef.current?.playVideo();
  };

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}
    >
      {/* YouTube player target */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Title bar — blocks click-through to YouTube watch page */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '13%',
          zIndex: 10,
          pointerEvents: 'all',
          cursor: 'default',
        }}
      />

      {/* Right edge — blocks miniplayer/fullscreen hover button */}
      <div
        style={{
          position: 'absolute',
          top: '13%',
          bottom: `${bottomBarPx}px`,
          right: 0,
          width: '6%',
          zIndex: 10,
          pointerEvents: 'all',
          cursor: 'default',
        }}
      />

      {/* Bottom bar — covers share, progress bar, more videos, YT logo */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${bottomBarPx}px`,
          zIndex: 10,
          pointerEvents: 'all',
          cursor: 'default',
        }}
      />

      {/* PAUSED — blocks "more videos" suggestion panel */}
      {overlay === 'paused' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => {
            playerRef.current?.playVideo();
            setOverlay('none');
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>Tap to resume</p>
          </div>
        </div>
      )}

      {/* NEAR END — transparent blocker over end-screen card area */}
      {overlay === 'near-end' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '70%',
              pointerEvents: 'all',
              cursor: 'default',
            }}
          />
          <button
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              pointerEvents: 'all',
            }}
            onClick={handleResumeFromNearEnd}
          >
            Keep watching
          </button>
        </div>
      )}

      {/* ENDED — replaces recommendations grid */}
      {overlay === 'ended' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <p
            style={{
              color: 'white',
              fontWeight: 600,
              fontSize: 18,
              margin: 0,
              textAlign: 'center',
              padding: '0 24px',
            }}
          >
            {title}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>Video finished</p>
          <button
            onClick={handleWatchAgain}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#2563eb',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Watch again
          </button>
        </div>
      )}
    </div>
  );
}
