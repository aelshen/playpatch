/**
 * Database queries for FamilySettings
 */

import { prisma } from '@/lib/db/client';

export interface FamilySettingsData {
  id: string;
  familyId: string;
  defaultAgeRating: string;
  allowAI: boolean;
  weeklyDigestEnabled: boolean;
  weeklyDigestEmail: string | null;
}

/**
 * Get (or create with defaults) family settings for a given family.
 */
export async function getFamilySettings(familyId: string): Promise<FamilySettingsData> {
  return prisma.familySettings.upsert({
    where: { familyId },
    create: { familyId },
    update: {},
  });
}

/**
 * Update family settings.
 */
export async function updateFamilySettings(
  familyId: string,
  data: {
    defaultAgeRating?: string;
    allowAI?: boolean;
    weeklyDigestEnabled?: boolean;
    weeklyDigestEmail?: string | null;
  }
) {
  return prisma.familySettings.upsert({
    where: { familyId },
    create: { familyId, ...data },
    update: data,
  });
}
