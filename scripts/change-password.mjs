#!/usr/bin/env node
/**
 * Change User Password
 * Updates password hash in database and syncs with Firebase
 * 
 * Usage: node scripts/change-password.mjs user@example.com "NewPassword123!"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const prisma = new PrismaClient();

// Initialize Firebase Admin (if credentials available)
let firebaseAdmin = null;
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (process.env.FIREBASE_PROJECT_ID && privateKey) {
    firebaseAdmin = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.log('⚠️  Firebase credentials not found - will only update database');
  }
} catch (error) {
  console.log('⚠️  Firebase initialization failed - will only update database');
}

async function changePassword(email, newPassword) {
  try {
    console.log(`🔐 Changing password for: ${email}`);

    // Validate password
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`📧 Found user: ${user.name || user.email}`);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      }
    });

    console.log('✅ Database password updated');

    // Update Firebase if user has firebaseUid and Firebase is initialized
    if (user.firebaseUid && firebaseAdmin) {
      try {
        await getAuth().updateUser(user.firebaseUid, {
          password: newPassword,
        });
        console.log('✅ Firebase password updated');
      } catch (fbError) {
        console.log('⚠️  Firebase update failed:', fbError.message);
        console.log('   Database password updated, but Firebase sync failed');
      }
    } else if (user.firebaseUid) {
      console.log('⚠️  User has Firebase UID but Firebase Admin not initialized');
      console.log('   Database password updated only');
    } else {
      console.log('ℹ️  User has no Firebase UID - database only');
    }

    console.log('\n✅ Password change complete!');
    console.log('   - Account unlocked');
    console.log('   - Failed login attempts reset');
    console.log('   You can now login with the new password');

  } catch (error) {
    console.error('❌ Error changing password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get credentials from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/change-password.mjs user@example.com "NewPassword123!"');
  process.exit(1);
}

changePassword(email, password);
