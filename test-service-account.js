#!/usr/bin/env node

/**
 * Test Google Service Account Access
 * Tests if the service account credentials work locally
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function testServiceAccount() {
  console.log('========================================');
  console.log('  Testing Google Service Account');
  console.log('========================================\n');

  // Method 1: From file path (local development)
  console.log('1️⃣  Testing file path method...');
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log('   Credential path:', credPath);
  
  if (!credPath) {
    console.log('   ❌ GOOGLE_APPLICATION_CREDENTIALS not set\n');
  } else if (!fs.existsSync(credPath)) {
    console.log('   ❌ File not found:', credPath, '\n');
  } else {
    console.log('   ✅ File exists');
    
    try {
      const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      console.log('   ✅ File is valid JSON');
      console.log('   Service account:', credentials.client_email);
      console.log('   Project ID:', credentials.project_id);
      
      // Test authentication
      console.log('\n   Testing authentication...');
      const auth = new google.auth.GoogleAuth({
        keyFile: credPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      const client = await auth.getClient();
      console.log('   ✅ Authentication successful!');
      
      // Test accessing the sheet
      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      
      console.log('\n   Testing sheet access...');
      console.log('   Sheet ID:', spreadsheetId);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'P&L'!A1:B1",
      });
      
      console.log('   ✅ Sheet access successful!');
      console.log('   Sample data:', response.data.values);
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }

  // Method 2: From environment variable (Vercel/production)
  console.log('\n2️⃣  Testing environment variable method (production style)...');
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.log('   ⚠️  GOOGLE_SERVICE_ACCOUNT_KEY not set (normal for local dev)');
  } else {
    try {
      const credentials = JSON.parse(serviceAccountKey);
      console.log('   ✅ GOOGLE_SERVICE_ACCOUNT_KEY is valid JSON');
      console.log('   Service account:', credentials.client_email);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      const client = await auth.getClient();
      console.log('   ✅ Authentication successful with env var!');
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }

  // Method 3: Base64 encoded (Vercel style)
  console.log('\n3️⃣  Testing base64 encoded method (Vercel style)...');
  if (credPath && fs.existsSync(credPath)) {
    try {
      const fileContent = fs.readFileSync(credPath, 'utf8');
      const base64Encoded = Buffer.from(fileContent).toString('base64');
      
      console.log('   Base64 length:', base64Encoded.length, 'characters');
      console.log('   First 50 chars:', base64Encoded.substring(0, 50) + '...');
      
      // Decode and test
      const decoded = Buffer.from(base64Encoded, 'base64').toString('utf8');
      const credentials = JSON.parse(decoded);
      
      console.log('   ✅ Base64 encode/decode successful');
      console.log('   Service account:', credentials.client_email);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      const client = await auth.getClient();
      console.log('   ✅ Authentication successful with base64!');
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

testServiceAccount().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
