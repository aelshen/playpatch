'use client';

/**
 * Add Channel Form
 * Multi-step form to add a YouTube channel with preview and configuration
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, ChevronRight, Loader2, Youtube } from 'lucide-react';

interface ChannelPreview {
  channel: {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    subscriberCount?: number;
    videoCount?: number;
  };
  recentVideos: Array<{
    id: string;
    title: string;
    duration: number;
    thumbnailUrl: string;
    viewCount: number;
  }>;
}

type Step = 'url' | 'preview' | 'configure' | 'success';

export function AddChannelForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('url');
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ChannelPreview | null>(null);

  // Configuration state
  const [syncMode, setSyncMode] = useState<'REVIEW' | 'AUTO_APPROVE' | 'SELECTIVE'>('REVIEW');
  const [syncFrequency, setSyncFrequency] = useState<'MANUAL' | 'DAILY' | 'WEEKLY' | 'HOURLY'>('DAILY');
  const [initialVideoLimit, setInitialVideoLimit] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxDuration, setMaxDuration] = useState<number | undefined>(undefined);
  const [daysBack, setDaysBack] = useState<number | undefined>(undefined);

  // Step 1: Fetch channel preview
  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/channels/preview?url=${encodeURIComponent(channelUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channel');
      }

      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channel');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create channel and queue videos
  const handleImport = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: channelUrl,
          syncMode,
          syncFrequency,
          initialVideoLimit,
          filters: {
            maxDuration: maxDuration ? maxDuration * 60 : undefined,
            daysBack,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import channel');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import channel');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step 1: Enter URL */}
      {step === 'url' && (
        <div className="rounded-lg bg-white p-8 shadow">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Youtube className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Add YouTube Channel</h2>
            </div>
            <p className="text-gray-600">
              Enter a YouTube channel URL to import videos from that channel
            </p>
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Channel URL
              </label>
              <input
                type="url"
                id="url"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://www.youtube.com/@channelname"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Supported formats: youtube.com/@username, youtube.com/channel/ID, youtube.com/c/Name
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !channelUrl}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading Channel...
                </>
              ) : (
                <>
                  Preview Channel
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Preview & Configure */}
      {(step === 'preview' || step === 'configure') && preview && (
        <div className="space-y-6">
          {/* Channel Preview */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Preview</h3>

            <div className="flex items-start gap-4 mb-6">
              {preview.channel.thumbnailUrl && (
                <img
                  src={preview.channel.thumbnailUrl}
                  alt={preview.channel.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">{preview.channel.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {preview.channel.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  {preview.channel.subscriberCount && (
                    <span>{formatNumber(preview.channel.subscriberCount)} subscribers</span>
                  )}
                  {preview.channel.videoCount && (
                    <span>{formatNumber(preview.channel.videoCount)} videos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Videos Preview */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Recent Videos</h5>
              <div className="space-y-2">
                {preview.recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDuration(video.duration)} • {formatNumber(video.viewCount)} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Settings</h3>

            <div className="space-y-6">
              {/* Initial Video Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of videos to import
                </label>
                <select
                  value={initialVideoLimit}
                  onChange={(e) => setInitialVideoLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                >
                  <option value={5}>5 videos</option>
                  <option value={10}>10 videos (recommended)</option>
                  <option value={20}>20 videos</option>
                  <option value={50}>50 videos</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  We'll import the most recent videos from this channel
                </p>
              </div>

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
                      onChange={(e) => setSyncMode(e.target.value as any)}
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
                      onChange={(e) => setSyncMode(e.target.value as any)}
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
                  onChange={(e) => setSyncFrequency(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                >
                  <option value="MANUAL">Manual only</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>

              {/* Advanced Filters */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showAdvanced ? '− Hide' : '+ Show'} Advanced Filters
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Video Length (minutes)
                      </label>
                      <input
                        type="number"
                        value={maxDuration || ''}
                        onChange={(e) => setMaxDuration(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="No limit"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Only Videos from Last (days)
                      </label>
                      <input
                        type="number"
                        value={daysBack || ''}
                        onChange={(e) => setDaysBack(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="All videos"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
                        min="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('url');
                  setPreview(null);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import Channel
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && preview && (
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Channel Added Successfully!</h3>
          <p className="text-gray-600 mb-6">
            {preview.channel.name} has been added and {initialVideoLimit} videos have been queued for import.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/admin/content')}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              View Content Queue
            </button>
            <button
              onClick={() => {
                setStep('url');
                setChannelUrl('');
                setPreview(null);
                setError(null);
              }}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
            >
              Add Another Channel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
