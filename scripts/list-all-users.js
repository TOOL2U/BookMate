const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking all users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Total users: ${users.length}\n`);
    
    console.log('Users list:');
    console.log('─'.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Count by role
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;
    
    console.log('─'.repeat(80));
    console.log('Summary:');
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Regular users: ${userCount}`);
    console.log(`  Total: ${users.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
