/**
 * Server Actions for Family Settings
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentFamilyId } from '@/lib/auth/session';
import { updateFamilySettings } from '@/lib/db/queries/family-settings';

const settingsSchema = z.object({
  defaultAgeRating: z.enum(['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS']),
  allowAI: z.coerce.boolean(),
  weeklyDigestEnabled: z.coerce.boolean(),
  weeklyDigestEmail: z.string().email().optional().or(z.literal('')),
});

export type SettingsActionState = {
  error?: string;
  success?: boolean;
};

export async function updateFamilySettingsAction(
  _prevState: SettingsActionState | null,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const familyId = await getCurrentFamilyId();

    const validatedFields = settingsSchema.safeParse({
      defaultAgeRating: formData.get('defaultAgeRating'),
      allowAI: formData.get('allowAI') === 'true',
      weeklyDigestEnabled: formData.get('weeklyDigestEnabled') === 'true',
      weeklyDigestEmail: formData.get('weeklyDigestEmail') || undefined,
    });

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0]?.message || 'Validation failed' };
    }

    const { weeklyDigestEmail, ...rest } = validatedFields.data;

    await updateFamilySettings(familyId, {
      ...rest,
      weeklyDigestEmail: weeklyDigestEmail || null,
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Family settings update error:', error);
    return { error: 'Failed to save settings. Please try again.' };
  }
}
