import { google } from 'googleapis';
import { config } from 'dotenv';

config({ path: '.env.local' });

const TEMPLATE_ID = '1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU'; // NEW template in Shared Drive
const SHARED_DRIVE_ID = process.env.BOOKMATE_SHARED_DRIVE_ID;

async function testTemplateCopy() {
  console.log('🧪 Testing Template Copy via Drive API (WITH Shared Drive)\n');

  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey);
    
    // Fix escaped newlines
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    console.log('Service Account:', credentials.client_email);
    console.log('Template ID:', TEMPLATE_ID);
    console.log('Shared Drive ID:', SHARED_DRIVE_ID || '❌ NOT SET');
    console.log('');

    if (!SHARED_DRIVE_ID) {
      console.error('❌ BOOKMATE_SHARED_DRIVE_ID is not set in .env.local');
      console.error('');
      console.error('Please ask PM to:');
      console.error('1. Add service account to Shared Drive');
      console.error('2. Provide the Shared Drive ID');
      console.error('3. Add it to .env.local as BOOKMATE_SHARED_DRIVE_ID');
      console.error('');
      console.error('See: SHARED_DRIVE_SETUP_REQUIRED.md');
      process.exit(1);
    }

    // Create auth with Drive API scope
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

    // Get Drive API
    const drive = google.drive({ version: 'v3', auth });

    // Verify authenticated account
    const about = await drive.about.get({ fields: 'user(emailAddress)' });
    console.log('✅ Authenticated as:', about.data.user?.emailAddress);
    console.log('');

    // Test: Copy the template INTO the Shared Drive
    console.log('📋 Attempting to copy template INTO Shared Drive...');
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_ID,
      requestBody: {
        name: `TEST COPY - BookMate P&L – ${new Date().toISOString()}`,
        parents: [SHARED_DRIVE_ID], // Place in Shared Drive
      },
      supportsAllDrives: true, // Required!
      fields: 'id, name, webViewLink, owners',
    });

    console.log('');
    console.log('🎉 SUCCESS! Template copied to Shared Drive!');
    console.log('');
    console.log('📋 New Spreadsheet Details:');
    console.log('   ID:', copyResponse.data.id);
    console.log('   Name:', copyResponse.data.name);
    console.log('   URL:', copyResponse.data.webViewLink);
    console.log('   Owner:', copyResponse.data.owners?.[0]?.emailAddress);
    console.log('');
    console.log('✅ The service account CAN copy the template!');
    console.log('✅ Automatic user spreadsheet creation will work!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Add BOOKMATE_SHARED_DRIVE_ID to Vercel production');
    console.log('   2. Deploy to production');
    console.log('   3. Test user registration');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
      console.error('   Status:', error.status);
      if (error.errors) {
        console.error('   Details:', JSON.stringify(error.errors, null, 2));
      }
    }
    console.error('');
    console.error('Common issues:');
    console.error('1. Service account not added to Shared Drive');
    console.error('2. Template not in the Shared Drive');
    console.error('3. Wrong Shared Drive ID');
    console.error('4. Service account role too limited (needs Manager or Content Manager)');
  }
}

testTemplateCopy();
