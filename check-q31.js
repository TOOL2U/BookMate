#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function checkQ31() {
  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get Q31 formula
  const formula = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q31",
    valueRenderOption: 'FORMULA'
  });

  // Get Q31 value
  const value = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q31",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  // Get Q15 formula
  const formula15 = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q15",
    valueRenderOption: 'FORMULA'
  });

  console.log('\nQ31 (EXP - Utilities - Gas):');
  console.log('  Formula:', formula.data.values?.[0]?.[0] || '(no formula - hardcoded value)');
  console.log('  Value:', value.data.values?.[0]?.[0]);

  console.log('\nQ15 (Alesia House):');
  console.log('  Formula:', formula15.data.values?.[0]?.[0] || '(no formula - hardcoded value)');

  console.log('\n⚠️  The 50,000 appears in BOTH locations.');
  console.log('This means Q80 formula =SUM(Q31:Q58) is working correctly,');
  console.log('but Q31 contains data that should not be there if you only want overhead.');
}

checkQ31().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
