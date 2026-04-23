/**
 * Video Import Page
 */

import { getCurrentUser } from '@/lib/auth/session';
import Link from 'next/link';
import { ImportTabs } from '@/components/admin/import-tabs';

export default async function ImportVideoPage({
  searchParams,
}: {
  searchParams: { source?: string; q?: string; ageRating?: string };
}) {
  await getCurrentUser();

  const source = searchParams.source || (searchParams.q ? 'search' : 'youtube');
  const prefilledQuery = searchParams.q;
  const ageRating = searchParams.ageRating;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Content</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add videos from YouTube or your Plex server
              </p>
            </div>
            <Link
              href="/admin/content"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <ImportTabs defaultSource={source} prefilledQuery={prefilledQuery} ageRating={ageRating} />
      </main>
    </div>
  );
}
