import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setPassword() {
  const email = 'shaun@siamoon.com';
  const password = 'Alesiamay231!';

  console.log('Setting password for:', email);
  console.log('Password:', password);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('User found:', user.email);

    // Generate hash using same settings as the app
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('Generated hash:', passwordHash.substring(0, 30) + '...');

    // Verify the hash works
    const testVerify = await bcrypt.compare(password, passwordHash);
    console.log('Hash verification test:', testVerify ? 'PASS ✅' : 'FAIL ❌');

    if (!testVerify) {
      console.error('Hash verification failed! Not updating database.');
      process.exit(1);
    }

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'active',
      }
    });

    console.log('✅ Database updated successfully!');
    console.log('You can now login with:', password);

    // Test the stored hash
    const updatedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    const finalVerify = await bcrypt.compare(password, updatedUser!.passwordHash!);
    console.log('Final verification test:', finalVerify ? 'PASS ✅' : 'FAIL ❌');

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setPassword();
