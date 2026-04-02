/**
 * Curated Channel Card Component
 * Displays a single curated channel with age badges, category info, and an Add link.
 */

import Link from 'next/link';
import { Plus, CheckCircle } from 'lucide-react';
import type { AgeRange, ChannelCategory, CuratedChannel } from '@/lib/constants/curated-channels';
import { ChannelPreviewButton } from './channel-preview-button';

interface CuratedChannelCardProps {
  channel: CuratedChannel;
  isAdded?: boolean;
}

const CATEGORY_EMOJI: Record<ChannelCategory, string> = {
  SCIENCE: '🔬',
  EDUCATIONAL: '📖',
  MUSIC: '🎵',
  ARTS_CRAFTS: '🎨',
  NATURE: '🦁',
  STORIES: '📚',
  ANIMATION: '🎬',
};

const CATEGORY_LABEL: Record<ChannelCategory, string> = {
  SCIENCE: 'Science',
  EDUCATIONAL: 'Educational',
  MUSIC: 'Music',
  ARTS_CRAFTS: 'Arts & Crafts',
  NATURE: 'Nature',
  STORIES: 'Stories',
  ANIMATION: 'Animation',
};

const AGE_BADGE_COLOR: Record<AgeRange, string> = {
  '2+': 'bg-green-100 text-green-700',
  '4+': 'bg-blue-100 text-blue-700',
  '7+': 'bg-purple-100 text-purple-700',
  '10+': 'bg-orange-100 text-orange-700',
};

export function CuratedChannelCard({ channel, isAdded = false }: CuratedChannelCardProps) {
  const primaryCategory = channel.categories[0];
  const emoji = CATEGORY_EMOJI[primaryCategory] ?? '📺';

  const addUrl = `/admin/channels/add?url=${encodeURIComponent(channel.youtubeUrl)}&name=${encodeURIComponent(channel.name)}`;

  return (
    <div className="rounded-lg bg-white p-5 shadow hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Top row: icon + content */}
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl select-none">
          {emoji}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 leading-snug">{channel.name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{channel.description}</p>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {channel.ageRanges.map((age) => (
              <span
                key={age}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${AGE_BADGE_COLOR[age]}`}
              >
                {age}
              </span>
            ))}
            {channel.ageRanges.length > 0 && channel.categories.length > 0 && (
              <span className="text-gray-300 text-xs">•</span>
            )}
            {channel.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                {CATEGORY_LABEL[cat]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action row — full width below content */}
      <div className="flex items-center justify-end gap-2">
        {isAdded ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 cursor-default select-none">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Added
          </span>
        ) : (
          <>
            <ChannelPreviewButton
              channelUrl={channel.youtubeUrl}
              channelName={channel.name}
              addUrl={addUrl}
            />
            <Link
              href={addUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Channel
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
