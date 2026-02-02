/**
 * Test User Seeder
 * Creates an admin user for testing if it doesn't exist
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedTestAdmin() {
  const email = 'test-admin@playpatch.local';
  const password = 'test-password-123';

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('✓ Test admin user already exists');
      return { email, password };
    }

    // Create test admin user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    console.log('✓ Test admin user created:', email);
    return { email, password, userId: user.id };
  } catch (error) {
    console.error('Failed to seed test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export credentials for tests
export const TEST_ADMIN_CREDENTIALS = {
  email: 'test-admin@playpatch.local',
  password: 'test-password-123',
};
