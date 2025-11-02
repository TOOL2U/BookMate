#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function checkRow31() {
  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get row 31 columns E-P (months)
  const row31 = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A31:P31",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  // Get row 15 for comparison
  const row15 = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A15:P15",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  console.log('\n=== ROW 31 (EXP - Utilities - Gas) ===');
  console.log('Label (A31):', row31.data.values?.[0]?.[0]);
  const cols = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];
  row31.data.values?.[0]?.forEach((val, idx) => {
    if (typeof val === 'number' && val !== 0) {
      console.log(`  ${cols[idx]}31: ${val}`);
    }
  });

  console.log('\n=== ROW 15 (Alesia House - Property/Person) ===');
  console.log('Label (A15):', row15.data.values?.[0]?.[0]);
  row15.data.values?.[0]?.forEach((val, idx) => {
    if (typeof val === 'number' && val !== 0) {
      console.log(`  ${cols[idx]}15: ${val}`);
    }
  });

  console.log('\n🔍 CONCLUSION:');
  console.log('If row 31 has expense values, those are being summed into Q31 (50,000).');
  console.log('The formula in Q80 =SUM(Q31:Q58) is correctly summing overhead rows.');
  console.log('If you see the same expense in both rows, it means data was entered in both places.');
}

checkRow31().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
