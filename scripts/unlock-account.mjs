#!/usr/bin/env node
/**
 * Unlock User Account
 * Resets failed login attempts and removes account lock
 * 
 * Usage: node scripts/unlock-account.mjs user@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockAccount(email) {
  try {
    console.log(`🔓 Unlocking account for: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.name || user.email}`);
    console.log(`   Failed login attempts: ${user.failedLoginCount}`);
    console.log(`   Locked until: ${user.lockedUntil || 'Not locked'}`);
    console.log(`   Status: ${user.status}`);

    // Unlock account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'active',
      }
    });

    console.log('✅ Account unlocked successfully!');
    console.log('   - Failed login count reset to 0');
    console.log('   - Lock removed');
    console.log('   - Status set to active');

  } catch (error) {
    console.error('❌ Error unlocking account:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/unlock-account.mjs user@example.com');
  process.exit(1);
}

unlockAccount(email);
