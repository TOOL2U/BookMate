import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@siamoon.com';
const ADMIN_PASSWORD = process.argv[2];

if (!ADMIN_PASSWORD) {
  console.error('❌ Please provide a password as argument');
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting admin creation...');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
    
    console.log('Firebase initialized');
    
    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log('Firebase user already exists:', firebaseUser.uid);
    } catch (error) {
      firebaseUser = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true,
      });
      console.log('Created Firebase user:', firebaseUser.uid);
    }
    
    // Hash password for Prisma
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('Password hashed');
    
    // Check if Prisma user exists
    let user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL.toLowerCase() },
    });
    
    if (user) {
      console.log('Prisma user already exists, updating...');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          firebaseUid: firebaseUser.uid,
          role: 'admin',
          status: 'active',
          emailVerified: true,
        },
      });
    } else {
      console.log('Creating Prisma user...');
      user = await prisma.user.create({
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
    }
    
    console.log('');
    console.log('✅ SUCCESS!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected');
  }
}

main()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
