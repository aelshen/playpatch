/**
 * Child Requests Page
 * Shows content requests from kids for parents to review.
 */

import { getCurrentFamilyId } from '@/lib/auth/session';
import { getRequestsByFamily } from '@/lib/db/queries/requests';
import { RequestQueue } from '@/components/admin/request-queue';

export default async function RequestsPage() {
  const familyId = await getCurrentFamilyId();
  const requests = await getRequestsByFamily(familyId);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Child Requests</h1>
        <p className="mt-2 text-gray-600">
          Your kids asked for more content while watching.
          {pendingCount > 0 && (
            <span className="ml-1 font-medium text-yellow-700">
              {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'} need your review.
            </span>
          )}
        </p>
      </div>

      <RequestQueue requests={requests} />
    </div>
  );
}
