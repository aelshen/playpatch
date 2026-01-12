/**
 * Analytics Page
 * Comprehensive analytics dashboard for watch time, AI chat, and interactions
 */

import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import { getChildProfilesByUserId } from '@/lib/db/queries/child-profiles';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const familyId = await getCurrentFamilyId();
  const profiles = await getChildProfilesByUserId(user.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track watch time, AI interactions, and content engagement for your children
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard profiles={profiles} familyId={familyId} />
    </div>
  );
}
