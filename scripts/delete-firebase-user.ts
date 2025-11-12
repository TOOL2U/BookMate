/**
 * Delete Firebase User
 * 
 * Deletes a Firebase user by email
 */

import { getAdminAuth } from '../lib/firebase/admin';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/delete-firebase-user.ts <email>');
  process.exit(1);
}

async function deleteUser() {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    console.log(`✅ Deleted Firebase user: ${email} (${user.uid})`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️  User not found: ${email}`);
    } else {
      console.error(`❌ Error deleting user:`, error.message);
    }
  }
}

deleteUser();
