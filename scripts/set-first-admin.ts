/**
 * Quick Setup Script: Set First Admin User
 * 
 * Run this once to give admin privileges to your first user
 * 
 * Usage:
 *   ts-node scripts/set-first-admin.ts YOUR_FIREBASE_UID
 * 
 * Or create an API route and call it once:
 *   POST /api/admin/setup with { uid: "firebase-uid" }
 */

import { setAdminClaim } from '../lib/auth/admin';

async function setFirstAdmin() {
  const uid = process.argv[2];

  if (!uid) {
    console.error('❌ Error: Please provide a Firebase UID');
    console.log('');
    console.log('Usage:');
    console.log('  ts-node scripts/set-first-admin.ts YOUR_FIREBASE_UID');
    console.log('');
    console.log('To get your UID:');
    console.log('  1. Login to your app');
    console.log('  2. Check Firebase Auth console');
    console.log('  3. Copy the UID from your user record');
    process.exit(1);
  }

  try {
    console.log(`🔧 Setting admin claim for user: ${uid}`);
    await setAdminClaim(uid);
    console.log('✅ Success! User is now an admin.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Have the user logout and login again');
    console.log('  2. Navigate to /admin/accounts/new');
    console.log('  3. Start creating accounts!');
  } catch (error: any) {
    console.error('❌ Error setting admin claim:', error.message);
    process.exit(1);
  }
}

setFirstAdmin();
