/**
 * Toddler Mode Home Screen (Ages 2-4)
 * SSK-072: Toddler Mode Home Screen (placeholder)
 */

import { redirect } from 'next/navigation';
import { getChildSession, clearChildSessionAction } from '@/lib/actions/profile-selection';

export default async function ToddlerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'TODDLER') {
    redirect('/child/explorer');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
              <span className="text-3xl">👶</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hi {childSession.name}!</h1>
              <p className="text-lg text-gray-600">What do you want to watch?</p>
            </div>
          </div>
          <form action={clearChildSessionAction}>
            <button
              type="submit"
              className="rounded-full bg-white px-6 py-3 text-lg font-medium text-gray-700 shadow-lg hover:bg-gray-50"
            >
              Exit
            </button>
          </form>
        </div>

        {/* Content Placeholder */}
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-6 text-7xl">🎬</div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Toddler Mode Coming Soon!
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Large, colorful buttons for ages 2-4 will appear here
          </p>
          <div className="mx-auto max-w-2xl rounded-lg bg-blue-50 p-6">
            <p className="text-left text-sm text-gray-700">
              <strong>Current Session:</strong>
              <br />
              Profile: {childSession.name}
              <br />
              Age: {childSession.age}
              <br />
              Theme: {childSession.theme}
              <br />
              UI Mode: {childSession.uiMode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
