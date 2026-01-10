/**
 * Video Detail Page
 * Shows individual video details and approval interface
 */

import { getCurrentFamilyId } from '@/lib/auth/session';
import { getVideoById } from '@/lib/db/queries/videos';
import { VideoDetailView } from '@/components/admin/video-detail-view';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const familyId = await getCurrentFamilyId();
  const video = await getVideoById(params.id, familyId);

  if (!video) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Details</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and approve video for viewing
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/content/approval"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Approval Queue
              </Link>
              <Link
                href="/admin/content"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Library
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <VideoDetailView video={video} />
      </main>
    </div>
  );
}
