#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function updateRanges() {
  console.log('\n🔧 Updating ranges based on your new spreadsheet structure...\n');

  const credentialsPath = path.join(__dirname, 'config', 'google-credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Exact ranges based on actual row numbers (EXCLUDE header rows)
  // Row 3: "REVENUES" header → SKIP
  // Rows 4-7: Revenue data → INCLUDE
  // Row 9: "OVERHEAD EXPENSES" header → SKIP
  // Rows 10-37: Overhead data → INCLUDE
  // Row 39: "PROPERTY" header → SKIP  
  // Rows 40-46: Property data → INCLUDE
  // Row 48: "TYPE OF PAYMENT" header → SKIP
  // Rows 49-52: Payment data → INCLUDE
  // Row 56: "MONTHS" header → SKIP (need to check this)
  // Rows 57+: Month data → INCLUDE
  const newRanges = {
    revenues: 'Data!A4:A7',           // Rows 4-7 (4 revenue items, skip row 3 header)
    overheadExpenses: 'Data!A10:A37', // Rows 10-37 (28 overhead items, skip row 9 header)
    property: 'Data!A40:A46',         // Rows 40-46 (7 property items, skip row 39 header)
    typeOfPayment: 'Data!A49:A52',    // Rows 49-52 (4 payment items, skip row 48 header)
    months: 'Data!A56:A67'            // Rows 56-67 (12 months: Jan-Dec, skip row 55 header)
  };

  console.log('📊 Fetching data from new ranges:\n');
  
  const result = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: Object.values(newRanges)
  });

  const rangeKeys = Object.keys(newRanges);
  const data = {};
  
  result.data.valueRanges.forEach((vr, idx) => {
    const key = rangeKeys[idx];
    // Just filter out empty cells, don't try to detect headers
    // The ranges are already set to exclude header rows
    const items = vr.values?.map(r => r[0]).filter(Boolean) || [];
    data[key] = items;
    
    console.log(`✅ ${key.padEnd(20)} ${newRanges[key].padEnd(20)} → ${items.length} items`);
    if (items.length > 0 && items.length <= 5) {
      console.log(`   All: ${items.join(', ')}`);
    } else if (items.length > 0) {
      console.log(`   First 3: ${items.slice(0, 3).join(', ')}`);
      console.log(`   Last 3:  ${items.slice(-3).join(', ')}`);
    }
    console.log('');
  });

  // Combine revenues and overhead expenses into typeOfOperation
  const typeOfOperation = [...data.revenues, ...data.overheadExpenses];
  
  console.log('\n📝 Creating updated config:\n');
  console.log(`   Properties:      ${data.property.length} items`);
  console.log(`   Operations:      ${typeOfOperation.length} items (${data.revenues.length} revenues + ${data.overheadExpenses.length} overhead)`);
  console.log(`   Payments:        ${data.typeOfPayment.length} items`);
  console.log(`   Months:          ${data.months.length} items`);

  // Update live-dropdowns.json
  const configPath = path.join(__dirname, 'config', 'live-dropdowns.json');
  const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const updatedConfig = {
    ...currentConfig,
    property: data.property,
    typeOfOperation: typeOfOperation,
    typeOfPayment: data.typeOfPayment,
    month: data.months,
    ranges: {
      property: newRanges.property,
      typeOfOperation: `${newRanges.revenues},${newRanges.overheadExpenses}`, // Combined range
      typeOfPayment: newRanges.typeOfPayment,
      month: newRanges.months
    },
    source: 'synced_from_sheets_new_structure',
    fetchedAt: new Date().toISOString(),
    lastSyncedFromSheets: new Date().toISOString()
  };

  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
  console.log('\n✅ Updated config/live-dropdowns.json');

  // Also update options.json
  const optionsPath = path.join(__dirname, 'config', 'options.json');
  const optionsConfig = {
    properties: data.property,
    typeOfOperation: typeOfOperation,
    typeOfPayment: data.typeOfPayment,
    month: data.months,
    keywords: currentConfig.keywords || {},
    fetchedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(optionsPath, JSON.stringify(optionsConfig, null, 2));
  console.log('✅ Updated config/options.json');
  
  console.log('\n🎉 Sync complete! Your local config now matches the spreadsheet structure.\n');
}

updateRanges().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
