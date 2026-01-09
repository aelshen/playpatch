/**
 * Login Page
 * SSK-023: User Login
 */

import { redirect } from 'next/navigation';
import { getCurrentUserOrNull } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Redirect if already logged in
  const user = await getCurrentUserOrNull();
  if (user) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">SafeStream Kids</h1>
          <p className="mt-2 text-gray-600">Safe streaming for children</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Sign In</h2>
          <LoginForm callbackUrl={searchParams.callbackUrl} />
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Don't have an account?</p>
          <a href="/auth/register" className="text-blue-600 hover:underline">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
}
