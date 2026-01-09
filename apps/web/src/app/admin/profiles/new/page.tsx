/**
 * Create Child Profile Page
 */

import { getCurrentUser } from '@/lib/auth/session';
import { ProfileForm } from '@/components/admin/profile-form';
import Link from 'next/link';

export default async function NewProfilePage() {
  await getCurrentUser(); // Ensure authenticated

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Child Profile</h1>
              <p className="mt-1 text-sm text-gray-600">Add a new child to your family</p>
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
          <ProfileForm mode="create" />
        </div>
      </main>
    </div>
  );
}
