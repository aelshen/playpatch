/**
 * Not Found Page for Video Detail
 */

import Link from 'next/link';

export default function VideoNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Not Found</h1>
        <p className="text-gray-600 mb-6">
          The video you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            href="/admin/content"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Back to Library
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
