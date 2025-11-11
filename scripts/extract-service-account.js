/**
 * Extract Service Account Credentials
 * 
 * This script reads a Firebase service account JSON file and
 * outputs the credentials in .env.local format
 * 
 * Usage: node scripts/extract-service-account.js <path-to-json-file>
 */

const fs = require('fs');
const path = require('path');

// Get the JSON file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Error: Please provide the path to your service account JSON file');
  console.log('\nUsage: node scripts/extract-service-account.js <path-to-json-file>');
  console.log('Example: node scripts/extract-service-account.js firebase-admin-key.json');
  process.exit(1);
}

const jsonFilePath = args[0];

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Error: File not found: ${jsonFilePath}`);
  process.exit(1);
}

try {
  // Read and parse the JSON file
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const serviceAccount = JSON.parse(jsonContent);

  // Extract the required fields
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Error: Invalid service account file. Missing required fields.');
    process.exit(1);
  }

  // Output the credentials
  console.log('\n✅ Service Account Credentials Extracted!\n');
  console.log('Copy these lines to your .env.local file:\n');
  console.log('# Firebase Admin SDK (Server-side only)');
  console.log(`FIREBASE_ADMIN_PROJECT_ID="${projectId}"`);
  console.log(`FIREBASE_ADMIN_CLIENT_EMAIL="${clientEmail}"`);
  console.log(`FIREBASE_ADMIN_PRIVATE_KEY="${privateKey}"`);
  console.log('');

  // Also create a backup in case user needs it
  const envContent = `
# Firebase Admin SDK (Server-side only)
FIREBASE_ADMIN_PROJECT_ID="${projectId}"
FIREBASE_ADMIN_CLIENT_EMAIL="${clientEmail}"
FIREBASE_ADMIN_PRIVATE_KEY="${privateKey}"
`;

  const backupFile = '.env.firebase-admin';
  fs.writeFileSync(backupFile, envContent.trim());
  console.log(`📝 Credentials also saved to: ${backupFile}`);
  console.log('   (You can copy from this file to .env.local)\n');

  // Security reminder
  console.log('⚠️  IMPORTANT SECURITY REMINDERS:');
  console.log('   1. Add firebase-admin-key.json to .gitignore');
  console.log('   2. Never commit service account keys to git');
  console.log('   3. Keep .env.local secure and private');
  console.log('   4. Verify .env.local is in .gitignore\n');

} catch (error) {
  console.error('❌ Error reading service account file:', error.message);
  process.exit(1);
}
