/**
 * Video Viewer Layout
 * YouTube-style layout with video player, description, and sidebar
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VideoViewerLayoutProps {
  /**
   * Video player component
   */
  videoPlayer: ReactNode;

  /**
   * Video info section (title, channel, description)
   */
  videoInfo: ReactNode;

  /**
   * Sidebar content (suggested videos / AI chat)
   */
  sidebar: ReactNode;

  /**
   * Action bar (like, playlist, request buttons)
   */
  actionBar?: ReactNode;

  /**
   * Back button navigation
   */
  backButton?: ReactNode;

  /**
   * Additional class names
   */
  className?: string;
}

export function VideoViewerLayout({
  videoPlayer,
  videoInfo,
  sidebar,
  actionBar,
  backButton,
  className,
}: VideoViewerLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-900', className)}>
      {/* Back button */}
      {backButton && (
        <div className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">{backButton}</div>
        </div>
      )}

      {/* Main content grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left column - Video and info */}
          <div className="space-y-4">
            {/* Video player */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              {videoPlayer}
            </div>

            {/* Action bar (like, playlist, request) */}
            {actionBar && <div className="flex items-center gap-2">{actionBar}</div>}

            {/* Video info section */}
            <div>{videoInfo}</div>
          </div>

          {/* Right column - Sidebar (suggestions/AI chat) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg bg-gray-800 p-4">{sidebar}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
