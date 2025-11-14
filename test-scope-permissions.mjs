/**
 * Alternative test: Create spreadsheet without needing special permissions
 * This will create a spreadsheet owned by the service account itself
 */

import { google } from 'googleapis';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function testBasicPermissions() {
  console.log('🧪 Testing Basic Service Account Permissions\n');

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey);
    
    // Fix escaped newlines
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    console.log('Service Account:', credentials.client_email);
    console.log('Project:', credentials.project_id);
    console.log('');

    // Try with minimal scope first
    console.log('📝 Test 1: Authenticating with READONLY scope...');
    const authReadonly = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    await authReadonly.authorize();
    console.log('✅ Readonly authentication successful');
    console.log('');

    // Try with write scope
    console.log('📝 Test 2: Authenticating with WRITE scope...');
    const authWrite = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await authWrite.authorize();
    console.log('✅ Write authentication successful');
    console.log('');

    // Try Drive API
    console.log('📝 Test 3: Authenticating with Drive API...');
    const authDrive = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    await authDrive.authorize();
    console.log('✅ Drive authentication successful');
    console.log('');

    // Now try to create a spreadsheet with drive.file scope (limited permission)
    console.log('📝 Test 4: Creating spreadsheet with drive.file scope...');
    const sheets = google.sheets({ version: 'v4', auth: authDrive });
    
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `TEST - Service Account Test ${new Date().toISOString()}`,
        },
      },
    });

    console.log('✅ SUCCESS! Spreadsheet created!');
    console.log('   ID:', response.data.spreadsheetId);
    console.log('   URL:', `https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}/edit`);
    console.log('');
    console.log('🎉 The service account CAN create spreadsheets!');
    console.log('   The issue was using the wrong scope.');
    console.log('');
    console.log('✅ Solution: Use "drive.file" scope instead of "drive" scope');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
      console.error('   Status:', error.status);
    }
  }
}

testBasicPermissions();
