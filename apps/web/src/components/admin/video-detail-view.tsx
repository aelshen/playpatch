/**
 * Video Detail View Component
 * Shows video information and approval interface
 */

'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { formatDuration } from '@/lib/utils/shared';
import {
  approveVideoAction,
  rejectVideoAction,
  deleteVideoAction,
  retryVideoDownloadAction,
  type VideoActionState,
} from '@/lib/actions/videos';
import { useRouter } from 'next/navigation';
import {
  AGE_RATINGS,
  CATEGORIES,
  VIDEO_STATUS_COLORS,
  APPROVAL_STATUS_COLORS,
} from '@/lib/constants/video';
import { PlexVideoPlayer } from '@/components/admin/plex-video-player';

interface AISafetyAnalysis {
  safetyScore?: number;
  safeForChildren?: boolean;
  concerns?: string[];
  ageRecommendation?: string;
  topics?: string[];
  summary?: string;
  [key: string]: unknown;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  thumbnailPath: string | null;
  sourceUrl: string;
  sourceType: string;
  sourceId: string | null;
  status: string;
  approvalStatus: string;
  ageRating: string;
  categories: string[];
  topics: string[];
  aiAnalysis?: AISafetyAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
  channel: {
    id: string;
    name: string;
  } | null;
}

interface VideoDetailViewProps {
  video: Video;
}

// Constants now imported from centralized location

function ApproveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Approving...' : 'Approve Video'}
    </button>
  );
}

