'use client';

/**
 * Demo: YouTube Embed Fallback Player
 *
 * Technique summary:
 *   1. rel=0              → limit end-of-video suggestions to same channel
 *   2. iv_load_policy=3   → disable info cards / annotations
 *   3. enablejsapi=1      → access YouTube IFrame Player API via postMessage
 *   4. Static CSS overlays → block YouTube logo (bottom-right) and title bar (top)
 *   5. State-driven overlays via YT Player API:
 *        PAUSED  → opaque overlay hides the "more videos" suggestion panel
 *        near end (last 20s) → frosted overlay appears before end-screen cards become interactive
 *        ENDED   → full "Watch Again" screen replaces the recommendations grid
 *
 * Why this works:
 *   The YouTube iframe renders its UI (end cards, logo, suggestions) as HTML on top
 *   of a plain <video> element — same as what you see in PiP mode (just the frames).
 *   We can't reach across the cross-origin boundary to touch those elements, but we
 *   CAN use the YT IFrame API to know *when* they appear and cover them ourselves.
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
// Safelist
// ---------------------------------------------------------------------------
const DEMO_SAFELIST = [
  { id: 'XqZsoesa55w', title: 'Baby Shark Dance', channel: 'Pinkfong' },
  { id: 'hBgl2-zdJXs', title: 'Five Little Ducks', channel: 'Super Simple Songs' },
  { id: 'yCjJyiqpAuU', title: 'Wheels on the Bus', channel: 'Cocomelon' },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
// End-screen cards appear in the last ~20s — we cover a bit before that
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
// SafeYouTubePlayer component
// ---------------------------------------------------------------------------
function SafeYouTubePlayer({
  videoId,
  title,
  showDebug,
}: {
  videoId: string;
  title: string;
  showDebug: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [overlay, setOverlay] = useState<OverlayKind>('none');
  // Only used for the debug HUD — updated in the poll only when showDebug is true
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // Dynamic bottom bar height: YouTube's controls bar is ~40px fixed + ~8px progress bar.
  // We measure the wrapper and use 13% with a 52px floor so it holds at small sizes.
  const [bottomBarPx, setBottomBarPx] = useState(52);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(
    (player: YTPlayer, debug: boolean) => {
      stopPoll();
      pollRef.current = setInterval(() => {
        const t = player.getCurrentTime();
        const d = player.getDuration();
        // Only update debug state when the HUD is visible — avoids 2 re-renders/sec in production
        if (debug) {
          setCurrentTime(t);
          setDuration(d);
        }
        if (d > 0 && d - t <= END_CARD_BUFFER_SECS) {
          setOverlay((prev) => (prev === 'ended' ? 'ended' : 'near-end'));
        }
      }, 500);
    },
    [stopPoll]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset state on video change
    setOverlay('none');
    setDuration(0);
    setCurrentTime(0);
    playerRef.current?.destroy();
    playerRef.current = null;

    loadYTApi(() => {
      if (!containerRef.current) return;
      // Don't assign playerRef until onReady — the constructor returns immediately
      // but playVideo/pauseVideo etc. are not callable until the player is ready.
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
                // If we were near-end/ended, keep those overlays
                if (prev === 'ended' || prev === 'near-end') return prev;
                return 'none';
              });
              // Use instance directly — playerRef.current may not be set yet if PLAYING
              // fires before onReady (race condition on first load)
              startPoll(instance, showDebug);
            } else if (e.data === S.PAUSED) {
              stopPoll();
              setOverlay((prev) => (prev === 'ended' || prev === 'near-end' ? prev : 'paused'));
            } else if (e.data === S.ENDED) {
              stopPoll();
              setOverlay('ended');
            } else if (e.data === S.BUFFERING) {
              // keep current overlay
            }
          },
        },
      });
    });

    return () => {
      stopPoll();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, startPoll, stopPoll, showDebug]);

  // Resize observer — YouTube's controls bar is a fixed-height element (~48px), not
  // percentage-based. We use 64px as a comfortable fixed cover, but scale up slightly
  // on very small players (< 300px tall) where 64px would eat too much video.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const update = () => {
      const h = wrapperRef.current!.getBoundingClientRect().height;
      // At small sizes keep it proportional; at normal sizes cap at 64px
      setBottomBarPx(h < 300 ? Math.round(h * 0.18) : 64);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const handleWatchAgain = () => {
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
    setOverlay('none');
    setCurrentTime(0);
  };

  const handleResumeFromNearEnd = () => {
    // User explicitly wants to keep watching — just hide our overlay and let it play
    setOverlay('none');
    playerRef.current?.playVideo();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl"
      style={{ paddingBottom: '56.25%' }}
    >
      {/* YouTube player mounts here — YT.Player replaces this div with an iframe */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* ── Static CSS overlays (always active) ── */}

      {/* Title bar — top strip */}
      <div
        className="absolute left-0 right-0 top-0 z-10"
        style={{
          height: '13%',
          background: showDebug ? 'rgba(239,68,68,0.4)' : 'transparent',
          border: showDebug ? '1px solid rgba(239,68,68,0.8)' : 'none',
          pointerEvents: 'all',
          cursor: 'default',
        }}
      >
        {showDebug && <span className="p-1 text-[10px] font-bold text-white">Title (blocked)</span>}
      </div>

      {/* Miniplayer / fullscreen button — right edge strip (appears on hover, no embed param removes it) */}
      <div
        className="absolute right-0 z-10"
        style={{
          top: '13%', // below title bar
          bottom: `${bottomBarPx}px`, // above bottom bar
          width: '6%',
          background: showDebug ? 'rgba(239,68,68,0.4)' : 'transparent',
          border: showDebug ? '1px solid rgba(239,68,68,0.8)' : 'none',
          pointerEvents: 'all',
          cursor: 'default',
        }}
      >
        {showDebug && (
          <span className="p-1 text-[10px] font-bold text-white">Miniplayer (blocked)</span>
        )}
      </div>

      {/* Full-width bottom bar — covers share, progress bar, more videos, YT logo.
          Height is driven by ResizeObserver so it holds at any player size. */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          height: `${bottomBarPx}px`,
          background: showDebug ? 'rgba(239,68,68,0.5)' : 'transparent',
          border: showDebug ? '1px solid rgba(239,68,68,0.9)' : 'none',
          pointerEvents: 'all',
          cursor: 'default',
        }}
      >
        {showDebug && (
          <span className="p-1 text-[10px] font-bold text-white">
            Bottom bar ({bottomBarPx}px — share + progress + more videos + logo)
          </span>
        )}
      </div>

      {/* ── State-driven overlays ── */}

      {/* PAUSED — blocks the "more videos" suggestion panel */}
      {overlay === 'paused' && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
          onClick={() => {
            playerRef.current?.playVideo();
            setOverlay('none');
          }}
        >
          <div className="flex select-none flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
              {/* Play icon */}
              <svg className="ml-1 h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-sm text-white/70">Tap to resume</p>
          </div>
          {showDebug && (
            <span className="absolute left-2 top-2 rounded bg-orange-600 px-1 text-[10px] text-white">
              PAUSED overlay — blocks &quot;more videos&quot; panel
            </span>
          )}
        </div>
      )}

      {/* NEAR END — covers end-screen cards before they become interactive */}
      {overlay === 'near-end' && (
        <div
          className="absolute inset-0 z-20 flex items-end justify-start p-4"
          style={{ pointerEvents: 'none' }}
        >
          {/* Only cover the end-card area (top 60% of frame) */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: '70%',
              background: showDebug ? 'rgba(234,179,8,0.3)' : 'transparent',
              pointerEvents: 'all',
              cursor: 'default',
            }}
          >
            {showDebug && (
              <span className="m-1 inline-block rounded bg-yellow-600 px-1 text-[10px] text-white">
                NEAR-END overlay — blocks end-screen cards
              </span>
            )}
          </div>
          <button
            className="relative z-10 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/20"
            style={{ pointerEvents: 'all' }}
            onClick={handleResumeFromNearEnd}
          >
            Keep watching
          </button>
        </div>
      )}

      {/* ENDED — replaces recommendations grid entirely */}
      {overlay === 'ended' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          <p className="text-lg font-semibold text-white">{title}</p>
          <p className="text-sm text-gray-400">Video finished</p>
          <button
            onClick={handleWatchAgain}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <svg
              className="h-4 w-4"
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
          {showDebug && (
            <span className="absolute left-2 top-2 rounded bg-red-600 px-1 text-[10px] text-white">
              ENDED overlay — replaces recommendations grid
            </span>
          )}
        </div>
      )}

      {/* Debug: time tracker */}
      {showDebug && duration > 0 && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-30 rounded bg-black/80 px-2 py-1 font-mono text-[10px] text-green-400">
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          {duration - currentTime <= END_CARD_BUFFER_SECS && (
            <span className="ml-2 text-yellow-400">⚠ end-card zone</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function YouTubeEmbedDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const selected = DEMO_SAFELIST[selectedIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">YouTube Embed Fallback — Demo</h1>
            <p className="text-sm text-gray-400">
              Safelist-gated embed · YT IFrame API state overlays · static logo/title blocks
            </p>
          </div>
          <span className="rounded-full border border-yellow-600/40 bg-yellow-600/20 px-3 py-1 text-xs font-medium text-yellow-400">
            Fallback Mode
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Video selector */}
        <div className="flex flex-wrap gap-2">
          {DEMO_SAFELIST.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setSelectedIndex(i)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                i === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>

        {/* Player */}
        <SafeYouTubePlayer
          key={selected.id}
          videoId={selected.id}
          title={selected.title}
          showDebug={showDebug}
        />

        {/* Metadata + debug toggle */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            <span className="font-medium text-white">{selected.title}</span>
            {' · '}
            {selected.channel}
            {' · '}
            <span className="font-mono text-gray-500">{selected.id}</span>
          </div>
          <button
            onClick={() => setShowDebug((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showDebug ? 'bg-red-800 text-red-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showDebug ? 'Hide debug zones' : 'Show debug zones'}
          </button>
        </div>

        {/* Coverage summary */}
        <div className="space-y-3 rounded-lg bg-gray-800 p-5">
          <button
            className="flex w-full items-center justify-between text-sm font-medium text-gray-300"
            onClick={() => setShowDetails((v) => !v)}
          >
            <span>What&apos;s blocked and how</span>
            <span className="text-gray-500">{showDetails ? '▲' : '▼'}</span>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-2 text-sm">
              {[
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: 'Info cards / annotations — iv_load_policy=3',
                },
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: 'Title bar click → YouTube — static CSS overlay (always on)',
                },
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: 'Share button, progress bar, "more videos", YT logo — single full-width bottom bar, ResizeObserver-sized',
                },
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: '"More videos" panel on pause — state overlay via YT IFrame API',
                },
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: 'End-screen recommendation cards — state overlay fires at T−22s',
                },
                {
                  icon: '✓',
                  color: 'text-green-400',
                  text: 'Post-video recommendations grid — ENDED overlay replaces it entirely',
                },
                {
                  icon: '~',
                  color: 'text-yellow-400',
                  text: "rel=0 still shows same-channel videos in the native player (can't be fully off)",
                },
                {
                  icon: '✗',
                  color: 'text-red-400',
                  text: 'Right-click → "Watch on YouTube" context menu — browser-level, unblockable',
                },
                {
                  icon: '✗',
                  color: 'text-red-400',
                  text: 'Fullscreen disabled (allowFullScreen omitted) — full YT UI would reappear',
                },
              ].map(({ icon, color, text }) => (
                <div key={text} className="flex gap-2">
                  <span className={`${color} shrink-0`}>{icon}</span>
                  <span className="text-gray-300">{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
