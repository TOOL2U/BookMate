#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function checkRow80() {
  console.log('\n🔍 Checking Row 80 (Monthly Expenses)...\n');

  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get the formulas in row 80
  const formulas = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A80:Q80",
    valueRenderOption: 'FORMULA'
  });

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A80:Q80",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  console.log('📊 Row 80 Analysis:\n');
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  
  formulas.data.values?.[0]?.forEach((formula, idx) => {
    const value = values.data.values?.[0]?.[idx];
    if (formula || value) {
      console.log(`${cols[idx]}80:`);
      if (formula) console.log(`   Formula: ${formula}`);
      if (value !== undefined) console.log(`   Value: ${value}`);
      console.log('');
    }
  });

  // Check what row 59 and 21 are (Total Overhead and Property/Person)
  console.log('\n📋 Related rows:\n');
  
  const row59 = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A59:Q59",
    valueRenderOption: 'FORMULA'
  });
  
  const row21 = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A21:Q21",
    valueRenderOption: 'FORMULA'
  });

  console.log('Row 59 (Total Overhead) O59:');
  console.log(`   ${row59.data.values?.[0]?.[14] || '(empty)'}`);
  
  console.log('\nRow 59 (Total Overhead) Q59:');
  console.log(`   ${row59.data.values?.[0]?.[16] || '(empty)'}`);
  
  console.log('\nRow 21 (Property/Person) O21:');
  console.log(`   ${row21.data.values?.[0]?.[14] || '(empty)'}`);
  
  console.log('\nRow 21 (Property/Person) Q21:');
  console.log(`   ${row21.data.values?.[0]?.[16] || '(empty)'}`);

  // Get named ranges
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'namedRanges'
  });

  console.log('\n\n📌 Named Ranges for Overheads:\n');
  const namedRanges = spreadsheet.data.namedRanges || [];
  namedRanges
    .filter(nr => nr.name.toLowerCase().includes('overhead'))
    .forEach(nr => {
      const range = nr.range;
      console.log(`${nr.name}:`);
      console.log(`   Sheet ID: ${range.sheetId}`);
      console.log(`   Rows: ${range.startRowIndex + 1}-${range.endRowIndex}`);
      console.log(`   Cols: ${String.fromCharCode(65 + range.startColumnIndex)}-${String.fromCharCode(65 + range.endColumnIndex - 1)}`);
      console.log('');
    });
}

checkRow80().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
