/**
 * Simple script to create admin@siamoon.com
 */

console.log('Starting script...');

import('dotenv').then(({ config }) => {
  import('path').then(({ resolve }) => {
    config({ path: resolve(process.cwd(), '.env.local') });
    
    console.log('Environment loaded');
    
    import('../lib/prisma.js').then(({ default: prisma }) => {
      import('../lib/auth/password.js').then(({ hashPassword }) => {
        import('../lib/firebase/admin.js').then(({ getAdminAuth }) => {
          
          console.log('Modules loaded');
          
          const ADMIN_EMAIL = 'admin@siamoon.com';
          const ADMIN_NAME = 'Siamoon Admin';
          const password = process.argv[2] || 'Siamoon2025!';
          
          console.log('Creating user with email:', ADMIN_EMAIL);
          
          hashPassword(password).then(async (passwordHash) => {
            
            console.log('Password hashed');
            
            // Check existing
            const existing = await prisma.user.findUnique({
              where: { email: ADMIN_EMAIL.toLowerCase() }
            });
            
            if (existing) {
              console.log('User already exists, updating...');
              const updated = await prisma.user.update({
                where: { id: existing.id },
                data: {
                  role: 'admin',
                  status: 'active',
                  name: ADMIN_NAME,
                }
              });
              console.log('✅ Updated:', updated.email);
              await prisma.$disconnect();
              process.exit(0);
            }
            
            // Create Firebase user
            let firebaseUid;
            try {
              const auth = getAdminAuth();
              const firebaseUser = await auth.createUser({
                email: ADMIN_EMAIL.toLowerCase(),
                password,
                displayName: ADMIN_NAME,
              });
              firebaseUid = firebaseUser.uid;
              console.log('✅ Firebase user created:', firebaseUid);
            } catch (err) {
              console.warn('⚠️ Firebase creation failed:', err.message);
            }
            
            // Create DB user
            const user = await prisma.user.create({
              data: {
                email: ADMIN_EMAIL.toLowerCase(),
                name: ADMIN_NAME,
                passwordHash,
                firebaseUid,
                provider: 'email',
                emailVerified: true,
                status: 'active',
                role: 'admin',
                loginCount: 0,
                failedLoginCount: 0,
              }
            });
            
            console.log('');
            console.log('✅ SUCCESS!');
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('');
            console.log('Login at: http://localhost:3000/login');
            console.log('');
            
            await prisma.$disconnect();
            process.exit(0);
            
          }).catch(err => {
            console.error('❌ Error:', err);
            process.exit(1);
          });
          
        });
      });
    });
  });
});
