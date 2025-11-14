/**
 * List files owned by service account to see storage usage
 */

import { google } from 'googleapis';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function listServiceAccountFiles() {
  console.log('📁 Listing Service Account Drive Files\n');

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
    const drive = google.drive({ version: 'v3', auth });

    // Get storage quota
    const about = await drive.about.get({ 
      fields: 'storageQuota, user' 
    });
    
    console.log('📊 Storage Quota:');
    console.log('   Limit:', (about.data.storageQuota?.limit || 0) / (1024*1024*1024), 'GB');
    console.log('   Used:', (about.data.storageQuota?.usage || 0) / (1024*1024*1024), 'GB');
    console.log('   Usage in Drive:', (about.data.storageQuota?.usageInDrive || 0) / (1024*1024*1024), 'GB');
    console.log('');

    // List all files
    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, size, createdTime, trashed)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];
    const activeFiles = files.filter(f => !f.trashed);
    const trashedFiles = files.filter(f => f.trashed);

    console.log(`📁 Total files: ${files.length}`);
    console.log(`   Active: ${activeFiles.length}`);
    console.log(`   Trashed: ${trashedFiles.length}`);
    console.log('');

    console.log('Recent files:');
    activeFiles.slice(0, 20).forEach((file, i) => {
      const size = file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'N/A';
      console.log(`${i + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log(`   Size: ${size}`);
      console.log(`   Created: ${file.createdTime}`);
      console.log('');
    });

    if (trashedFiles.length > 0) {
      console.log('');
      console.log('⚠️  You have', trashedFiles.length, 'trashed files that can be permanently deleted to free up space.');
      console.log('   Run: node cleanup-service-account-trash.mjs');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listServiceAccountFiles();
