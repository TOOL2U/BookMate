#!/usr/bin/env node

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function cleanupDrive() {
  try {
    // Load credentials
    const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Initialize Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('📋 Listing files in service account Drive...\n');

    // List all files
    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, createdTime, size, owners)',
      orderBy: 'createdTime desc'
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      console.log('✅ No files found in Drive');
      return;
    }

    console.log(`Found ${files.length} files:\n`);

    let totalSize = 0;
    files.forEach((file, index) => {
      const size = parseInt(file.size || 0);
      totalSize += size;
      const sizeStr = size > 0 ? `${(size / 1024 / 1024).toFixed(2)} MB` : 'N/A';
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log(`   Size: ${sizeStr}`);
      console.log(`   Created: ${file.createdTime}`);
      console.log('');
    });

    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n🗑️  Deleting all files...\n');

    // Delete each file
    let deleted = 0;
    for (const file of files) {
      try {
        await drive.files.delete({ fileId: file.id });
        console.log(`✅ Deleted: ${file.name} (${file.id})`);
        deleted++;
      } catch (error) {
        console.error(`❌ Failed to delete ${file.name}:`, error.message);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deleted} of ${files.length} files`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

cleanupDrive();
