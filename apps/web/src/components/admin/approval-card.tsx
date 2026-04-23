/**
 * Video Approval Card Component
 * SSK-041: Video Approval Queue
 */

'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { formatDuration } from '@/lib/utils/shared';
import { PlexVideoPlayer } from './plex-video-player';
import {
  approveVideoAction,
  rejectVideoAction,
  type VideoActionState,
} from '@/lib/actions/videos';
import { useRouter } from 'next/navigation';

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
  ageRating: string;
  categories: string[];
  topics: string[];
  channel: {
    id: string;
    name: string;
  } | null;
}

interface ApprovalCardProps {
  video: Video;
  isExpanded: boolean;
  onToggle: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const AGE_RATINGS = [
  { value: 'AGE_2_PLUS', label: 'Ages 2+', description: 'Toddlers and preschoolers' },
  { value: 'AGE_4_PLUS', label: 'Ages 4+', description: 'Preschool and early elementary' },
  { value: 'AGE_7_PLUS', label: 'Ages 7+', description: 'Elementary school' },
  { value: 'AGE_10_PLUS', label: 'Ages 10+', description: 'Pre-teen and older' },
];

const CATEGORIES = [
  'EDUCATIONAL',
  'ENTERTAINMENT',
  'MUSIC',
  'ANIMATION',
  'STORIES',
  'ARTS_CRAFTS',
  'NATURE',
  'SCIENCE',
  'MATH',
  'LANGUAGE',
];

function ApproveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Approving...' : 'Approve'}
    </button>
  );
}

export function ApprovalCard({ video, isExpanded, onToggle, isSelected, onSelect }: ApprovalCardProps) {
  const router = useRouter();
  const [ageRating, setAgeRating] = useState(video.ageRating);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(video.categories);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const initialState: VideoActionState = { error: undefined, success: false };
  const [approveState, approveFormAction] = useFormState(approveVideoAction, initialState);

  // Handle successful approval
  if (approveState.success) {
    router.refresh();
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const result = await rejectVideoAction(video.id, rejectReason);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to reject video');
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
    <div className="overflow-hidden rounded-lg bg-white shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected ?? false}
            onChange={(e) => onSelect(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="mr-3 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-blue-600"
          />
        )}
        <div
          className="flex flex-1 cursor-pointer items-center space-x-4"
          onClick={onToggle}
        >
          {/* Thumbnail */}
          <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded bg-gray-200">
            {video.thumbnailPath ? (
              <img
                src={video.thumbnailPath}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl">
                🎬
              </div>
            )}
            <div className="absolute bottom-1 right-1 rounded bg-black bg-opacity-75 px-1 text-xs text-white">
              {formatDuration(video.duration)}
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900">{video.title}</h3>
            {video.channel && (
              <p className="text-sm text-gray-600">{video.channel.name}</p>
            )}
            <div className="mt-1 flex items-center space-x-2">
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Pending Review
              </span>
              {video.status !== 'READY' && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {video.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Icon */}
        <div className="text-2xl">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6">
          {/* Video Preview */}
          {video.status === 'READY' && (
            <div className="mb-6">
              <h4 className="mb-2 font-medium text-gray-900">Video Preview</h4>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                {video.sourceType === 'PLEX' && video.sourceId ? (
                  <PlexVideoPlayer ratingKey={video.sourceId.replace('plex:', '')} />
                ) : video.sourceUrl ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(video.sourceUrl)}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : null}
              </div>
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div className="mb-6">
              <h4 className="mb-2 font-medium text-gray-900">Description</h4>
              <p className="text-sm text-gray-700 line-clamp-3">{video.description}</p>
            </div>
          )}

          {/* Approval Form */}
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Age Rating *
              </label>
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
              <label className="block text-sm font-medium text-gray-900 mb-2">
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
            </div>

            {/* Topics (Optional) */}
            {video.topics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Topics (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {video.topics.slice(0, 10).map((topic) => (
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowRejectDialog(true)}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Reject Video
              </button>

              <ApproveButton disabled={selectedCategories.length === 0} />
            </div>
          </form>

          {/* Reject Dialog */}
          {showRejectDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="max-w-md rounded-lg bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Reject Video
                </h3>
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
