/**
 * Edit Channel Page
 * Allows editing channel settings after creation
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { EditChannelForm } from '@/components/channels/edit-channel-form';

interface PageProps {
  params: {
    channelId: string;
  };
}

export default async function EditChannelPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch channel data
  const channel = await prisma.channel.findUnique({
    where: { id: params.channelId },
    select: {
      id: true,
      familyId: true,
      name: true,
      description: true,
      thumbnailUrl: true,
      syncMode: true,
      syncFrequency: true,
      autoAgeRating: true,
      autoCategories: true,
    },
  });

  // Check if channel exists
  if (!channel) {
    notFound();
  }

  // Verify channel belongs to user's family
  if (channel.familyId !== user.familyId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/admin/channels"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Channels
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Channel Settings</h1>
          <p className="mt-2 text-gray-600">
            Update sync preferences and approval settings for this channel
          </p>
        </div>

        {/* Edit Form */}
        <EditChannelForm channel={channel} />
      </div>
    </div>
  );
}
