/**
 * Database queries for child profiles
 * SSK-024: Child Profile Management
 */

import { prisma } from '@/lib/db/client';
import { calculateAge, suggestUIMode } from '@/lib/utils/shared';

/**
 * Get all child profiles for a user
 */
export async function getChildProfilesByUserId(userId: string) {
  const profiles = await prisma.childProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  // Add calculated age to each profile
  return profiles.map((profile) => ({
    ...profile,
    age: calculateAge(profile.birthDate),
  }));
}

/**
 * Get a single child profile by ID
 */
export async function getChildProfileById(id: string) {
  const profile = await prisma.childProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          familyId: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    ...profile,
    age: calculateAge(profile.birthDate),
  };
}

/**
 * Create a new child profile
 */
export async function createChildProfile(data: {
  userId: string;
  name: string;
  birthDate: Date;
  avatarUrl?: string;
  pin?: string;
  ageRating?: string;
  uiMode?: string;
  theme?: string;
  aiEnabled?: boolean;
  aiVoiceEnabled?: boolean;
  allowedCategories?: string[];
}) {
  const age = calculateAge(data.birthDate);
  const suggestedUIMode = suggestUIMode(age);

  const profile = await prisma.childProfile.create({
    data: {
      userId: data.userId,
      name: data.name,
      birthDate: data.birthDate,
      avatarUrl: data.avatarUrl,
      pin: data.pin,
      ageRating: (data.ageRating || getDefaultAgeRating(age)) as any,
      uiMode: (data.uiMode || suggestedUIMode) as any,
      theme: data.theme || 'space',
      aiEnabled: data.aiEnabled ?? (age >= 5), // Enable AI for ages 5+
      aiVoiceEnabled: data.aiVoiceEnabled ?? false,
      allowedCategories: data.allowedCategories || [],
    },
  });

  return {
    ...profile,
    age,
  };
}

/**
 * Update a child profile
 */
export async function updateChildProfile(
  id: string,
  data: {
    name?: string;
    birthDate?: Date;
    avatarUrl?: string;
    pin?: string;
    ageRating?: string;
    uiMode?: string;
    theme?: string;
    aiEnabled?: boolean;
    aiVoiceEnabled?: boolean;
    allowedCategories?: string[];
    timeLimits?: any;
  }
) {
  const profile = await prisma.childProfile.update({
    where: { id },
    data: data as any,
  });

  return {
    ...profile,
    age: calculateAge(profile.birthDate),
  };
}

/**
 * Delete a child profile
 */
export async function deleteChildProfile(id: string) {
  await prisma.childProfile.delete({
    where: { id },
  });
}

/**
 * Get default age rating based on age
 */
function getDefaultAgeRating(age: number): string {
  if (age < 4) return 'AGE_2_PLUS';
  if (age < 7) return 'AGE_4_PLUS';
  if (age < 10) return 'AGE_7_PLUS';
  return 'AGE_10_PLUS';
}
