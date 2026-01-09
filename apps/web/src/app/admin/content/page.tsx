/**
 * Content Library Page
 * SSK-036: Video CRUD
 */

import { getCurrentFamilyId } from '@/lib/auth/session';
import { getVideosByFamily, getPendingApprovalVideos } from '@/lib/db/queries/videos';
import { VideoGrid } from '@/components/admin/video-grid';
import Link from 'next/link';

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams: { status?: string; approval?: string };
}) {
  const familyId = await getCurrentFamilyId();

  const { videos, total } = await getVideosByFamily({
    familyId,
    status: searchParams.status,
    approvalStatus: searchParams.approval,
    limit: 50,
  });

  const pendingCount = await getPendingApprovalVideos(familyId).then((v) => v.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your video collection
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/content/import"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Import Video
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Total Videos</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            {pendingCount > 0 && (
              <Link
                href="/admin/content/approval"
                className="mt-2 text-sm font-medium text-yellow-700 hover:underline"
              >
                Review now →
              </Link>
            )}
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {videos.filter((v) => v.approvalStatus === 'APPROVED').length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-gray-600">
              {videos.filter((v) => v.status !== 'READY' && v.status !== 'ERROR').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <div className="mt-1 flex space-x-2">
              <Link
                href="/admin/content"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                All
              </Link>
              <Link
                href="/admin/content?approval=PENDING"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                Pending
              </Link>
              <Link
                href="/admin/content?approval=APPROVED"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
              >
                Approved
              </Link>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <VideoGrid videos={videos} />
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="mb-4 text-6xl">🎬</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">No videos yet</h3>
            <p className="mb-4 text-gray-600">
              Get started by importing your first video
            </p>
            <Link
              href="/admin/content/import"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Import Video
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
