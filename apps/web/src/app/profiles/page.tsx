/**
 * Profile Selection Page - "Who's watching?"
 * SSK-025: Child Profile Selection
 */

import { getCurrentUser } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { ProfileSelector } from '@/components/profiles/profile-selector';
import Link from 'next/link'; // used by "Create First Profile" in the empty state

export default async function ProfileSelectionPage() {
  const user = await getCurrentUser();
  const profiles = await getChildProfilesByUserId(user.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-5xl font-bold text-gray-900">Who&apos;s watching?</h1>
          <p className="text-lg text-gray-600">Select a profile to continue</p>
        </div>

        {/* Profile Grid */}
        {profiles.length > 0 ? (
          <ProfileSelector profiles={profiles} />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-6xl">👶</span>
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">No profiles yet</h2>
            <p className="mb-6 text-gray-600">Parents need to create child profiles first</p>
            <Link
              href="/admin/profiles/new"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Create First Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
