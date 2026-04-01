/**
 * Admin Dashboard
 * Main parent dashboard with overview, quick actions, and live activity.
 */

import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { getVideosByFamily, getPendingApprovalVideos } from '@/lib/db/queries/videos';
import { getPendingRequestCount } from '@/lib/db/queries/requests';
import { getRecentFamilyActivity } from '@/lib/db/queries/family-activity';
import Link from 'next/link';
import { Suspense } from 'react';

const THEME_EMOJIS: Record<string, string> = {
  space: '🚀',
  ocean: '🌊',
  safari: '🦁',
  rainbow: '🌈',
  forest: '🌲',
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

async function RecentActivityFeed({ familyId }: { familyId: string }) {
  const activity = await getRecentFamilyActivity(familyId, 8);

  if (activity.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <div className="mb-2 text-3xl">📺</div>
        <p className="font-medium text-gray-900">No watch history yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Activity will appear here once your kids start watching.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {activity.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
            {THEME_EMOJIS[item.child.theme] ?? '👶'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              <span className="text-blue-600">{item.child.name}</span>
              {' watched '}
              <Link
                href={`/admin/content/${item.video.id}`}
                className="text-gray-900 hover:underline"
              >
                {item.video.title}
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              {formatDuration(item.duration)} &middot; {timeAgo(item.startedAt)}
              {item.completed && (
                <span className="ml-1.5 font-medium text-green-600">Finished</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  const familyId = await getCurrentFamilyId();

  const [profiles, { total: videoCount }, pendingVideos, pendingRequests] = await Promise.all([
    getChildProfilesByUserId(user.id),
    getVideosByFamily({ familyId, limit: 1 }),
    getPendingApprovalVideos(familyId),
    getPendingRequestCount(familyId),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.name}! Here&apos;s what&apos;s happening with your family.
        </p>
      </div>

      {/* Alert banners */}
      {pendingVideos.length > 0 && (
        <Link
          href="/admin/content/approval"
          className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100"
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-yellow-900">
              {pendingVideos.length} {pendingVideos.length === 1 ? 'video needs' : 'videos need'}{' '}
              your approval
            </p>
            <p className="text-sm text-yellow-700">Click to review and approve content</p>
          </div>
          <span className="ml-auto text-yellow-600">→</span>
        </Link>
      )}

      {pendingRequests > 0 && (
        <Link
          href="/admin/requests"
          className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
        >
          <span className="text-2xl">💌</span>
          <div>
            <p className="font-semibold text-blue-900">
              {pendingRequests} content {pendingRequests === 1 ? 'request' : 'requests'} from your
              kids
            </p>
            <p className="text-sm text-blue-700">They asked for new videos while watching</p>
          </div>
          <span className="ml-auto text-blue-600">→</span>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Child Profiles */}
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">Child Profiles</p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{profiles.length}</p>
          <p className="mt-1 text-sm text-gray-600">
            {profiles.length === 1 ? 'profile' : 'profiles'} created
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
              >
                {THEME_EMOJIS[p.theme ?? 'space'] ?? '👶'} {p.name}
              </span>
            ))}
          </div>
          <Link
            href="/admin/profiles"
            className="mt-4 block text-sm font-medium text-blue-600 hover:underline"
          >
            Manage profiles →
          </Link>
        </div>

        {/* Video Library */}
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">Video Library</p>
          <p className="mt-2 text-4xl font-bold text-purple-600">{videoCount}</p>
          <p className="mt-1 text-sm text-gray-600">
            {videoCount === 1 ? 'video' : 'videos'} in library
          </p>
          {pendingVideos.length > 0 ? (
            <Link
              href="/admin/content/approval"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200"
            >
              ⏳ {pendingVideos.length} pending approval
            </Link>
          ) : (
            <p className="mt-3 text-xs font-medium text-green-600">✓ All content reviewed</p>
          )}
          <Link
            href="/admin/content"
            className="mt-4 block text-sm font-medium text-purple-600 hover:underline"
          >
            Browse library →
          </Link>
        </div>

        {/* Child Requests */}
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm font-medium text-gray-500">Child Requests</p>
          <p
            className={`mt-2 text-4xl font-bold ${pendingRequests > 0 ? 'text-yellow-600' : 'text-gray-400'}`}
          >
            {pendingRequests}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            pending {pendingRequests === 1 ? 'request' : 'requests'}
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Kids can ask for more content while watching videos.
          </p>
          <Link
            href="/admin/requests"
            className="mt-4 block text-sm font-medium text-blue-600 hover:underline"
          >
            View requests →
          </Link>
        </div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Suspense
            fallback={
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <RecentActivityFeed familyId={familyId} />
          </Suspense>
          <Link
            href="/admin/analytics"
            className="mt-4 block text-sm font-medium text-blue-600 hover:underline"
          >
            View full analytics →
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/profiles/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-green-300 hover:bg-green-50"
            >
              <span className="text-xl">➕</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Add Child Profile</p>
                <p className="text-xs text-gray-500">Set up a new kid&apos;s account</p>
              </div>
            </Link>
            <Link
              href="/admin/channels/add"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="text-xl">📺</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Add YouTube Channel</p>
                <p className="text-xs text-gray-500">Import a new content source</p>
              </div>
            </Link>
            <Link
              href="/admin/content/approval"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-yellow-300 hover:bg-yellow-50"
            >
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Review Content</p>
                <p className="text-xs text-gray-500">Approve videos for kids</p>
              </div>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              <span className="text-xl">⚙️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Family Settings</p>
                <p className="text-xs text-gray-500">AI, digest, content filters</p>
              </div>
            </Link>
            <Link
              href="/profiles"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span className="text-xl">👶</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Switch to Child View</p>
                <p className="text-xs text-gray-500">See what kids see</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
