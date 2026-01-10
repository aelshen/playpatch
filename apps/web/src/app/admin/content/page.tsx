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

  // Get status counts
  const awaitingApproval = videos.filter((v) => v.approvalStatus === 'PENDING').length;
  const downloading = videos.filter((v) => v.status === 'DOWNLOADING').length;
  const processing = videos.filter((v) => v.status === 'PROCESSING').length;
  const readyToWatch = videos.filter(
    (v) => v.approvalStatus === 'APPROVED' && (v as any).localPath
  ).length;
  const errors = videos.filter((v) => v.status === 'ERROR').length;

  // Get recent imports (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentImports = videos.filter((v) => new Date(v.createdAt) > oneDayAgo);

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
        {/* Recent Imports Alert */}
        {recentImports.length > 0 && (
          <div className="mb-6 rounded-lg bg-blue-50 border-2 border-blue-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📥</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Recent Imports (Last 24 Hours)</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {recentImports.length} video{recentImports.length !== 1 ? 's' : ''} imported recently
                </p>
                <div className="mt-3 space-y-2">
                  {recentImports.slice(0, 5).map((video) => (
                    <Link
                      key={video.id}
                      href={`/admin/content/${video.id}`}
                      className="block bg-white rounded-lg p-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{video.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Imported {new Date(video.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-3 flex items-center space-x-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            video.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            video.status === 'DOWNLOADING' ? 'bg-blue-100 text-blue-800' :
                            video.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                            video.status === 'READY' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {video.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {recentImports.length > 5 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Showing 5 of {recentImports.length} recent imports
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Total Videos</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <p className="text-sm text-gray-600">Awaiting Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{awaitingApproval}</p>
            {awaitingApproval > 0 && (
              <Link
                href="/admin/content/approval"
                className="text-xs text-yellow-700 hover:underline mt-1 block"
              >
                Review now →
              </Link>
            )}
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-sm text-gray-600">Downloading</p>
            <p className="text-2xl font-bold text-blue-600">{downloading}</p>
            {downloading > 0 && (
              <p className="text-xs text-blue-700 mt-1">In progress</p>
            )}
          </div>
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-purple-600">{processing}</p>
            {processing > 0 && (
              <p className="text-xs text-purple-700 mt-1">Being transcoded</p>
            )}
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-gray-600">Ready to Watch</p>
            <p className="text-2xl font-bold text-green-600">{readyToWatch}</p>
            {readyToWatch > 0 && (
              <p className="text-xs text-green-700 mt-1">Available now</p>
            )}
          </div>
          {errors > 0 && (
            <div className="rounded-lg bg-red-50 p-4 shadow">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">{errors}</p>
              <Link
                href="/admin/content?status=ERROR"
                className="text-xs text-red-700 hover:underline mt-1 block"
              >
                View errors →
              </Link>
            </div>
          )}
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
