/**
 * Login Form Component
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type LoginState } from '@/lib/auth/actions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState<LoginState | null, FormData>(loginAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push(callbackUrl || '/admin/dashboard');
      router.refresh();
    }
  }, [state?.success, router, callbackUrl]);

  return (
    <form action={formAction} className="space-y-4">
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
          placeholder="admin@safestream.local"
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
          autoComplete="current-password"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}

      <SubmitButton />

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Demo credentials:</p>
        <p className="font-mono text-xs">admin@safestream.local / password123</p>
      </div>
    </form>
  );
}
