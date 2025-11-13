/**
 * Quick script to create shaun@siamoon.com admin account
 * Usage: npx tsx scripts/create-admin-quick.ts YOUR_PASSWORD
 */

import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { getAdminAuth } from '../lib/firebase/admin';

const ADMIN_EMAIL = 'shaun@siamoon.com';
const ADMIN_NAME = 'Shaun Ducker';
const ORIGINAL_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
const ORIGINAL_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${ORIGINAL_SPREADSHEET_ID}/edit`;

async function createAdminAccount() {
  // Get password from command line argument
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Error: Password required');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/create-admin-quick.ts YOUR_PASSWORD');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/create-admin-quick.ts MySecurePassword123');
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
  console.log('Spreadsheet:', ORIGINAL_SPREADSHEET_ID);
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
    console.log('  - Spreadsheet:', existing.spreadsheetId || '(not set)');
    console.log('  - Role:', existing.role);
    console.log('');

    // Update with original spreadsheet and admin role
    console.log('📊 Updating to admin role with original spreadsheet...');
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        spreadsheetId: ORIGINAL_SPREADSHEET_ID,
        spreadsheetUrl: ORIGINAL_SPREADSHEET_URL,
        spreadsheetCreatedAt: existing.spreadsheetCreatedAt || new Date(),
        role: 'admin',
        status: 'active',
        name: ADMIN_NAME,
      },
    });
    console.log('✅ User updated!');
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
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
      spreadsheetId: ORIGINAL_SPREADSHEET_ID,
      spreadsheetUrl: ORIGINAL_SPREADSHEET_URL,
      spreadsheetCreatedAt: new Date(),
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
  console.log('Spreadsheet:', user.spreadsheetId);
  console.log('─'.repeat(50));
  console.log('');
  console.log('🎉 Login at: http://localhost:3000/login');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password: (the one you provided)');
  console.log('');

  return user;
}

createAdminAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
