/**
 * Video Approval Queue Page
 * SSK-041: Video Approval Queue
 */

import { getCurrentFamilyId } from '@/lib/auth/session';
import { getPendingApprovalVideos } from '@/lib/db/queries/videos';
import { ApprovalQueue } from '@/components/admin/approval-queue';
import Link from 'next/link';

export default async function VideoApprovalPage() {
  const familyId = await getCurrentFamilyId();
  const pendingVideos = await getPendingApprovalVideos(familyId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video Approval Queue</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and approve videos before they're available to children
              </p>
            </div>
            <Link
              href="/admin/content"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Content
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 rounded-lg bg-yellow-50 p-4">
          <div className="flex items-center">
            <div className="text-3xl mr-3">⏳</div>
            <div>
              <h3 className="font-semibold text-yellow-900">
                {pendingVideos.length} {pendingVideos.length === 1 ? 'video' : 'videos'} awaiting review
              </h3>
              <p className="text-sm text-yellow-700">
                Videos must be approved before children can watch them
              </p>
            </div>
          </div>
        </div>

        {/* Approval Queue */}
        {pendingVideos.length > 0 ? (
          <ApprovalQueue videos={pendingVideos} />
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              All caught up!
            </h3>
            <p className="mb-4 text-gray-600">
              There are no videos pending approval
            </p>
            <Link
              href="/admin/content/import"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Import More Videos
            </Link>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-900">Approval Guidelines</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Watch the video:</strong> Make sure the content is appropriate for your children
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Check the age rating:</strong> Adjust if needed based on your family's standards
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Verify categories:</strong> Ensure videos are properly categorized for filtering
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                <strong>Reject if needed:</strong> Don't hesitate to reject videos that don't meet your standards
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
