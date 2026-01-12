/**
 * Channel Management Page
 * View and manage YouTube channel subscriptions
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import Link from 'next/link';
import { Plus, Youtube, Calendar, CheckCircle, Clock, Filter } from 'lucide-react';

export default async function ChannelsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all channels for the family
  const channels = await prisma.channel.findMany({
    where: {
      familyId: user.familyId,
    },
    include: {
      _count: {
        select: {
          videos: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const getSyncModeLabel = (mode: string) => {
    switch (mode) {
      case 'AUTO_APPROVE':
        return { label: 'Auto-Approve', icon: CheckCircle, color: 'text-green-600 bg-green-50' };
      case 'REVIEW':
        return { label: 'Review', icon: Clock, color: 'text-yellow-600 bg-yellow-50' };
      case 'SELECTIVE':
        return { label: 'Selective', icon: Filter, color: 'text-blue-600 bg-blue-50' };
      default:
        return { label: mode, icon: Clock, color: 'text-gray-600 bg-gray-50' };
    }
  };

  const getSyncFrequencyLabel = (freq: string) => {
    return freq.charAt(0) + freq.slice(1).toLowerCase();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
          <p className="mt-2 text-gray-600">
            Manage YouTube channels and automatically import new videos
          </p>
        </div>
        <Link
          href="/admin/channels/add"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Channel
        </Link>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="rounded-lg bg-white p-12 shadow text-center">
          <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Channels Yet</h3>
          <p className="text-gray-600 mb-6">
            Add YouTube channels to automatically import and organize videos for your children
          </p>
          <Link
            href="/admin/channels/add"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Your First Channel
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {channels.map((channel) => {
            const syncMode = getSyncModeLabel(channel.syncMode);
            const SyncIcon = syncMode.icon;

            return (
              <div
                key={channel.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Channel Thumbnail */}
                  {channel.thumbnailUrl ? (
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.name}
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Youtube className="w-10 h-10 text-gray-400" />
                    </div>
                  )}

                  {/* Channel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate">{channel.name}</h3>
                        {channel.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {channel.description}
                          </p>
                        )}
                      </div>

                      {/* Sync Mode Badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${syncMode.color} flex-shrink-0`}>
                        <SyncIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{syncMode.label}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Youtube className="w-4 h-4" />
                        {channel._count.videos} videos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Sync: {getSyncFrequencyLabel(channel.syncFrequency)}
                      </span>
                      {channel.lastSyncAt && (
                        <span className="text-xs text-gray-500">
                          Last synced: {new Date(channel.lastSyncAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Auto Categories */}
                    {channel.autoCategories && channel.autoCategories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {channel.autoCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
                  <Link
                    href={`/admin/content?channel=${channel.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Videos
                  </Link>
                  <span className="text-gray-300">•</span>
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-700">
                    Edit Settings
                  </button>
                  <span className="text-gray-300">•</span>
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-700">
                    Sync Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
