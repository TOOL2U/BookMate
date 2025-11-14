console.log('🚀 Creating admin@siamoon.com account...');

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@siamoon.com';
const ADMIN_PASSWORD = process.argv[2];

if (!ADMIN_PASSWORD) {
  console.error('❌ Please provide a password as argument');
  console.error('Usage: npx tsx scripts/create-admin-working.ts "YourPassword123!"');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n1️⃣ Initializing Firebase Admin...');
    
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing Firebase environment variables');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
    console.log('   ✅ Firebase initialized');
    
    console.log('\n2️⃣ Creating/finding Firebase user...');
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log('   ℹ️  Firebase user already exists:', firebaseUser.uid);
      // Update password
      await admin.auth().updateUser(firebaseUser.uid, {
        password: ADMIN_PASSWORD,
        emailVerified: true,
      });
      console.log('   ✅ Updated Firebase password');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        firebaseUser = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true,
          displayName: 'Siamoon Admin',
        });
        console.log('   ✅ Created Firebase user:', firebaseUser.uid);
      } else {
        throw error;
      }
    }
    
    console.log('\n3️⃣ Hashing password for database...');
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('   ✅ Password hashed');
    
    console.log('\n4️⃣ Creating/updating database user...');
    let dbUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL.toLowerCase() },
    });
    
    if (dbUser) {
      console.log('   ℹ️  Database user already exists, updating...');
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          passwordHash,
          firebaseUid: firebaseUser.uid,
          role: 'admin',
          status: 'active',
          emailVerified: true,
          name: 'Siamoon Admin',
        },
      });
      console.log('   ✅ Updated database user');
    } else {
      console.log('   ℹ️  Creating new database user...');
      dbUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL.toLowerCase(),
          name: 'Siamoon Admin',
          passwordHash,
          firebaseUid: firebaseUser.uid,
          provider: 'email',
          emailVerified: true,
          status: 'active',
          role: 'admin',
          loginCount: 0,
          failedLoginCount: 0,
        },
      });
      console.log('   ✅ Created database user');
    }
    
    console.log('\n✅ SUCCESS!');
    console.log('═'.repeat(50));
    console.log('Admin account ready:');
    console.log('  Email:        ', dbUser.email);
    console.log('  Name:         ', dbUser.name);
    console.log('  Role:         ', dbUser.role);
    console.log('  Status:       ', dbUser.status);
    console.log('  Firebase UID: ', dbUser.firebaseUid);
    console.log('═'.repeat(50));
    console.log('\nYou can now login at /login with:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
