import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo family
  const family = await prisma.family.upsert({
    where: { id: 'demo-family' },
    update: {},
    create: {
      id: 'demo-family',
      name: 'Demo Family',
      settings: {
        create: {
          defaultAgeRating: 'AGE_7_PLUS',
          allowAI: true,
          weeklyDigestEnabled: true,
          weeklyDigestEmail: 'parent@example.com',
        },
      },
    },
  });

  console.log('✅ Created family:', family.name);

  // Create a demo admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@safestream.local' },
    update: {},
    create: {
      email: 'admin@safestream.local',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      familyId: family.id,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log('   Password: password123');

  // Create demo child profiles
  const childTara = await prisma.childProfile.create({
    data: {
      name: 'Tara',
      birthDate: new Date('2021-06-15'), // ~3 years old
      userId: adminUser.id,
      ageRating: 'AGE_4_PLUS',
      uiMode: 'TODDLER',
      theme: 'rainbow',
      aiEnabled: false, // Disabled for toddler
      allowedCategories: ['Music & Dance', 'Stories & Books', 'Animals & Nature'],
    },
  });

  console.log('✅ Created child profile:', childTara.name);

  const childEddie = await prisma.childProfile.create({
    data: {
      name: 'Eddie',
      birthDate: new Date('2018-03-20'), // ~6 years old
      userId: adminUser.id,
      ageRating: 'AGE_7_PLUS',
      uiMode: 'EXPLORER',
      theme: 'space',
      aiEnabled: true,
      allowedCategories: [
        'Educational',
        'Science',
        'Math',
        'Animals & Nature',
        'Stories & Books',
      ],
    },
  });

  console.log('✅ Created child profile:', childEddie.name);

  // Create some sample collections
  const bedtimeCollection = await prisma.collection.create({
    data: {
      name: 'Bedtime Stories',
      description: 'Calm stories for bedtime',
      familyId: family.id,
      type: 'MANUAL',
      visibility: 'ALL',
    },
  });

  console.log('✅ Created collection:', bedtimeCollection.name);

  const learningCollection = await prisma.collection.create({
    data: {
      name: 'Learning Numbers',
      description: 'Math and counting videos',
      familyId: family.id,
      type: 'MANUAL',
      visibility: 'SPECIFIC_AGES',
      visibleToAges: ['AGE_4_PLUS', 'AGE_7_PLUS'],
    },
  });

  console.log('✅ Created collection:', learningCollection.name);

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('   Email: admin@safestream.local');
  console.log('   Password: password123');
  console.log('');
  console.log('👶 Child Profiles:');
  console.log('   - Tara (3 years old, Toddler Mode)');
  console.log('   - Eddie (6 years old, Explorer Mode)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
