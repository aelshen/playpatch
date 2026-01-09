/**
 * NextAuth.js Base Configuration (Edge Runtime Safe)
 * This config doesn't include providers and can be used in middleware
 */

import type { NextAuthConfig } from 'next-auth';

export const authConfigBase = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth = nextUrl.pathname.startsWith('/auth');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnChild = nextUrl.pathname.startsWith('/child');
      const isOnProfiles = nextUrl.pathname === '/profiles';

      // Allow auth pages when not logged in
      if (isOnAuth) {
        return true;
      }

      // Redirect to login if not authenticated
      if (!isLoggedIn && (isOnAdmin || isOnChild || isOnProfiles)) {
        return false;
      }

      // Check admin role for admin routes
      if (isOnAdmin && auth?.user?.role !== 'ADMIN') {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.familyId = user.familyId;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
          familyId: token.familyId as string,
          avatarUrl: token.avatarUrl as string | null,
        };
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig;
