/**
 * Related Channels Panel
 * Suggests curated channels that share categories with the current channel.
 * Rendered on the channel edit page to help parents discover similar content.
 */

import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  CURATED_CHANNELS,
  filterCuratedChannels,
  type ChannelCategory,
  type AgeRange,
} from '@/lib/constants/curated-channels';

interface RelatedChannelsPanelProps {
  channelName: string;
  channelCategories: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  SCIENCE: '🔬',
  EDUCATIONAL: '📖',
  MUSIC: '🎵',
  ARTS_CRAFTS: '🎨',
  NATURE: '🦁',
  STORIES: '📚',
  ANIMATION: '🎬',
};

const AGE_BADGE_COLOR: Record<AgeRange, string> = {
  '2+': 'bg-green-100 text-green-700',
  '4+': 'bg-blue-100 text-blue-700',
  '7+': 'bg-purple-100 text-purple-700',
  '10+': 'bg-orange-100 text-orange-700',
};

const VALID_CATEGORIES = new Set<string>([
  'SCIENCE',
  'EDUCATIONAL',
  'MUSIC',
  'ARTS_CRAFTS',
  'NATURE',
  'STORIES',
  'ANIMATION',
]);

export function RelatedChannelsPanel({
  channelName,
  channelCategories,
}: RelatedChannelsPanelProps) {
  // Map string categories from Prisma to valid ChannelCategory values
  const validCategories = channelCategories.filter((cat) =>
    VALID_CATEGORIES.has(cat)
  ) as ChannelCategory[];

  if (validCategories.length === 0) {
    return null;
  }

  // Collect matching curated channels across all categories, deduplicated by URL
  const seen = new Set<string>();
  const suggestions = [];

  for (const category of validCategories) {
    const matches = filterCuratedChannels({ category });
    for (const ch of matches) {
      if (
        seen.has(ch.youtubeUrl) ||
        ch.name.toLowerCase() === channelName.toLowerCase()
      ) {
        continue;
      }
      seen.add(ch.youtubeUrl);
      suggestions.push(ch);
    }
  }

  const results = suggestions.slice(0, 4);

  if (results.length < 2) {
    return null;
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Similar Channels You Might Like
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Based on this channel&apos;s content categories
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {results.map((channel) => {
          const primaryCategory = channel.categories[0];
          const emoji = CATEGORY_EMOJI[primaryCategory] ?? '📺';
          const addUrl = `/admin/channels/add?url=${encodeURIComponent(channel.youtubeUrl)}&name=${encodeURIComponent(channel.name)}`;

          return (
            <div
              key={channel.youtubeUrl}
              className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              {/* Category icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-2xl shadow-sm select-none">
                {emoji}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">
                  {channel.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {channel.description}
                </p>

                {/* Age badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {channel.ageRanges.map((age) => (
                    <span
                      key={age}
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${AGE_BADGE_COLOR[age]}`}
                    >
                      {age}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add link */}
              <div className="flex-shrink-0">
                <Link
                  href={addUrl}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
