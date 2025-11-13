import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function provisionExistingUsers() {
  try {
    // Find users without spreadsheets
    const usersWithoutSpreadsheets = await prisma.user.findMany({
      where: {
        spreadsheetId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    console.log(`\n📊 Found ${usersWithoutSpreadsheets.length} users without spreadsheets\n`);

    if (usersWithoutSpreadsheets.length === 0) {
      console.log('✅ All users already have spreadsheets!');
      return;
    }

    // Import the provisioning function
    const { provisionUserSpreadsheetAuto } = await import('./lib/services/spreadsheet-provisioning.ts');

    for (const user of usersWithoutSpreadsheets) {
      console.log(`\n🔧 Provisioning spreadsheet for: ${user.email}`);
      
      try {
        const result = await provisionUserSpreadsheetAuto(
          user.id,
          user.email,
          user.name || user.email
        );

        if (result.success && result.spreadsheetId) {
          // Update user with spreadsheet info
          await prisma.user.update({
            where: { id: user.id },
            data: {
              spreadsheetId: result.spreadsheetId,
              spreadsheetUrl: result.spreadsheetUrl,
              spreadsheetCreatedAt: new Date(),
            },
          });
          console.log(`✅ Success! Spreadsheet ID: ${result.spreadsheetId}`);
        } else {
          console.error(`❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error provisioning for ${user.email}:`, error.message);
      }
    }

    console.log('\n✅ Provisioning complete!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

provisionExistingUsers();
