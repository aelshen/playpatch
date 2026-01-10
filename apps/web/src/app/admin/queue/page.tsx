/**
 * Queue Monitoring Page
 * View status of all background jobs
 */

import { getCurrentUser } from '@/lib/auth/session';
import Link from 'next/link';
import { QueueMonitor } from '@/components/admin/queue-monitor';

export default async function QueueMonitoringPage() {
  await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Queue Monitor</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor background job processing
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
        <QueueMonitor />
      </main>
    </div>
  );
}
