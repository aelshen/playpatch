'use client';

import { useEffect, useRef } from 'react';

interface PlexVideoPlayerProps {
  ratingKey: string;
}

export function PlexVideoPlayer({ ratingKey }: PlexVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `/api/plex/stream/${ratingKey}`;

    let cleanup: (() => void) | undefined;

    // Safari supports HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      // Chrome and others need HLS.js
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          video.src = src; // last resort
          return;
        }
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        cleanup = () => hls.destroy();
      });
    }

    return () => cleanup?.();
  }, [ratingKey]);

  return (
    <video
      ref={videoRef}
      controls
      className="h-full w-full"
      playsInline
    />
  );
}
