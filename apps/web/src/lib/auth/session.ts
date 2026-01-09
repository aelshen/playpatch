/**
 * Session utilities and helpers
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Get current session (cached for request)
 * Use in Server Components and Server Actions
 */
export const getCurrentSession = cache(async () => {
  return await auth();
});

/**
 * Get current user or redirect to login
 * Use in Server Components that require authentication
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return session.user;
}

/**
 * Get current user or return null
 * Use when authentication is optional
 */
export async function getCurrentUserOrNull() {
  const session = await getCurrentSession();
  return session?.user || null;
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  const session = await getCurrentSession();
  return session?.user?.role === 'ADMIN';
}

/**
 * Require admin role or redirect
 */
export async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/auth/error?error=AccessDenied');
  }

  return session.user;
}

/**
 * Get family ID from current user
 */
export async function getCurrentFamilyId() {
  const user = await getCurrentUser();
  return user.familyId;
}
