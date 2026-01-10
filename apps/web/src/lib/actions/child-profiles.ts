/**
 * Server Actions for Child Profile Management
 * SSK-024: Child Profile CRUD
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import {
  createChildProfile,
  updateChildProfile,
  deleteChildProfile,
} from '@/lib/db/queries/child-profiles';

const createProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birthDate: z.string().refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d < new Date();
  }, 'Invalid birth date'),
  avatarUrl: z.string().optional(),
  pin: z.string().length(4).optional().or(z.literal('')),
  theme: z.string().optional(),
  allowedCategories: z.array(z.string()).optional(),
});

const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string(),
});

export type ProfileActionState = {
  error?: string;
  success?: boolean;
};

/**
 * Create a new child profile
 */
export async function createChildProfileAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const user = await getCurrentUser();

    const validatedFields = createProfileSchema.safeParse({
      name: formData.get('name'),
      birthDate: formData.get('birthDate'),
      avatarUrl: formData.get('avatarUrl') || undefined,
      pin: formData.get('pin') || undefined,
      theme: formData.get('theme') || 'space',
      allowedCategories: formData.getAll('allowedCategories'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { name, birthDate, avatarUrl, pin, theme, allowedCategories } = validatedFields.data;

    await createChildProfile({
      userId: user.id,
      name,
      birthDate: new Date(birthDate),
      avatarUrl,
      pin: pin || undefined,
      theme,
      allowedCategories,
    });

    revalidatePath('/admin/profiles');

    return { success: true };
  } catch (error) {
    console.error('Create profile error:', error);
    return {
      error: 'Failed to create profile. Please try again.',
    };
  }
}

/**
 * Update a child profile
 */
export async function updateChildProfileAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    await getCurrentUser();

    const validatedFields = updateProfileSchema.safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      birthDate: formData.get('birthDate'),
      avatarUrl: formData.get('avatarUrl') || undefined,
      pin: formData.get('pin') || undefined,
      theme: formData.get('theme'),
      allowedCategories: formData.getAll('allowedCategories'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { id, ...data } = validatedFields.data;

    await updateChildProfile(id, {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      pin: data.pin || undefined,
    });

    revalidatePath('/admin/profiles');

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      error: 'Failed to update profile. Please try again.',
    };
  }
}

/**
 * Delete a child profile
 */
export async function deleteChildProfileAction(profileId: string): Promise<ProfileActionState> {
  try {
    await getCurrentUser();

    await deleteChildProfile(profileId);

    revalidatePath('/admin/profiles');

    return { success: true };
  } catch (error) {
    console.error('Delete profile error:', error);
    return {
      error: 'Failed to delete profile. Please try again.',
    };
  }
}
