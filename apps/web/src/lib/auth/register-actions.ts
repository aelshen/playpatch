/**
 * Server Actions for User Registration
 * SSK-022: User Registration
 */

'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db/client';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    familyName: z.string().min(2, 'Family name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterState = {
  error?: string;
  success?: boolean;
};

/**
 * Register a new user and family
 */
export async function registerAction(
  _prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  try {
    // Validate input
    const validatedFields = registerSchema.safeParse({
      name: formData.get('name'),
      familyName: formData.get('familyName'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { name, familyName, email, password } = validatedFields.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        error: 'An account with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create family and user in a transaction
    await prisma.$transaction(async (tx) => {
      // Create family
      const family = await tx.family.create({
        data: {
          name: familyName,
          settings: {
            create: {
              defaultAgeRating: 'AGE_7_PLUS',
              allowAI: true,
              weeklyDigestEnabled: false,
            },
          },
        },
      });

      // Create admin user
      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          familyId: family.id,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      error: 'Something went wrong. Please try again.',
    };
  }
}
