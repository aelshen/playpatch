/**
 * Discover Channels Page
 * Browse curated, high-quality YouTube channels for children.
 * Parents can add channels directly to their PlayPatch library.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Compass } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import {
  CURATED_CHANNELS,
  filterCuratedChannels,
  type AgeRange,
  type ChannelCategory,
} from '@/lib/constants/curated-channels';
import { CuratedChannelCard } from '@/components/channels/curated-channel-card';

const CATEGORY_TABS: { label: string; value: ChannelCategory | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Educational', value: 'EDUCATIONAL' },
  { label: 'Music', value: 'MUSIC' },
  { label: 'Animation', value: 'ANIMATION' },
  { label: 'Nature', value: 'NATURE' },
  { label: 'Arts & Crafts', value: 'ARTS_CRAFTS' },
  { label: 'Science', value: 'SCIENCE' },
  { label: 'Stories', value: 'STORIES' },
];

const AGE_TABS: { label: string; value: AgeRange | 'ALL' }[] = [
  { label: 'All Ages', value: 'ALL' },
  { label: '2+', value: '2+' },
  { label: '4+', value: '4+' },
  { label: '7+', value: '7+' },
  { label: '10+', value: '10+' },
];

interface DiscoverPageProps {
  searchParams: {
    category?: string;
    ageRange?: string;
  };
}

export default async function DiscoverChannelsPage({ searchParams }: DiscoverPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = searchParams;

  // Validate filter values from URL
  const validCategories = CATEGORY_TABS.map((t) => t.value);
  const validAgeRanges = AGE_TABS.map((t) => t.value);

  const activeCategory =
    params.category && validCategories.includes(params.category as ChannelCategory | 'ALL')
      ? (params.category as ChannelCategory | 'ALL')
      : 'ALL';

  const activeAgeRange =
    params.ageRange && validAgeRanges.includes(params.ageRange as AgeRange | 'ALL')
      ? (params.ageRange as AgeRange | 'ALL')
      : 'ALL';

  // Fetch family's existing YouTube channels
  const existingChannels = await prisma.channel.findMany({
    where: {
      familyId: user.familyId,
      sourceType: 'YOUTUBE',
    },
    select: { name: true },
  });

  const existingNames = new Set(
    existingChannels.map((c) => c.name.trim().toLowerCase())
  );

  // Filter curated channels server-side
  const filteredChannels = filterCuratedChannels({
    category: activeCategory !== 'ALL' ? activeCategory : undefined,
    ageRange: activeAgeRange !== 'ALL' ? activeAgeRange : undefined,
  });

  const featuredChannels = CURATED_CHANNELS.filter((c) => c.featured);

  const isShowingAll = activeCategory === 'ALL' && activeAgeRange === 'ALL';

  // Build a URL for a filter tab, preserving other active params
  function buildFilterUrl(overrides: { category?: string; ageRange?: string }) {
    const next: Record<string, string> = {};
    if (activeCategory !== 'ALL') next.category = activeCategory;
    if (activeAgeRange !== 'ALL') next.ageRange = activeAgeRange;
    Object.assign(next, overrides);
    // Remove 'ALL' values from URL
    if (next.category === 'ALL') delete next.category;
    if (next.ageRange === 'ALL') delete next.ageRange;
    const qs = new URLSearchParams(next).toString();
    return `/admin/channels/discover${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/channels"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Channels
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Discover Channels</h1>
        </div>
        <p className="text-gray-600">
          Trusted channels curated for children. Click Add to start importing videos.
        </p>
      </div>

      {/* Featured section — only shown when no filters are active */}
      {isShowingAll && featuredChannels.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Featured Channels
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredChannels.map((channel) => (
              <CuratedChannelCard
                key={channel.youtubeUrl}
                channel={channel}
                isAdded={existingNames.has(channel.name.trim().toLowerCase())}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Channels section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isShowingAll ? 'All Channels' : 'Channels'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredChannels.length})
            </span>
          </h2>
        </div>

        {/* Filter tabs */}
        <div className="space-y-3 mb-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={buildFilterUrl({ category: tab.value })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Age filter tabs */}
          <div className="flex flex-wrap gap-2">
            {AGE_TABS.map((tab) => {
              const isActive = activeAgeRange === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={buildFilterUrl({ ageRange: tab.value })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Channel grid */}
        {filteredChannels.length === 0 ? (
          <div className="rounded-lg bg-white p-12 shadow text-center">
            <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No channels match</h3>
            <p className="text-gray-500 text-sm">
              Try removing a filter to see more channels.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredChannels.map((channel) => (
              <CuratedChannelCard
                key={channel.youtubeUrl}
                channel={channel}
                isAdded={existingNames.has(channel.name.trim().toLowerCase())}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
