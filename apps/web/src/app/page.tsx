import Link from 'next/link';
import { getCurrentUserOrNull } from '@/lib/auth/session';

export default async function Home() {
  const user = await getCurrentUserOrNull();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">PlayPatch</h1>
          <p className="text-xl text-gray-600 mb-8">
            Safe, parent-controlled video streaming for children
          </p>

          {user ? (
            <div className="space-x-4">
              <Link
                href="/admin/dashboard"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-block rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">For Parents</h2>
            <p className="text-gray-600">
              Complete control over your child's viewing experience with comprehensive analytics
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">For Children</h2>
            <p className="text-gray-600">
              Fun, engaging, age-appropriate content with AI-assisted learning
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-semibold">
            ✅ Phase 1 Complete: Foundation & Authentication
          </p>
          <p className="text-green-700 text-sm mt-2">
            Infrastructure ready • Database configured • Auth working
          </p>
        </div>
      </div>
    </main>
  );
}
