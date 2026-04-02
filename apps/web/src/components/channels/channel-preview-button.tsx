'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Plus } from 'lucide-react';

interface ChannelPreviewButtonProps {
  channelUrl: string;
  channelName: string;
  addUrl: string;
}

interface PreviewVideo {
  id: string;
  title: string;
  duration: number;
  thumbnailUrl: string;
  viewCount: number;
  url: string;
}

interface PreviewData {
  channel: {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    subscriberCount?: number;
    videoCount?: number;
    url: string;
  };
  recentVideos: PreviewVideo[];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function ChannelPreviewButton({ channelUrl, channelName, addUrl }: ChannelPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewData | null>(null);

  async function handleOpen() {
    setIsOpen(true);
    setError(null);

    if (data) return; // Already fetched

    setIsLoading(true);
    try {
      const res = await fetch(`/api/channels/preview?url=${encodeURIComponent(channelUrl)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json: PreviewData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        Preview
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-preview-title"
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h2 id="channel-preview-title" className="text-lg font-bold text-gray-900 pr-8">{channelName}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {isLoading && (
              <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                Loading preview…
              </div>
            )}

            {error && !isLoading && (
              <div className="py-8 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {data && !isLoading && (
              <>
                {/* Video grid */}
                {data.recentVideos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.recentVideos.slice(0, 10).map((video) => (
                      <div key={video.id} className="flex flex-col gap-1">
                        <div className="aspect-video rounded overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                          {video.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4">No recent videos found.</p>
                )}

                {/* Add Channel CTA */}
                <div className="mt-6 flex justify-end">
                  <Link
                    href={addUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Channel
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
