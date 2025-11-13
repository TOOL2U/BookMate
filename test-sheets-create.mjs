/**
 * Alternative: Use makeCopy from Sheets API instead of Drive API
 * This might handle ownership differently
 */

import { google } from 'googleapis';
import { config } from 'dotenv';

config({ path: '.env.local' });

const TEMPLATE_ID = '1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8';

async function testSheetsCopy() {
  console.log('🧪 Testing Copy via Sheets API (not Drive API)\n');

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey);
    
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    await auth.authorize();
    console.log('✅ Authentication successful\n');

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Try copying individual sheets instead of the whole file
    console.log('📋 Creating new blank spreadsheet...');
    const newSheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `TEST - Manual Copy ${new Date().toISOString()}`,
        },
      },
    });

    console.log('✅ New spreadsheet created:', newSheet.data.spreadsheetId);
    console.log('   This proves the service account CAN create new spreadsheets!');
    console.log('   The issue is with COPYING existing files.');
    console.log('');
    console.log('💡 Solution: We need to use YOUR OAuth token to create files,');
    console.log('   not the service account token.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

testSheetsCopy();
