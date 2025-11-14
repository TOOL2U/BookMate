/**
 * Script to check if a user exists and their details
 */

import prisma from '../lib/prisma';

const EMAIL = 'shaun@siamoon.com';

async function checkUser() {
  console.log('🔍 Checking for user:', EMAIL);
  console.log('');
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: EMAIL.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      provider: true,
      status: true,
      role: true,
      emailVerified: true,
      spreadsheetId: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    console.log('❌ User NOT found in database');
    console.log('');
    console.log('📝 You need to register this account first:');
    console.log('   1. Go to http://localhost:3000/register');
    console.log('   2. Register with:', EMAIL);
    console.log('   3. Set a password');
    console.log('');
    
    // Show all existing users
    const allUsers = await prisma.user.findMany({
      select: { email: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log('📋 Existing users in database:');
    if (allUsers.length === 0) {
      console.log('   (none)');
    } else {
      allUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email}`);
      });
    }
    return;
  }

  console.log('✅ User found!');
  console.log('');
  console.log('User Details:');
  console.log('─'.repeat(50));
  console.log('Email:', user.email);
  console.log('Name:', user.name || '(not set)');
  console.log('ID:', user.id);
  console.log('Status:', user.status);
  console.log('Role:', user.role);
  console.log('Provider:', user.provider);
  console.log('Email Verified:', user.emailVerified);
  console.log('Has Password:', user.passwordHash ? '✅ Yes' : '❌ No');
  console.log('Spreadsheet ID:', user.spreadsheetId || '(not assigned)');
  console.log('Created At:', user.createdAt.toISOString());
  console.log('Last Login:', user.lastLoginAt?.toISOString() || '(never)');
  console.log('─'.repeat(50));
  console.log('');

  if (!user.passwordHash) {
    console.log('⚠️  WARNING: User has no password set!');
    console.log('   This account was created without email/password authentication.');
    console.log('   Provider:', user.provider);
    console.log('');
    console.log('💡 Solution:');
    console.log('   1. Use the same login method as registration (e.g., Google OAuth)');
    console.log('   OR');
    console.log('   2. Reset password through password recovery');
  }

  if (user.status !== 'active') {
    console.log('⚠️  WARNING: User status is:', user.status);
    console.log('   User must be "active" to login');
  }
}

checkUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
