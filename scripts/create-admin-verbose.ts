#!/usr/bin/env node
console.log('🚀 Script starting...');

const ADMIN_EMAIL = 'admin@siamoon.com';
const ADMIN_PASSWORD = process.argv[2];

if (!ADMIN_PASSWORD) {
  console.error('❌ Please provide a password');
  process.exit(1);
}

console.log('Password provided:', ADMIN_PASSWORD.substring(0, 3) + '***');

import { config } from 'dotenv';
console.log('✅ Imported dotenv');

config({ path: '.env.local' });
console.log('✅ Loaded environment');

import { PrismaClient } from '@prisma/client';
console.log('✅ Imported Prisma');

import * as admin from 'firebase-admin';
console.log('✅ Imported Firebase Admin');

import bcrypt from 'bcryptjs';
console.log('✅ Imported bcrypt');

const prisma = new PrismaClient();
console.log('✅ Created Prisma client');

async function createAdmin() {
  console.log('\n📋 Step 1: Initialize Firebase...');
  
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: privateKey!,
      }),
    });
  }
  console.log('✅ Firebase ready');
  
  console.log('\n📋 Step 2: Create Firebase user...');
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log('ℹ️  Firebase user exists:', firebaseUser.uid);
    await admin.auth().updateUser(firebaseUser.uid, {
      password: ADMIN_PASSWORD,
      emailVerified: true,
    });
    console.log('✅ Updated password');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      firebaseUser = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true,
        displayName: 'Siamoon Admin',
      });
      console.log('✅ Created Firebase user:', firebaseUser.uid);
    } else {
      throw error;
    }
  }
  
  console.log('\n📋 Step 3: Hash password...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  console.log('✅ Hashed');
  
  console.log('\n📋 Step 4: Create database user...');
  let dbUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });
  
  if (dbUser) {
    console.log('ℹ️  Updating existing user...');
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
  } else {
    console.log('ℹ️  Creating new user...');
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
  }
  console.log('✅ Database user ready');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! Admin account created');
  console.log('='.repeat(60));
  console.log('Email:', dbUser.email);
  console.log('Role:', dbUser.role);
  console.log('Status:', dbUser.status);
  console.log('Firebase UID:', dbUser.firebaseUid);
  console.log('='.repeat(60));
  console.log('\nLogin at /login with:', ADMIN_EMAIL);
  console.log('');
  
  await prisma.$disconnect();
  console.log('✅ Disconnected\n');
}

console.log('\n▶️  Running createAdmin function...\n');

createAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  });
