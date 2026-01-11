/**
 * Add to Playlist Modal
 * Modal for adding a video to playlists
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  videoCount: number;
  videos: Array<{ id: string }>;
}

interface AddToPlaylistModalProps {
  videoId: string;
  childProfileId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({
  videoId,
  childProfileId,
  isOpen,
  onClose,
}: AddToPlaylistModalProps) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch playlists when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen, childProfileId]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/playlists?childProfileId=${childProfileId}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      } else {
        console.error('Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childProfileId,
          name: newPlaylistName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add video to new playlist immediately
        await handleAddToPlaylist(data.playlist.id);
        setNewPlaylistName('');
        setShowCreateForm(false);
        fetchPlaylists();
      } else {
        console.error('Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        // Refresh playlists to update counts
        await fetchPlaylists();
        router.refresh();
      } else {
        console.error('Failed to add video to playlist');
      }
    } catch (error) {
      console.error('Error adding video to playlist:', error);
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        // Refresh playlists to update counts
        await fetchPlaylists();
        router.refresh();
      } else {
        console.error('Failed to remove video from playlist');
      }
    } catch (error) {
      console.error('Error removing video from playlist:', error);
    }
  };

  const isVideoInPlaylist = (playlist: Playlist) => {
    return playlist.videos.some((v) => v.id === videoId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Save to Playlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Playlists list */}
        <div className="max-h-96 space-y-2 overflow-y-auto mb-4">
          {isLoading ? (
            <div className="py-8 text-center text-gray-400">Loading playlists...</div>
          ) : playlists.length === 0 && !showCreateForm ? (
            <div className="py-8 text-center text-gray-400">
              No playlists yet. Create one to get started!
            </div>
          ) : (
            playlists.map((playlist) => {
              const inPlaylist = isVideoInPlaylist(playlist);
              return (
                <button
                  key={playlist.id}
                  onClick={() => {
                    if (inPlaylist) {
                      handleRemoveFromPlaylist(playlist.id);
                    } else {
                      handleAddToPlaylist(playlist.id);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-lg p-3 text-left transition-colors',
                    inPlaylist
                      ? 'bg-blue-500/20 hover:bg-blue-500/30'
                      : 'bg-gray-700 hover:bg-gray-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-5 w-5 rounded border-2 flex items-center justify-center',
                        inPlaylist ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
                      )}
                    >
                      {inPlaylist && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{playlist.name}</div>
                      <div className="text-xs text-gray-400">{playlist.videoCount} videos</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create new playlist */}
        {showCreateForm ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreatePlaylist();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlaylist}
                disabled={isCreating || !newPlaylistName.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create & Add'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                }}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Playlist
          </button>
        )}
      </div>
    </div>
  );
}
