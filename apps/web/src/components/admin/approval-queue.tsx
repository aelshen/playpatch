/**
 * Video Approval Queue Component
 * SSK-041: Video Approval Queue
 */

'use client';

import { useState, useTransition } from 'react';
import { ApprovalCard } from './approval-card';
import { bulkApproveVideosAction } from '@/lib/actions/videos';
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
  approvalStatus: string;
  ageRating: string;
  categories: string[];
  topics: string[];
  createdAt: Date;
  channel: {
    id: string;
    name: string;
  } | null;
}

interface ApprovalQueueProps {
  videos: Video[];
}

const AGE_RATINGS = [
  { value: 'AGE_2_PLUS', label: 'Ages 2+' },
  { value: 'AGE_4_PLUS', label: 'Ages 4+' },
  { value: 'AGE_7_PLUS', label: 'Ages 7+' },
  { value: 'AGE_10_PLUS', label: 'Ages 10+' },
];

const CATEGORIES = [
  'EDUCATIONAL', 'ENTERTAINMENT', 'MUSIC', 'ANIMATION', 'STORIES',
  'ARTS_CRAFTS', 'NATURE', 'SCIENCE', 'MATH', 'LANGUAGE',
];

export function ApprovalQueue({ videos }: ApprovalQueueProps) {
  const router = useRouter();
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(videos[0]?.id || null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAgeRating, setBulkAgeRating] = useState('AGE_7_PLUS');
  const [bulkCategories, setBulkCategories] = useState<string[]>(['ENTERTAINMENT']);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Group videos by channel name (or "Uncategorized")
  const groups = videos.reduce<Record<string, Video[]>>((acc, v) => {
    const key = v.channel?.name ?? 'Uncategorized';
    (acc[key] ??= []).push(v);
    return acc;
  }, {});

  const toggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selected ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleGroupSelect = (groupVideos: Video[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      groupVideos.forEach((v) => (selected ? next.add(v.id) : next.delete(v.id)));
      return next;
    });
  };

  const toggleBulkCategory = (cat: string) => {
    setBulkCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleBulkApprove = () => {
    setBulkError(null);
    if (bulkCategories.length === 0) {
      setBulkError('Select at least one category');
      return;
    }
    startTransition(async () => {
      const result = await bulkApproveVideosAction(
        Array.from(selectedIds),
        bulkAgeRating,
        bulkCategories
      );
      if (result.error) {
        setBulkError(result.error);
      } else {
        setSelectedIds(new Set());
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, groupVideos]) => {
        const groupIds = groupVideos.map((v) => v.id);
        const selectedInGroup = groupIds.filter((id) => selectedIds.has(id));
        const allSelected = selectedInGroup.length === groupIds.length;
        const someSelected = selectedInGroup.length > 0 && !allSelected;

        return (
          <div key={groupName}>
            {/* Group header — only show if multiple channels */}
            {Object.keys(groups).length > 1 && (
              <div className="mb-2 flex items-center gap-3 px-1">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => toggleGroupSelect(groupVideos, e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-700">{groupName}</span>
                <span className="text-xs text-gray-500">({groupVideos.length} episodes)</span>
              </div>
            )}

            {/* Channel-level "select all" when only one channel */}
            {Object.keys(groups).length === 1 && groupVideos.length > 1 && (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => toggleGroupSelect(groupVideos, e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Select all {groupVideos.length} episodes
                </span>
                {selectedInGroup.length > 0 && (
                  <span className="text-sm text-blue-600">
                    ({selectedInGroup.length} selected)
                  </span>
                )}
              </div>
            )}

            <div className="space-y-4">
              {groupVideos.map((video) => (
                <ApprovalCard
                  key={video.id}
                  video={video}
                  isExpanded={expandedVideoId === video.id}
                  onToggle={() =>
                    setExpandedVideoId(expandedVideoId === video.id ? null : video.id)
                  }
                  isSelected={selectedIds.has(video.id)}
                  onSelect={(selected) => toggleSelect(video.id, selected)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-20 rounded-xl border border-blue-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {selectedIds.size} video{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          {/* Age rating */}
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-gray-600">Age Rating</p>
            <div className="flex gap-2">
              {AGE_RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setBulkAgeRating(r.value)}
                  className={`rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
                    bulkAgeRating === r.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-gray-600">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleBulkCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    bulkCategories.includes(cat)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {bulkError && (
            <p className="mb-2 text-sm text-red-600">{bulkError}</p>
          )}

          <button
            onClick={handleBulkApprove}
            disabled={isPending}
            className="w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending
              ? 'Approving...'
              : `Approve ${selectedIds.size} video${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
