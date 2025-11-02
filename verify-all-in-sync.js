#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function verifySync() {
  console.log('\n🔍 Verifying all files are in sync...\n');
  console.log('='.repeat(70));

  // 1. Check local config files
  console.log('\n📁 LOCAL CONFIG FILES:\n');
  
  const liveDropdowns = JSON.parse(fs.readFileSync('config/live-dropdowns.json', 'utf8'));
  const options = JSON.parse(fs.readFileSync('config/options.json', 'utf8'));
  
  console.log('config/live-dropdowns.json:');
  console.log(`   Properties:  ${liveDropdowns.property?.length || 0}`);
  console.log(`   Operations:  ${liveDropdowns.typeOfOperation?.length || 0}`);
  console.log(`   Payments:    ${liveDropdowns.typeOfPayment?.length || 0}`);
  console.log(`   Months:      ${liveDropdowns.month?.length || 0}`);
  console.log(`   Source:      ${liveDropdowns.source}`);
  console.log(`   Updated:     ${liveDropdowns.fetchedAt}`);
  
  console.log('\nconfig/options.json:');
  console.log(`   Properties:  ${options.properties?.length || 0}`);
  console.log(`   Operations:  ${options.typeOfOperation?.length || 0}`);
  console.log(`   Payments:    ${options.typeOfPayment?.length || 0}`);
  console.log(`   Months:      ${options.month?.length || 0}`);
  console.log(`   Updated:     ${options.fetchedAt}`);

  // 2. Check Google Sheets
  console.log('\n\n☁️  GOOGLE SHEETS:\n');
  
  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Use the ranges from live-dropdowns config
  const ranges = [
    'Data!A3:A7',      // Revenues (adjusted to include row 7)
    'Data!A9:A37',     // Overhead
    'Data!A40:A46',    // Properties (adjusted to include row 46)
    'Data!A48:A52',    // Payments (adjusted to include rows 48-52)
    'Data!A56:A67'     // Months
  ];

  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges
  });

  const filterHeaders = (items) => items.filter(item => 
    item && 
    item !== item.toUpperCase() || 
    item.startsWith('Revenue') || 
    item.startsWith('EXP') ||
    item.match(/^[A-Z][a-z]/) ||
    item.includes('-') ||
    item.includes('Bank') ||
    item.includes('Cash')
  );

  const sheetsRevenues = filterHeaders(result.data.valueRanges[0].values?.map(r => r[0]) || []);
  const sheetsOverhead = filterHeaders(result.data.valueRanges[1].values?.map(r => r[0]) || []);
  const sheetsOperations = [...sheetsRevenues, ...sheetsOverhead];
  const sheetsProperties = filterHeaders(result.data.valueRanges[2].values?.map(r => r[0]) || []);
  const sheetsPayments = filterHeaders(result.data.valueRanges[3].values?.map(r => r[0]) || []);
  const sheetsMonths = filterHeaders(result.data.valueRanges[4].values?.map(r => r[0]) || []);

  console.log('Google Sheets Data tab:');
  console.log(`   Properties:  ${sheetsProperties.length}`);
  console.log(`   Operations:  ${sheetsOperations.length} (${sheetsRevenues.length} revenues + ${sheetsOverhead.length} overhead)`);
  console.log(`   Payments:    ${sheetsPayments.length}`);
  console.log(`   Months:      ${sheetsMonths.length}`);

  // 3. Compare all sources
  console.log('\n\n📊 COMPARISON:\n');
  console.log('='.repeat(70));
  
  const createComparison = (name, live, opts, gsheets) => {
    const allMatch = live === opts && opts === gsheets;
    const status = allMatch ? '✅' : '⚠️ ';
    console.log(`${status} ${name.padEnd(15)} Live: ${live.toString().padStart(2)}  Options: ${opts.toString().padStart(2)}  Sheets: ${gsheets.toString().padStart(2)}`);
    return allMatch;
  };

  const propsMatch = createComparison('Properties', 
    liveDropdowns.property?.length || 0, 
    options.properties?.length || 0, 
    sheetsProperties.length
  );

  const opsMatch = createComparison('Operations', 
    liveDropdowns.typeOfOperation?.length || 0, 
    options.typeOfOperation?.length || 0, 
    sheetsOperations.length
  );

  const payMatch = createComparison('Payments', 
    liveDropdowns.typeOfPayment?.length || 0, 
    options.typeOfPayment?.length || 0, 
    sheetsPayments.length
  );

  const monthMatch = createComparison('Months', 
    liveDropdowns.month?.length || 0, 
    options.month?.length || 0, 
    sheetsMonths.length
  );

  console.log('='.repeat(70));

  if (propsMatch && opsMatch && payMatch && monthMatch) {
    console.log('\n✅ ALL FILES ARE IN SYNC! 🎉\n');
  } else {
    console.log('\n⚠️  FILES ARE OUT OF SYNC!\n');
    
    if (!propsMatch) console.log('   ⚠️  Properties counts don\'t match');
    if (!opsMatch) console.log('   ⚠️  Operations counts don\'t match');
    if (!payMatch) console.log('   ⚠️  Payments counts don\'t match');
    if (!monthMatch) console.log('   ⚠️  Months counts don\'t match');
    
    console.log('\n💡 Run: node update-ranges-from-sheets.js to sync\n');
  }

  // 4. Show sample data to verify content
  console.log('\n📝 SAMPLE DATA:\n');
  console.log('Properties (first 3):');
  console.log(`   Local:  ${liveDropdowns.property?.slice(0, 3).join(', ')}`);
  console.log(`   Sheets: ${sheetsProperties.slice(0, 3).join(', ')}`);
  
  console.log('\nOperations (first 3):');
  console.log(`   Local:  ${liveDropdowns.typeOfOperation?.slice(0, 3).join(', ')}`);
  console.log(`   Sheets: ${sheetsOperations.slice(0, 3).join(', ')}`);
  
  console.log('\nPayments (all):');
  console.log(`   Local:  ${liveDropdowns.typeOfPayment?.join(', ')}`);
  console.log(`   Sheets: ${sheetsPayments.join(', ')}`);
  
  console.log('\n');
}

verifySync().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
