/**
 * Channel Management Page
 * View and manage YouTube channel subscriptions
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import Link from 'next/link';
import { Plus, Youtube } from 'lucide-react';
import { ChannelCard } from '@/components/channels/channel-card';

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
          {channels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}
