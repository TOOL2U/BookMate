/**
 * Share Master Template with Service Account
 * 
 * This script grants the service account Editor access to the master template spreadsheet
 * so it can create copies for new users.
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const MASTER_TEMPLATE_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
const SERVICE_ACCOUNT_EMAIL = 'accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com';

async function shareMasterTemplate() {
  try {
    // Load credentials
    const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Google credentials not found at ' + credentialsPath);
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('🔓 Granting service account access to master template...');
    console.log(`   Template ID: ${MASTER_TEMPLATE_ID}`);
    console.log(`   Service Account: ${SERVICE_ACCOUNT_EMAIL}`);

    // Grant editor permission to the service account
    await drive.permissions.create({
      fileId: MASTER_TEMPLATE_ID,
      requestBody: {
        type: 'user',
        role: 'writer', // Editor access
        emailAddress: SERVICE_ACCOUNT_EMAIL,
      },
      sendNotificationEmail: false,
    });

    console.log('✅ Service account granted Editor access to master template');
    console.log('   The spreadsheet provisioning service can now create copies for new users.');
    
  } catch (error: any) {
    console.error('❌ Error sharing master template:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

shareMasterTemplate();
