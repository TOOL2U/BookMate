/**
 * Initialize Firestore Collections for BookMate
 * 
 * This script creates the required Firestore collections with sample documents
 * Run with: node scripts/init-firestore-collections.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already set
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Initialize Firebase Admin SDK with credentials from .env.local
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Error: Firebase Admin credentials not found in .env.local');
  console.error('Please ensure these variables are set:');
  console.error('  - FIREBASE_ADMIN_PROJECT_ID');
  console.error('  - FIREBASE_ADMIN_CLIENT_EMAIL');
  console.error('  - FIREBASE_ADMIN_PRIVATE_KEY');
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    projectId
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function initializeCollections() {
  console.log('\n🚀 Starting Firestore collections initialization...\n');

  try {
    // 1. Create balances collection
    console.log('📊 Creating balances collection...');
    await db.collection('balances').doc('sample-account').set({
      accountName: 'Sample Property - Main Account',
      currentBalance: 5000.00,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      transactions: 0,
      propertyId: 'sample-property-id',
      accountType: 'checking',
      metadata: {
        createdBy: 'init-script',
        version: '1.0'
      }
    });
    console.log('  ✅ Sample balance created');

    // 2. Create transactions collection
    console.log('\n💰 Creating transactions collection...');
    await db.collection('transactions').add({
      accountName: 'Sample Property - Main Account',
      amount: 1500.00,
      type: 'income',
      category: 'rent',
      description: 'Monthly rent payment',
      date: new Date('2025-11-01'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: 'init-script',
      confidence: 0.95,
      status: 'completed'
    });
    console.log('  ✅ Sample transaction created');

    // 3. Create activityLogs collection
    console.log('\n📝 Creating activityLogs collection...');
    await db.collection('activityLogs').add({
      action: 'firestore_initialized',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        message: 'Firestore collections initialized by script',
        collectionsCreated: ['balances', 'transactions', 'activityLogs', 'aiChecks'],
        environment: 'development'
      },
      userId: 'system',
      status: 'success'
    });
    console.log('  ✅ Initial activity log created');

    // 4. Create aiChecks collection
    console.log('\n🤖 Creating aiChecks collection...');
    await db.collection('aiChecks').add({
      checkType: 'balance_verification',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      accountName: 'Sample Property - Main Account',
      expectedBalance: 5000.00,
      actualBalance: 5000.00,
      drift: 0.00,
      status: 'passed',
      confidence: 1.00,
      metadata: {
        source: 'init-script',
        version: '1.0'
      }
    });
    console.log('  ✅ Sample AI check created');

    console.log('\n✨ All collections initialized successfully!\n');
    console.log('📍 Collections created:');
    console.log('  - balances');
    console.log('  - transactions');
    console.log('  - activityLogs');
    console.log('  - aiChecks');
    console.log('\n🔗 View in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/bookmate-bfd43/firestore\n');

  } catch (error) {
    console.error('\n❌ Error creating collections:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
