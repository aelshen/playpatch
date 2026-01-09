/**
 * Registration Page
 * SSK-022: User Registration
 */

import { redirect } from 'next/navigation';
import { getCurrentUserOrNull } from '@/lib/auth/session';
import { RegisterForm } from '@/components/auth/register-form';

export default async function RegisterPage() {
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
          <p className="mt-2 text-gray-600">Create your family account</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Register</h2>
          <RegisterForm />
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Already have an account?</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Sign in here
          </a>
        </div>
      </div>
    </div>
  );
}
