console.log('Checking for admin user...');

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@siamoon.com' },
  });
  
  if (admin) {
    console.log('✅ Admin user exists:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Status:', admin.status);
    console.log('  Firebase UID:', admin.firebaseUid || '(not set)');
  } else {
    console.log('❌ Admin user does NOT exist');
    
    // List all users to see what's there
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
    });
    console.log('\nExisting users:');
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
  }
  
  await prisma.$disconnect();
}

check();
