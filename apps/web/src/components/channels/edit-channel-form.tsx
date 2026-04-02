'use client';

/**
 * Edit Channel Form
 * Edit channel settings after creation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react';
import { SyncMode, SyncFrequency, AgeRating } from '@prisma/client';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  syncMode: SyncMode;
  syncFrequency: SyncFrequency;
  autoAgeRating: AgeRating | null;
  autoCategories: string[];
}

interface EditChannelFormProps {
  channel: Channel;
}

export function EditChannelForm({ channel }: EditChannelFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Configuration state - initialize with current channel settings
  const [syncMode, setSyncMode] = useState<SyncMode>(channel.syncMode);
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>(channel.syncFrequency);
  const [autoAgeRating, setAutoAgeRating] = useState<AgeRating | null>(channel.autoAgeRating);
  const [autoCategories, setAutoCategories] = useState<string[]>(channel.autoCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`/api/channels/${channel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncMode,
          syncFrequency,
          autoAgeRating,
          autoCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update channel');
      }

      setSuccess(true);

      // Redirect back to channels list after 1.5 seconds
      setTimeout(() => {
        router.push('/admin/channels');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg bg-white p-8 shadow">
        {/* Channel Info Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            {channel.thumbnailUrl && (
              <img
                src={channel.thumbnailUrl}
                alt={channel.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{channel.name}</h2>
              {channel.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{channel.description}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sync Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input
                  type="radio"
                  value="REVIEW"
                  checked={syncMode === 'REVIEW'}
                  onChange={(e) => setSyncMode(e.target.value as SyncMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Review (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    You'll review and approve each video before children can watch
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300">
                <input
                  type="radio"
                  value="AUTO_APPROVE"
                  checked={syncMode === 'AUTO_APPROVE'}
                  onChange={(e) => setSyncMode(e.target.value as SyncMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Auto-Approve</div>
                  <div className="text-sm text-gray-600">
                    All videos from this channel are automatically approved
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sync Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check for New Videos
            </label>
            <select
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(e.target.value as SyncFrequency)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option value="MANUAL">Manual only</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="HOURLY">Hourly</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              How often to check this channel for new videos
            </p>
          </div>

          {/* Auto Age Rating (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Assign Age Rating (Optional)
            </label>
            <select
              value={autoAgeRating || ''}
              onChange={(e) => setAutoAgeRating(e.target.value ? (e.target.value as AgeRating) : null)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option value="">Suggest based on content</option>
              <option value="AGE_2_PLUS">Ages 2+</option>
              <option value="AGE_4_PLUS">Ages 4+</option>
              <option value="AGE_7_PLUS">Ages 7+</option>
              <option value="AGE_10_PLUS">Ages 10+</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Automatically apply this age rating to all videos from this channel
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
                <p className="text-sm text-green-700 mt-1">Redirecting back to channels...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/channels')}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
