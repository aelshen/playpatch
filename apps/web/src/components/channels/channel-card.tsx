'use client';

/**
 * Channel Card Component
 * Displays a channel with actions (sync, delete, edit)
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Youtube, Calendar, CheckCircle, Clock, Filter, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    syncMode: string;
    syncFrequency: string;
    autoCategories: string[];
    lastSyncAt: Date | null;
    _count: {
      videos: number;
    };
  };
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getSyncModeLabel = (mode: string) => {
    switch (mode) {
      case 'AUTO_APPROVE':
        return { label: 'Auto-Approve', icon: CheckCircle, color: 'text-green-600 bg-green-50' };
      case 'REVIEW':
        return { label: 'Review', icon: Clock, color: 'text-yellow-600 bg-yellow-50' };
      case 'SELECTIVE':
        return { label: 'Selective', icon: Filter, color: 'text-blue-600 bg-blue-50' };
      default:
        return { label: mode, icon: Clock, color: 'text-gray-600 bg-gray-50' };
    }
  };

  const getSyncFrequencyLabel = (freq: string) => {
    return freq.charAt(0) + freq.slice(1).toLowerCase();
  };

  const syncMode = getSyncModeLabel(channel.syncMode);
  const SyncIcon = syncMode.icon;

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/sync/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Refresh the page to show new videos
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/channels/${channel.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      // Refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Channel Thumbnail */}
        {channel.thumbnailUrl ? (
          <img
            src={channel.thumbnailUrl}
            alt={channel.name}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <Youtube className="w-10 h-10 text-gray-400" />
          </div>
        )}

        {/* Channel Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate">{channel.name}</h3>
              {channel.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {channel.description}
                </p>
              )}
            </div>

            {/* Sync Mode Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${syncMode.color} flex-shrink-0`}>
              <SyncIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{syncMode.label}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Youtube className="w-4 h-4" />
              {channel._count.videos} videos
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Sync: {getSyncFrequencyLabel(channel.syncFrequency)}
            </span>
            {channel.lastSyncAt && (
              <span className="text-xs text-gray-500">
                Last synced: {new Date(channel.lastSyncAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Auto Categories */}
          {channel.autoCategories && channel.autoCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {channel.autoCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-gray-900 font-medium mb-3">
            Delete this channel? This will also remove all {channel._count.videos} videos from your library.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
        <Link
          href={`/admin/content?channel=${channel.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View Videos
        </Link>
        <span className="text-gray-300">•</span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <span className="text-gray-300">•</span>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting || showDeleteConfirm}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
