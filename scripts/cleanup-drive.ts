/**
 * Clean up Service Account Drive
 * 
 * Lists and optionally deletes files from the service account's Drive
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupDrive() {
  try {
    const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('📋 Listing files in service account Drive...\n');

    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, size, createdTime, owners)',
    });

    const files = response.data.files;

    if (!files || files.length === 0) {
      console.log('No files found.');
      return;
    }

    console.log(`Found ${files.length} files:\n`);

    let totalSize = 0;
    const bookMateFiles: any[] = [];

    files.forEach((file, index) => {
      const size = parseInt(file.size || '0');
      totalSize += size;
      const sizeInMB = (size / (1024 * 1024)).toFixed(2);
      const isBookMate = file.name?.includes('BookMate');
      
      if (isBookMate) {
        bookMateFiles.push(file);
      }

      console.log(`${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Created: ${file.createdTime}`);
      console.log(`   ${isBookMate ? '⚠️  BookMate file' : ''}\n`);
    });

    console.log(`\nTotal storage used: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`BookMate files: ${bookMateFiles.length}`);

    if (bookMateFiles.length > 0) {
      console.log('\n🗑️  Deleting BookMate test files...\n');
      
      for (const file of bookMateFiles) {
        try {
          await drive.files.delete({
            fileId: file.id!,
          });
          console.log(`✅ Deleted: ${file.name} (${file.id})`);
        } catch (error) {
          console.error(`❌ Could not delete ${file.name}:`, error);
        }
      }
      
      console.log(`\n✅ Cleanup complete! Deleted ${bookMateFiles.length} files.`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDrive();
