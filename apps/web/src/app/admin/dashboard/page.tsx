/**
 * Admin Dashboard
 * Main parent dashboard with overview and quick stats
 */

import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { getVideosByFamily, getPendingApprovalVideos } from '@/lib/db/queries/videos';
import Link from 'next/link';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  const familyId = await getCurrentFamilyId();
  const profiles = await getChildProfilesByUserId(user.id);
  const { total: videoCount } = await getVideosByFamily({ familyId, limit: 1 });
  const pendingVideos = await getPendingApprovalVideos(familyId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.name}! Here's what's happening with your family's SafeStream.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user.role}
              </p>
              <p className="text-sm">
                <span className="font-medium">Family ID:</span> {user.familyId}
              </p>
            </div>
          </div>

          {/* Child Profiles Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Child Profiles</h3>
            <div className="mt-4">
              <p className="text-3xl font-bold text-blue-600">{profiles.length}</p>
              <p className="text-sm text-gray-600">
                {profiles.length === 1 ? 'profile' : 'profiles'} created
              </p>
              <Link
                href="/admin/profiles"
                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Manage Profiles →
              </Link>
            </div>
          </div>

          {/* Videos Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Video Library</h3>
            <div className="mt-4">
              <p className="text-3xl font-bold text-purple-600">{videoCount}</p>
              <p className="text-sm text-gray-600">
                {videoCount === 1 ? 'video' : 'videos'} in library
              </p>
              {pendingVideos.length > 0 && (
                <p className="mt-2 text-sm font-medium text-yellow-600">
                  {pendingVideos.length} pending approval
                </p>
              )}
              <Link
                href="/admin/content"
                className="mt-3 inline-block text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                Manage Content →
              </Link>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Watch Analytics</h3>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                View watch time and viewing patterns
              </p>
              <Link
                href="/admin/analytics"
                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Analytics →
              </Link>
            </div>
          </div>

          {/* Progress Card */}
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="text-lg font-semibold text-green-900">✅ Progress</h3>
            <p className="mt-2 text-sm text-green-800">You're all set up!</p>
            <ul className="mt-3 space-y-1 text-sm text-green-700">
              <li>✓ Authentication</li>
              <li>✓ Child profiles</li>
              <li>→ Content next</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-5">
            <Link
              href="/profiles"
              className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center hover:border-blue-300 hover:bg-blue-100"
            >
              <div className="mb-2 text-3xl">👶</div>
              <p className="font-medium text-gray-900">Select Child Profile</p>
              <p className="text-sm text-gray-600">Start watching</p>
            </Link>
            <Link
              href="/admin/profiles/new"
              className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center hover:border-green-300 hover:bg-green-100"
            >
              <div className="mb-2 text-3xl">➕</div>
              <p className="font-medium text-gray-900">Add Child Profile</p>
              <p className="text-sm text-gray-600">Create new</p>
            </Link>
            <Link
              href="/admin/content"
              className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 text-center hover:border-purple-300 hover:bg-purple-100"
            >
              <div className="mb-2 text-3xl">🎬</div>
              <p className="font-medium text-gray-900">Manage Content</p>
              <p className="text-sm text-gray-600">View library</p>
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 text-center hover:border-indigo-300 hover:bg-indigo-100"
            >
              <div className="mb-2 text-3xl">📊</div>
              <p className="font-medium text-gray-900">Watch Analytics</p>
              <p className="text-sm text-gray-600">View reports</p>
            </Link>
            <Link
              href="/admin/queue"
              className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 text-center hover:border-orange-300 hover:bg-orange-100"
            >
              <div className="mb-2 text-3xl">⚙️</div>
              <p className="font-medium text-gray-900">Queue Monitor</p>
              <p className="text-sm text-gray-600">Background jobs</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
