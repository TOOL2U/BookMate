/**
 * List all Shared Drives accessible to the service account
 */

import { google } from 'googleapis';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function listSharedDrives() {
  console.log('📁 Listing Shared Drives accessible to service account\n');

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey);
    
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    await auth.authorize();
    console.log('✅ Authenticated as:', credentials.client_email);
    console.log('');

    const drive = google.drive({ version: 'v3', auth });

    // List Shared Drives (Team Drives)
    const response = await drive.drives.list({
      pageSize: 50,
      fields: 'drives(id, name, createdTime)',
    });

    const drives = response.data.drives || [];

    if (drives.length === 0) {
      console.log('❌ No Shared Drives found.');
      console.log('');
      console.log('Please ask the PM to:');
      console.log('1. Create a Shared Drive at: https://drive.google.com');
      console.log('2. Add the service account as a member:');
      console.log('   ' + credentials.client_email);
      console.log('3. Give it "Manager" or "Content Manager" role');
      return;
    }

    console.log(`Found ${drives.length} Shared Drive(s):\n`);

    drives.forEach((drive, i) => {
      console.log(`${i + 1}. ${drive.name}`);
      console.log(`   ID: ${drive.id}`);
      console.log(`   Created: ${drive.createdTime}`);
      console.log('');
    });

    console.log('✅ Add this to your .env.local:');
    console.log('');
    console.log(`BOOKMATE_SHARED_DRIVE_ID=${drives[0].id}`);
    console.log('');
    console.log('If you have multiple Shared Drives, use the ID of the one');
    console.log('containing the BookMate template spreadsheet.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

listSharedDrives();
