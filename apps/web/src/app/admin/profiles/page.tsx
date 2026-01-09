/**
 * Child Profiles Management Page
 * SSK-024: Child Profile CRUD
 */

import { getCurrentUser } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { ProfileCard } from '@/components/admin/profile-card';
import { CreateProfileButton } from '@/components/admin/create-profile-button';
import Link from 'next/link';

export default async function ProfilesPage() {
  const user = await getCurrentUser();
  const profiles = await getChildProfilesByUserId(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Child Profiles</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your children's profiles and settings
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {profiles.length === 0 ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <span className="text-5xl">👶</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No profiles yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first child profile
            </p>
            <div className="mt-6">
              <CreateProfileButton />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {profiles.length} {profiles.length === 1 ? 'profile' : 'profiles'}
              </p>
              <CreateProfileButton />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
