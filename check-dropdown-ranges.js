#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDropdowns() {
  console.log('\n🔍 Checking dropdown ranges in Google Sheets...\n');

  // Setup auth
  const credentialsPath = path.join(__dirname, 'config', 'google-credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get the ranges we expect
  const ranges = [
    'Data!A4:A36',   // Type of Operation
    'Data!A38:A44',  // Properties
    'Data!A46:A49'   // Type of Payment
  ];

  console.log('📊 Fetching data from ranges:');
  ranges.forEach(r => console.log(`   - ${r}`));
  console.log('');

  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges
  });

  console.log('✅ Results:\n');
  
  result.data.valueRanges.forEach((vr, idx) => {
    const rangeName = ranges[idx];
    const count = vr.values?.length || 0;
    const items = vr.values?.map(r => r[0]).filter(Boolean) || [];
    
    console.log(`📌 ${rangeName}`);
    console.log(`   Count: ${count} items`);
    if (count > 0) {
      console.log(`   First 3: ${items.slice(0, 3).join(', ')}`);
      console.log(`   Last 3: ${items.slice(-3).join(', ')}`);
    } else {
      console.log(`   ⚠️  EMPTY!`);
    }
    console.log('');
  });

  // Also check what the sync script expects
  console.log('🔍 Checking what local config expects:\n');
  const liveDropdowns = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'live-dropdowns.json'), 'utf8'));
  
  console.log(`📁 Local config (live-dropdowns.json):`);
  console.log(`   Properties: ${liveDropdowns.property?.length || 0}`);
  console.log(`   Operations: ${liveDropdowns.typeOfOperation?.length || 0}`);
  console.log(`   Payments: ${liveDropdowns.typeOfPayment?.length || 0}`);
  console.log(`   Ranges: ${JSON.stringify(liveDropdowns.ranges, null, 2)}`);
}

checkDropdowns().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
