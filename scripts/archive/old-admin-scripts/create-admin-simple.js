const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

console.log('Script started');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function createAdmin() {
  try {
    console.log('Inside async function');
    
    const email = 'admin@siamoon.com';
    const password = 'Siamoon2025!';
    
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');
    
    console.log('Creating/updating user...');
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'admin',
        status: 'active',
        passwordHash: hashedPassword,
      },
      create: {
        email,
        name: 'Siamoon Admin',
        passwordHash: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        provider: 'email',
        loginCount: 0,
        failedLoginCount: 0,
      },
    });
    
    console.log('✅ User created:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Error in createAdmin:', error);
    throw error;
  }
}

console.log('Calling main function');

createAdmin()
  .then((user) => {
    console.log('Success!', user);
    return prisma.$disconnect();
  })
  .then(() => {
    console.log('Disconnected');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    prisma.$disconnect().then(() => process.exit(1));
  });

console.log('Script setup complete');

// Timeout after 10 seconds
setTimeout(() => {
  console.log('TIMEOUT - script took too long');
  process.exit(2);
}, 10000);
