/**
 * Simple Password Change Script
 * Direct database password update
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function changePassword(email, newPassword) {
  try {
    console.log(`🔐 Changing password for: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.name || user.email}`);
    console.log(`   Current status: ${user.status}`);
    console.log(`   Failed logins: ${user.failedLoginCount}`);

    // Hash new password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update database
    console.log('💾 Updating database...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'active',
      }
    });

    console.log('✅ Password changed successfully!');
    console.log('   - Account unlocked');
    console.log('   - Failed login attempts reset to 0');
    console.log('   - Status set to active');
    console.log('\n✅ You can now login with the new password');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get credentials from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/simple-change-password.js user@example.com "password"');
  process.exit(1);
}

changePassword(email, password);
