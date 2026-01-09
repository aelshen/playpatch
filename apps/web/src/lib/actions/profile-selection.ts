/**
 * Server Actions for Profile Selection
 * SSK-025: Child Profile Selection
 */

'use server';

import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/session';
import { getChildProfileById } from '@/lib/db/queries/child-profiles';

export type ProfileSelectionState = {
  error?: string;
  success?: boolean;
};

/**
 * Select a child profile (create child session)
 */
export async function selectProfileAction(profileId: string): Promise<ProfileSelectionState> {
  try {
    const user = await getCurrentUser();

    // Verify profile belongs to user's family
    const profile = await getChildProfileById(profileId);

    if (!profile || profile.user.id !== user.id) {
      return { error: 'Profile not found or access denied' };
    }

    // Create child session cookie
    const childSession = {
      profileId: profile.id,
      name: profile.name,
      age: profile.age,
      uiMode: profile.uiMode,
      ageRating: profile.ageRating,
      theme: profile.theme,
      aiEnabled: profile.aiEnabled,
      aiVoiceEnabled: profile.aiVoiceEnabled,
      allowedCategories: profile.allowedCategories,
      selectedAt: new Date().toISOString(),
    };

    // Store in httpOnly cookie (24 hour expiry)
    cookies().set('child-session', JSON.stringify(childSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Profile selection error:', error);
    return { error: 'Failed to select profile' };
  }
}

/**
 * Clear child session (exit child mode)
 */
export async function clearChildSessionAction(): Promise<void> {
  cookies().delete('child-session');
}

/**
 * Get current child session
 */
export async function getChildSession() {
  const sessionCookie = cookies().get('child-session');

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}
