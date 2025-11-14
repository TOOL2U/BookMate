/**
 * Check if admin@siamoon.com exists
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import prisma from '../lib/prisma';

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@siamoon.com' }
  });

  if (user) {
    console.log('✅ User exists:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
  } else {
    console.log('❌ User does not exist');
  }

  await prisma.$disconnect();
}

checkAdmin();
