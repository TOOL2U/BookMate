console.log('Script started');

import { config } from 'dotenv';
console.log('Imported dotenv');

config({ path: '.env.local' });
console.log('Loaded env');

import { PrismaClient } from '@prisma/client';
console.log('Imported Prisma');

const prisma = new PrismaClient();
console.log('Created Prisma client');

async function test() {
  console.log('In test function');
  const count = await prisma.user.count();
  console.log('User count:', count);
  await prisma.$disconnect();
  console.log('Disconnected');
}

test()
  .then(() => console.log('Done'))
  .catch((e) => console.error('Error:', e));
