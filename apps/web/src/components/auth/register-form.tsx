/**
 * Registration Form Component
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerAction, type RegisterState } from '@/lib/auth/register-actions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? 'Creating account...' : 'Create Account'}
    </button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useFormState<RegisterState | null, FormData>(registerAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push('/auth/login?registered=true');
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Your Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
          Family Name
        </label>
        <input
          id="familyName"
          name="familyName"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="The Doe Family"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}

      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Account created! Redirecting to login...
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
