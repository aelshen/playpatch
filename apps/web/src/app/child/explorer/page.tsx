/**
 * Explorer Mode Home Screen (Ages 5-12)
 * SSK-073: Explorer Mode Home Screen (placeholder)
 */

import { redirect } from 'next/navigation';
import { getChildSession, clearChildSessionAction } from '@/lib/actions/profile-selection';

export default async function ExplorerHomePage() {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  if (childSession.uiMode !== 'EXPLORER') {
    redirect('/child/toddler');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-xl">🧒</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {childSession.name}!
                </h1>
                <p className="text-sm text-gray-600">Ready to explore?</p>
              </div>
            </div>
            <form action={clearChildSessionAction}>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Exit
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-6 text-6xl">🚀</div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Explorer Mode Coming Soon!
          </h2>
          <p className="mb-6 text-lg text-gray-600">
            Browse categories, search videos, and chat with AI helper
          </p>
          <div className="mx-auto max-w-xl rounded-lg bg-blue-50 p-4">
            <p className="text-left text-sm text-gray-700">
              <strong>Session Info:</strong>
              <br />
              Profile: {childSession.name} (Age {childSession.age})
              <br />
              Theme: {childSession.theme}
              <br />
              UI Mode: {childSession.uiMode}
              <br />
              AI Enabled: {childSession.aiEnabled ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
