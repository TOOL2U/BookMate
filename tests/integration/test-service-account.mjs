/**
 * Test script to verify service account can create spreadsheets
 * Run with: node test-service-account.mjs
 */

import { google } from 'googleapis';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testServiceAccount() {
  console.log('🔧 Testing Service Account Spreadsheet Creation...\n');

  try {
    // Parse service account credentials
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.local');
    }

    const credentials = JSON.parse(serviceAccountKey);
    console.log('✅ Service Account Email:', credentials.client_email);
    console.log('✅ Project ID:', credentials.project_id);
    console.log('');

    // IMPORTANT: Fix escaped newlines in private key
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    // Create auth client
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    console.log('🔑 Authenticating...');
    await auth.authorize();
    console.log('✅ Authentication successful!\n');

    // Test 1: Create a simple spreadsheet
    console.log('📊 Test 1: Creating a simple spreadsheet...');
    const sheets = google.sheets({ version: 'v4', auth });
    
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Test Spreadsheet - ${new Date().toISOString()}`,
        },
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    console.log('✅ Spreadsheet created successfully!');
    console.log('   ID:', spreadsheetId);
    console.log('   URL:', spreadsheetUrl);
    console.log('');

    // Test 2: Try to read the template
    console.log('📋 Test 2: Reading master template...');
    const MASTER_TEMPLATE_ID = '1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8';
    
    try {
      const templateSpreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: MASTER_TEMPLATE_ID,
      });
      
      const templateSheets = templateSpreadsheet.data.sheets || [];
      console.log('✅ Template accessible!');
      console.log('   Title:', templateSpreadsheet.data.properties?.title);
      console.log('   Sheets:', templateSheets.length);
      console.log('');

      // Test 3: Try to copy a sheet from template
      console.log('📄 Test 3: Copying first sheet from template...');
      const firstSheet = templateSheets[0];
      if (firstSheet?.properties?.sheetId) {
        await sheets.spreadsheets.sheets.copyTo({
          spreadsheetId: MASTER_TEMPLATE_ID,
          sheetId: firstSheet.properties.sheetId,
          requestBody: {
            destinationSpreadsheetId: spreadsheetId,
          },
        });
        console.log('✅ Sheet copied successfully!');
        console.log('   Sheet name:', firstSheet.properties.title);
      }
    } catch (error) {
      console.log('❌ Cannot access template:', error.message);
      console.log('');
      console.log('⚠️  Make sure you shared the template with:');
      console.log('   ', credentials.client_email);
    }

    console.log('');
    console.log('🎉 Tests complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open the test spreadsheet:', spreadsheetUrl);
    console.log('2. Verify it was created by the service account');
    console.log('3. If template copy failed, share template with service account');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error details:');
    console.error('Code:', error.code);
    console.error('Status:', error.status);
    console.error('Details:', JSON.stringify(error.errors || error.response?.data, null, 2));
    console.error('');
    console.error('Common issues:');
    console.error('1. IAM permissions just added - wait 1-2 minutes for propagation');
    console.error('2. Google Sheets API not enabled in Google Cloud Console');
    console.error('3. Google Drive API not enabled in Google Cloud Console');
    console.error('4. Service account credentials incorrect');
    console.error('5. Service account not active');
    process.exit(1);
  }
}

testServiceAccount();
