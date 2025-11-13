/**
 * Script to assign the original spreadsheet to shaun@siamoon.com
 * This ensures only this account uses the original spreadsheet while all
 * other users get their own auto-provisioned spreadsheets.
 */

import prisma from '../lib/prisma';

const ORIGINAL_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
const ORIGINAL_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${ORIGINAL_SPREADSHEET_ID}/edit`;
const ADMIN_EMAIL = 'shaun@siamoon.com';

async function assignOriginalSpreadsheet() {
  console.log('🔍 Looking for user:', ADMIN_EMAIL);
  
  // Find the admin user
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });

  if (!user) {
    console.error('❌ User not found:', ADMIN_EMAIL);
    console.log('📝 Please register this account first');
    return;
  }

  console.log('✅ Found user:', user.email);
  console.log('   Current spreadsheet ID:', user.spreadsheetId || 'none');

  // Update the user with the original spreadsheet
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      spreadsheetId: ORIGINAL_SPREADSHEET_ID,
      spreadsheetUrl: ORIGINAL_SPREADSHEET_URL,
      spreadsheetCreatedAt: user.spreadsheetCreatedAt || new Date(), // Preserve existing date if available
    },
  });

  console.log('\n✅ SUCCESS! Updated user spreadsheet:');
  console.log('   Email:', updatedUser.email);
  console.log('   Spreadsheet ID:', updatedUser.spreadsheetId);
  console.log('   Spreadsheet URL:', updatedUser.spreadsheetUrl);
  
  // Show all users for verification
  console.log('\n📋 All users in database:');
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      spreadsheetId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  
  allUsers.forEach((u, i) => {
    const isOriginal = u.spreadsheetId === ORIGINAL_SPREADSHEET_ID;
    console.log(`   ${i + 1}. ${u.email}`);
    console.log(`      Spreadsheet: ${u.spreadsheetId || 'none'} ${isOriginal ? '⭐ (ORIGINAL)' : ''}`);
  });
}

assignOriginalSpreadsheet()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
