#!/usr/bin/env node
/**
 * Check if a password works for a user
 * 
 * Usage: node scripts/check-password.mjs user@example.com "password"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkPassword(email, password) {
  try {
    console.log(`🔍 Checking password for: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.name || user.email}`);

    if (!user.passwordHash) {
      console.error('❌ User has no password set (social login only)');
      process.exit(1);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('\nPassword hash info:');
      console.log('   Hash starts with:', user.passwordHash.substring(0, 20) + '...');
      console.log('   Hash length:', user.passwordHash.length);
    }

  } catch (error) {
    console.error('❌ Error checking password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get credentials from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/check-password.mjs user@example.com "password"');
  process.exit(1);
}

checkPassword(email, password);
