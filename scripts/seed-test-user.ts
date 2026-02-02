#!/usr/bin/env tsx
/**
 * Seed Test Admin User
 * Run: pnpm tsx scripts/seed-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@playpatch.local';
  const password = 'test123';
  const name = 'Test Admin';

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('✓ Test user already exists');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      return;
    }

    // Find or create test family
    let family = await prisma.family.findFirst({
      where: { name: 'Test Family' }
    });

    if (!family) {
      family = await prisma.family.create({
        data: { name: 'Test Family' }
      });
      console.log('✓ Test family created');
    }

    // Create user
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        familyId: family.id,
      },
    });

    console.log('✅ Test admin user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('');
    console.log('Login at: http://localhost:3000/auth/login');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
