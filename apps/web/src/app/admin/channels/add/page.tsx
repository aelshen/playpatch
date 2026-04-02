/**
 * Add Channel Page
 * Form to add a new YouTube channel
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AddChannelForm } from '@/components/channels/add-channel-form';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function AddChannelPage({
  searchParams,
}: {
  searchParams: { url?: string; name?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        href="/admin/channels"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Channels
      </Link>

      {/* Form */}
      <AddChannelForm initialUrl={searchParams.url} />
    </div>
  );
}
