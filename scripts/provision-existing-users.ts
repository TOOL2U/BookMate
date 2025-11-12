/**
 * Provision Spreadsheets for Existing Users
 * 
 * This script provisions Google Spreadsheets for users who registered
 * before the multi-tenant system was implemented.
 * 
 * Usage:
 *   npx tsx scripts/provision-existing-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding users without spreadsheets...\n');
  
  const usersWithoutSheets = await prisma.user.findMany({
    where: {
      spreadsheetId: null
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  if (usersWithoutSheets.length === 0) {
    console.log('✅ All users already have spreadsheets provisioned!');
    return;
  }

  console.log(`Found ${usersWithoutSheets.length} users without spreadsheets:\n`);
  
  usersWithoutSheets.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
  });

  console.log('\n⚠️  IMPORTANT: These users need to complete OAuth flow to get spreadsheets.');
  console.log('\nOptions:');
  console.log('1. Have each user login and complete OAuth authorization');
  console.log('2. Send them to: http://localhost:3000/login');
  console.log('3. After login, they\'ll be redirected to Google OAuth');
  console.log('4. After authorization, spreadsheet will be auto-created\n');

  console.log('📧 Users who need to authorize:\n');
  usersWithoutSheets.forEach(user => {
    console.log(`   - ${user.email}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
