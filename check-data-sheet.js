#!/usr/bin/env node

/**
 * Quick script to check what's in the Data sheet Column B
 */

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function checkDataSheet() {
  try {
    console.log('🔍 Checking Data sheet Column B...\n');

    // Load credentials
    let credentials;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      console.log('✅ Using GOOGLE_SERVICE_ACCOUNT_KEY from environment');
      credentials = JSON.parse(serviceAccountKey);
    } else {
      const credPath = path.join(__dirname, 'config', 'google-credentials.json');
      if (fs.existsSync(credPath)) {
        console.log('✅ Using config/google-credentials.json');
        credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      } else {
        throw new Error('No credentials found');
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not found in environment');
    }

    console.log(`📊 Spreadsheet ID: ${spreadsheetId}\n`);

    // Read Data!B:B (all of column B)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!B:B',
    });

    const values = response.data.values || [];
    
    console.log('📋 Column B contents:');
    console.log('====================\n');

    if (values.length === 0) {
      console.log('❌ Column B is completely empty\n');
    } else {
      values.forEach((row, index) => {
        const rowNum = index + 1;
        const value = row[0] || '(empty)';
        console.log(`Row ${rowNum.toString().padStart(3)}: ${value}`);
      });
      
      console.log(`\n📊 Total rows: ${values.length}`);
      
      // Check specifically from B2 onwards (where our API reads)
      const dataRows = values.slice(1); // Skip row 1 (header)
      const nonEmpty = dataRows.filter(row => row[0] && row[0].trim());
      
      console.log(`\n🔍 Analysis:`);
      console.log(`   Row 1 (B1): ${values[0]?.[0] || '(empty)'}`);
      console.log(`   Rows from B2 onwards: ${dataRows.length}`);
      console.log(`   Non-empty rows from B2: ${nonEmpty.length}`);
      
      if (nonEmpty.length > 0) {
        console.log(`\n✅ Expense categories found (B2 onwards):`);
        nonEmpty.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row[0].trim()}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkDataSheet();
