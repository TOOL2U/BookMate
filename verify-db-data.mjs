import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['workingtest@example.com', 'autotest@example.com', 'finaltest@example.com']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        spreadsheetId: true,
        spreadsheetUrl: true,
        spreadsheetCreatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📊 Database Verification Results:\n');
    console.log('Found', users.length, 'test users\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Spreadsheet ID: ${user.spreadsheetId || 'NULL ❌'}`);
      console.log(`   Spreadsheet URL: ${user.spreadsheetUrl || 'NULL ❌'}`);
      console.log(`   Spreadsheet Created: ${user.spreadsheetCreatedAt || 'NULL ❌'}`);
      console.log(`   User Created: ${user.createdAt}`);
      console.log(`   User Updated: ${user.updatedAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
