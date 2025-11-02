#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkAllSheets() {
  console.log('\n📊 Checking ALL sheets in your spreadsheet...\n');

  const credentialsPath = path.join(__dirname, 'config', 'google-credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get spreadsheet metadata to see all sheets
  console.log('📋 Getting spreadsheet structure...\n');
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title,index,gridProperties))'
  });

  console.log('📑 Available sheets/tabs:');
  metadata.data.sheets.forEach((sheet, idx) => {
    const props = sheet.properties;
    console.log(`   ${idx + 1}. "${props.title}" (ID: ${props.sheetId}) - ${props.gridProperties.rowCount} rows x ${props.gridProperties.columnCount} cols`);
  });

  // Check the Data sheet in detail
  console.log('\n\n🔍 Detailed check of "Data" sheet dropdown ranges:\n');
  
  const ranges = [
    'Data!A1:A50',  // Get more context to see headers
  ];

  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges
  });

  const dataColumn = result.data.valueRanges[0].values || [];
  
  console.log('📊 Data sheet Column A (first 50 rows):');
  console.log('─'.repeat(60));
  
  dataColumn.forEach((row, idx) => {
    const rowNum = idx + 1;
    const value = row[0] || '';
    
    // Highlight important rows
    let marker = '   ';
    if (value.includes('TYPE OF OPERATION') || value.includes('PROPERTY') || value.includes('TYPE OF PAYMENT')) {
      marker = '📌 ';
    } else if (value.startsWith('Revenue') || value.startsWith('EXP')) {
      marker = '💰 ';
    } else if (value.includes('House') || value.includes('Personal') || value.includes('Family')) {
      marker = '🏠 ';
    } else if (value.includes('Bank') || value.includes('Cash')) {
      marker = '💳 ';
    }
    
    if (value) {
      console.log(`${marker}Row ${rowNum.toString().padStart(2)}: ${value}`);
    }
  });

  // Compare with local config
  console.log('\n\n🔄 Comparison with local config:\n');
  const liveDropdowns = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'live-dropdowns.json'), 'utf8'));
  
  console.log('Expected ranges from config:');
  console.log(`   Operations: ${liveDropdowns.ranges?.typeOfOperation || 'Not set'}`);
  console.log(`   Properties: ${liveDropdowns.ranges?.property || 'Not set'}`);
  console.log(`   Payments:   ${liveDropdowns.ranges?.typeOfPayment || 'Not set'}`);
  
  console.log('\nLocal config counts:');
  console.log(`   Properties: ${liveDropdowns.property?.length || 0}`);
  console.log(`   Operations: ${liveDropdowns.typeOfOperation?.length || 0}`);
  console.log(`   Payments:   ${liveDropdowns.typeOfPayment?.length || 0}`);
}

checkAllSheets().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
