/**
 * Create admin@siamoon.com admin account
 * Usage: npx tsx scripts/create-siamoon-admin.ts YOUR_PASSWORD
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { getAdminAuth } from '../lib/firebase/admin';

const ADMIN_EMAIL = 'admin@siamoon.com';
const ADMIN_NAME = 'Siamoon Admin';

async function createSiamoonAdmin() {
  // Get password from command line argument
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Error: Password required');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/create-siamoon-admin.ts YOUR_PASSWORD');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/create-siamoon-admin.ts MySecurePassword123');
    console.log('');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('🔐 Creating Admin Account');
  console.log('─'.repeat(50));
  console.log('Email:', ADMIN_EMAIL);
  console.log('Name:', ADMIN_NAME);
  console.log('Role: admin');
  console.log('─'.repeat(50));
  console.log('');

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });

  if (existing) {
    console.log('⚠️  User already exists!');
    console.log('');
    console.log('Current details:');
    console.log('  - Email:', existing.email);
    console.log('  - Role:', existing.role);
    console.log('  - Status:', existing.status);
    console.log('');

    // Update to ensure admin role and active status
    console.log('📊 Updating to admin role with active status...');
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        status: 'active',
        name: ADMIN_NAME,
      },
    });

    console.log('✅ User updated!');
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
    console.log('Email:', ADMIN_EMAIL);
    console.log('');
    return updated;
  }

  console.log('🔒 Hashing password...');
  const passwordHash = await hashPassword(password);

  // Create Firebase user (optional)
  let firebaseUid: string | undefined;
  try {
    console.log('🔥 Creating Firebase user...');
    const firebaseUser = await getAdminAuth().createUser({
      email: ADMIN_EMAIL.toLowerCase(),
      password,
      displayName: ADMIN_NAME,
    });
    firebaseUid = firebaseUser.uid;
    console.log('✅ Firebase user created');
  } catch (error: any) {
    console.warn('⚠️  Firebase user creation failed (continuing anyway)');
  }

  console.log('💾 Creating database record...');

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL.toLowerCase(),
      name: ADMIN_NAME,
      passwordHash,
      firebaseUid,
      provider: 'email',
      emailVerified: true, // Admin account is pre-verified
      status: 'active',
      role: 'admin',
      loginCount: 0,
      failedLoginCount: 0,
    },
  });

  console.log('');
  console.log('✅ SUCCESS! Admin account created');
  console.log('─'.repeat(50));
  console.log('Email:', user.email);
  console.log('Name:', user.name);
  console.log('Role:', user.role);
  console.log('Status:', user.status);
  console.log('─'.repeat(50));
  console.log('');
  console.log('🎉 Login at: http://localhost:3000/login');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password: (the one you provided)');
  console.log('');

  return user;
}

createSiamoonAdmin()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
