/**
 * Clean up all existing accounts in Firestore
 * Run with: npx tsx scripts/cleanup-accounts.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { getAdminDb } from '../lib/firebase/admin';

async function cleanupAccounts() {
  console.log('🧹 Starting account cleanup...\n');

  try {
    const db = getAdminDb();
    const accountsRef = db.collection('accounts');
    
    // Get all accounts
    const snapshot = await accountsRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No accounts found - already clean!');
      return;
    }

    console.log(`Found ${snapshot.size} account(s) to delete:\n`);

    // List accounts before deleting
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.companyName || 'Unknown'} (${data.userEmail || 'no email'})`);
    });

    console.log('\n🗑️  Deleting all accounts...');

    // Delete all accounts
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${snapshot.size} account(s)`);
    console.log('\n✨ Firestore accounts collection is now clean!');

  } catch (error) {
    console.error('❌ Error cleaning up accounts:', error);
    throw error;
  }
}

cleanupAccounts()
  .then(() => {
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  });