export function VideoDetailView({ video }: VideoDetailViewProps) {
  const router = useRouter();
  const [ageRating, setAgeRating] = useState(video.ageRating);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(video.categories);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const initialState: VideoActionState = { error: undefined, success: false };
  const [approveState, approveFormAction] = useFormState(approveVideoAction, initialState);

  // Calculate derived state
  const isPending = video.approvalStatus === 'PENDING';
  const hasVideoFile = !!(video as any).localPath;
  const canApprove = isPending; // Can approve at any time since we preview via YouTube

  // Poll for queue status if video is approved but not downloaded
  useEffect(() => {
    const shouldPoll =
      video.approvalStatus === 'APPROVED' && !hasVideoFile && video.status !== 'ERROR';

    if (shouldPoll) {
      setIsPolling(true);
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/queue/${video.id}/status`);
          const data = await response.json();
          setQueueStatus(data);

          // Stop polling if download is complete or failed
          if (data.dbStatus === 'READY' || data.dbStatus === 'ERROR') {
            setIsPolling(false);
            router.refresh();
          }
        } catch (error) {
          console.error('Failed to fetch queue status:', error);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    } else {
      setIsPolling(false);
    }
  }, [video.id, video.approvalStatus, video.status, hasVideoFile, router]);

  // Handle successful approval
  if (approveState.success) {
    router.push('/admin/content');
    router.refresh();
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const result = await rejectVideoAction(video.id, rejectReason);
    if (result.success) {
      router.push('/admin/content');
      router.refresh();
    } else {
      alert(result.error || 'Failed to reject video');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteVideoAction(video.id);
    if (result.success) {
      router.push('/admin/content');
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete video');
      setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    const result = await retryVideoDownloadAction(video.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to retry download');
      setIsRetrying(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Status Alert */}
      {!hasVideoFile && video.approvalStatus !== 'REJECTED' && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">
              {video.status === 'DOWNLOADING' && '⬇️'}
              {video.status === 'PROCESSING' && '⚙️'}
              {video.status === 'READY' && '👀'}
              {video.status === 'ERROR' && '❌'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                {video.status === 'READY' &&
                  video.approvalStatus === 'PENDING' &&
                  'Ready for review'}
                {video.status === 'READY' &&
                  video.approvalStatus === 'APPROVED' &&
                  'Waiting for download to start'}
                {video.status === 'DOWNLOADING' && 'Downloading video'}
                {video.status === 'PROCESSING' && 'Processing video'}
                {video.status === 'ERROR' && 'Download failed'}
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {video.status === 'READY' &&
                  video.approvalStatus === 'PENDING' &&
                  (video.sourceType === 'PLEX'
                    ? 'Preview the video below from your Plex server, then approve'
                    : 'Review the video using the YouTube preview below, then approve to start download')}
                {video.status === 'READY' &&
                  video.approvalStatus === 'APPROVED' &&
                  'Video is approved and will be downloaded shortly'}
                {video.status === 'DOWNLOADING' &&
                  'The video is currently being downloaded from YouTube'}
                {video.status === 'PROCESSING' &&
                  'The video is being transcoded and prepared for streaming'}
                {video.status === 'ERROR' &&
                  'There was an error downloading the video. Click "Retry Download" below to try again.'}
              </p>

              {/* Queue Status Info */}
              {queueStatus && isPolling && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-600">
                      {queueStatus.queue?.state === 'waiting' && '⏳ In queue...'}
                      {queueStatus.queue?.state === 'active' && '▶️ Processing...'}
                      {queueStatus.queue?.state === 'completed' && '✅ Complete!'}
                      {queueStatus.queue?.state === 'failed' && '❌ Failed'}
                      {!queueStatus.queue && '🔍 Checking status...'}
                    </span>
                    {queueStatus.queue && (
                      <span className="text-blue-500">Job #{queueStatus.queue.jobId}</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {queueStatus.queue?.progress > 0 && (
                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-blue-200">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${queueStatus.queue.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>{Math.round(queueStatus.queue.progress)}%</span>
                        {queueStatus.queue.state === 'active' && (
                          <span className="animate-pulse">Downloading...</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failed Reason */}
                  {queueStatus.queue?.failedReason && (
                    <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-700">
                      <strong>Error:</strong> {queueStatus.queue.failedReason}
                    </div>
                  )}

                  {/* Retry Info */}
                  {queueStatus.queue?.attempts > 0 && (
                    <div className="text-xs text-blue-600">
                      Attempt {queueStatus.queue.attempts} of 3
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Downloaded Successfully */}
      {hasVideoFile && video.approvalStatus === 'APPROVED' && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✅</div>
            <div>
              <h3 className="font-semibold text-green-900">Video ready for viewing</h3>
              <p className="mt-1 text-sm text-green-700">
                This video has been downloaded and is available for children to watch
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Alert */}
      {video.approvalStatus === 'REJECTED' && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">❌</div>
            <div>
              <h3 className="font-semibold text-red-900">Video is rejected</h3>
              <p className="mt-1 text-sm text-red-700">This video is not available for viewing</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Info Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        {/* Video Preview */}
        {video.sourceType === 'YOUTUBE' && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">Video Preview</h3>
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(video.sourceUrl)}`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Watch the video above to review content before approval
            </p>
          </div>
        )}

        {video.sourceType === 'PLEX' && video.sourceId && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">Video Preview</h3>
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
              <PlexVideoPlayer ratingKey={video.sourceId.replace('plex:', '')} />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Streaming directly from your Plex server
            </p>
          </div>
        )}

        {/* Thumbnail fallback for other non-YouTube sources */}
        {video.sourceType !== 'YOUTUBE' && video.sourceType !== 'PLEX' && video.thumbnailPath && (
          <div className="mb-6">
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-200">
              <img
                src={video.thumbnailPath}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Title and Metadata */}
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">{video.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {video.channel && (
              <span className="flex items-center">
                <span className="mr-1">📺</span>
                {video.channel.name}
              </span>
            )}
            <span className="flex items-center">
              <span className="mr-1">⏱️</span>
              {formatDuration(video.duration)}
            </span>
            <span className="flex items-center">
              <span className="mr-1">📅</span>
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              VIDEO_STATUS_COLORS[video.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            Status: {video.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              APPROVAL_STATUS_COLORS[video.approvalStatus] || 'bg-gray-100 text-gray-800'
            }`}
          >
            Approval: {video.approvalStatus}
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
            {video.ageRating.replace('_', ' ')}
          </span>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{video.description}</p>
          </div>
        )}

        {/* Current Categories */}
        {video.categories.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">Current Categories</h3>
            <div className="flex flex-wrap gap-2">
              {video.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                >
                  {category.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Topics */}
        {video.topics.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {video.topics.slice(0, 15).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Safety Analysis */}
        {video.aiAnalysis ? (
          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">AI Safety Analysis</h3>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {/* Safety score */}
              {typeof video.aiAnalysis.safetyScore === 'number' && (
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-gray-700">Safety Score</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        video.aiAnalysis.safetyScore >= 80
                          ? 'bg-green-500'
                          : video.aiAnalysis.safetyScore >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${video.aiAnalysis.safetyScore}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-gray-900">
                    {video.aiAnalysis.safetyScore}/100
                  </span>
                </div>
              )}

              {/* Safe for children badge */}
              {typeof video.aiAnalysis.safeForChildren === 'boolean' && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      video.aiAnalysis.safeForChildren
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {video.aiAnalysis.safeForChildren ? '✓ Safe for children' : '⚠ Review needed'}
                  </span>
                  {video.aiAnalysis.ageRecommendation && (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                      {video.aiAnalysis.ageRecommendation}
                    </span>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {video.aiAnalysis.summary && (
                <p className="text-sm text-gray-700">{video.aiAnalysis.summary}</p>
              )}

              {/* Concerns */}
              {Array.isArray(video.aiAnalysis.concerns) && video.aiAnalysis.concerns.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-red-700">Concerns flagged:</p>
                  <ul className="space-y-1">
                    {video.aiAnalysis.concerns.map((concern, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                        <span className="flex-shrink-0">•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-gray-900">AI Safety Analysis</h3>
            <p className="text-sm italic text-gray-500">
              No AI analysis available for this video yet.
            </p>
          </div>
        )}

        {/* Source URL */}
        <div className="mb-6">
          <h3 className="mb-2 font-semibold text-gray-900">Source</h3>
          {video.sourceType === 'PLEX' ? (
            <span className="text-sm text-gray-500">Plex Media Server</span>
          ) : (
            <a
              href={video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm text-blue-600 hover:underline"
            >
              {video.sourceUrl}
            </a>
          )}
        </div>
      </div>

      {/* Approval Form (only for pending videos that are ready) */}
      {canApprove && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Review and Approve</h2>

          <form action={approveFormAction} className="space-y-6">
            <input type="hidden" name="videoId" value={video.id} />

            {/* Error Message */}
            {approveState.error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {approveState.error}
              </div>
            )}

            {/* Age Rating */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-900">Age Rating *</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {AGE_RATINGS.map((rating) => (
                  <label
                    key={rating.value}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                      ageRating === rating.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="ageRating"
                      value={rating.value}
                      checked={ageRating === rating.value}
                      onChange={(e) => setAgeRating(e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{rating.label}</div>
                    <div className="text-xs text-gray-600">{rating.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-900">
                Categories * (select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={category}
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="sr-only"
                    />
                    {category.replace('_', ' ')}
                  </label>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="mt-2 text-xs text-red-600">Please select at least one category</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(true)}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Reject Video
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>

              <ApproveButton disabled={selectedCategories.length === 0} />
            </div>
          </form>
        </div>
      )}

      {/* Actions for non-pending videos */}
      {!canApprove && (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Actions</h3>
              <p className="text-sm text-gray-600">
                {video.status === 'ERROR'
                  ? 'Download failed - you can retry or delete this video'
                  : 'This video has already been reviewed'}
              </p>
            </div>
            <div className="flex gap-3">
              {video.status === 'ERROR' && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRetrying ? 'Retrying...' : 'Retry Download'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Reject Video</h3>
            <p className="mb-4 text-sm text-gray-600">
              Please provide a reason for rejecting this video:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Inappropriate content, wrong age group..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Delete Video</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}
