/**
 * Analytics Dashboard
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Parent dashboard for viewing watch session analytics
 */

import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const familyId = await getCurrentFamilyId();
  const profiles = await getChildProfilesByUserId(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin/dashboard"
                className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Watch Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">
                View watch time and viewing patterns for your children
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnalyticsDashboard profiles={profiles} familyId={familyId} />
      </main>
    </div>
  );
}
