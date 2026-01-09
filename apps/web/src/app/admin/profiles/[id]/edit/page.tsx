/**
 * Edit Child Profile Page
 */

import { getCurrentUser } from '@/lib/auth/session';
import { getChildProfileById } from '@/lib/db/queries/child-profiles';
import { ProfileForm } from '@/components/admin/profile-form';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditProfilePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const profile = await getChildProfileById(params.id);

  if (!profile || profile.user.id !== user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="mt-1 text-sm text-gray-600">Update {profile.name}'s settings</p>
            </div>
            <Link
              href="/admin/profiles"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <ProfileForm mode="edit" profile={profile} />
        </div>
      </main>
    </div>
  );
}
