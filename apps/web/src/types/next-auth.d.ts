/**
 * NextAuth.js Type Definitions
 * Extends default types with custom user properties
 */

import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      familyId: string;
      avatarUrl: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    familyId: string;
    avatarUrl: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    familyId: string;
    avatarUrl: string | null;
  }
}
