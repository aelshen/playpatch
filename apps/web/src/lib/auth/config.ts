/**
 * NextAuth.js Full Configuration (Server-Side Only)
 * SSK-021: NextAuth.js Setup
 *
 * This config includes providers with bcrypt and should only be used server-side.
 * For middleware, use the base config from config.base.ts
 */

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { authConfigBase } from './config.base';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
  ...authConfigBase,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Dynamic import to avoid bundling bcrypt in Edge Runtime
          const bcrypt = await import('bcrypt');
          const { prisma } = await import('@/lib/db/client');

          const { email, password } = loginSchema.parse(credentials);

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              family: {
                include: {
                  settings: true,
                },
              },
            },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return null;
          }

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            familyId: user.familyId,
            avatarUrl: user.avatarUrl,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
};
