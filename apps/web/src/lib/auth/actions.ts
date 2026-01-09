/**
 * Server Actions for Authentication
 */

'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginState = {
  error?: string;
  success?: boolean;
};

/**
 * Login action
 */
export async function loginAction(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    // Validate input
    const validatedFields = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0].message,
      };
    }

    const { email, password } = validatedFields.data;

    // Attempt sign in
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' };
        default:
          return { error: 'Something went wrong. Please try again.' };
      }
    }
    throw error;
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  await signOut({ redirect: false });
  redirect('/auth/login');
}
