/**
 * Script to create shaun@siamoon.com admin account
 * with the original spreadsheet assigned
 */

import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth/password';
import { getAdminAuth } from '../lib/firebase/admin';

const ADMIN_EMAIL = 'shaun@siamoon.com';
const ADMIN_NAME = 'Shaun Ducker';
const ORIGINAL_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
const ORIGINAL_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${ORIGINAL_SPREADSHEET_ID}/edit`;

async function createAdminAccount() {
  console.log('🔐 Creating Admin Account');
  console.log('─'.repeat(50));
  console.log('Email:', ADMIN_EMAIL);
  console.log('Name:', ADMIN_NAME);
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
    console.log('  - Name:', existing.name);
    console.log('  - Spreadsheet:', existing.spreadsheetId || '(not set)');
    console.log('  - Status:', existing.status);
    console.log('  - Role:', existing.role);
    console.log('');

    // Update with original spreadsheet if not set
    if (existing.spreadsheetId !== ORIGINAL_SPREADSHEET_ID) {
      console.log('📊 Updating spreadsheet to original...');
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          spreadsheetId: ORIGINAL_SPREADSHEET_ID,
          spreadsheetUrl: ORIGINAL_SPREADSHEET_URL,
          spreadsheetCreatedAt: existing.spreadsheetCreatedAt || new Date(),
          role: 'admin', // Ensure admin role
        },
      });
      console.log('✅ Spreadsheet updated!');
    }

    return existing;
  }

  // Prompt for password
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const password = await new Promise<string>((resolve) => {
    rl.question('Enter password for admin account: ', (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('');
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
    console.log('✅ Firebase user created:', firebaseUid);
  } catch (error: any) {
    console.warn('⚠️  Firebase user creation failed (continuing anyway):', error.message);
  }

  console.log('');
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
  console.log('ID:', user.id);
  console.log('Role:', user.role);
  console.log('Status:', user.status);
  console.log('Spreadsheet:', user.spreadsheetId);
  console.log('Created:', user.createdAt.toISOString());
  console.log('─'.repeat(50));
  console.log('');
  console.log('🎉 You can now login at: http://localhost:3000/login');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password: (the one you just entered)');
  console.log('');

  return user;
}

createAdminAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
