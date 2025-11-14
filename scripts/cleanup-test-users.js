const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const KEEP_EMAIL = 'admin@siamoon.com';

async function cleanupUsers() {
  try {
    console.log('🧹 Cleaning up test users...\n');
    
    // Get all users except the one we want to keep
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          not: KEEP_EMAIL,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    
    console.log(`Found ${usersToDelete.length} users to delete:\n`);
    usersToDelete.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name})`);
    });
    
    console.log('\n🗑️  Deleting users...\n');
    
    // Delete related records first (sessions, refresh tokens, audit logs)
    for (const user of usersToDelete) {
      console.log(`Deleting related records for: ${user.email}`);
      
      // Delete sessions
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
      
      // Delete refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });
      
      // Delete audit logs
      await prisma.auditLog.deleteMany({
        where: { userId: user.id },
      });
    }
    
    // Now delete the users
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          not: KEEP_EMAIL,
        },
      },
    });
    
    console.log(`\n✅ Deleted ${result.count} users\n`);
    
    // Verify remaining users
    const remaining = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });
    
    console.log('─'.repeat(80));
    console.log('Remaining users in database:');
    console.log('─'.repeat(80));
    remaining.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}\n`);
    });
    
    console.log('✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();
