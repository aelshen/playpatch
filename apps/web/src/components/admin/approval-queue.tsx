/**
 * Video Approval Queue Component
 * SSK-041: Video Approval Queue
 */

'use client';

import { useState } from 'react';
import { formatDuration } from '@/lib/utils/shared';
import { ApprovalCard } from './approval-card';

interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  thumbnailPath: string | null;
  sourceUrl: string;
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

export function ApprovalQueue({ videos }: ApprovalQueueProps) {
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(
    videos[0]?.id || null
  );

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <ApprovalCard
          key={video.id}
          video={video}
          isExpanded={expandedVideoId === video.id}
          onToggle={() =>
            setExpandedVideoId(expandedVideoId === video.id ? null : video.id)
          }
        />
      ))}
    </div>
  );
}
