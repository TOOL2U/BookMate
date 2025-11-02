#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function clearQ59() {
  console.log('\nClearing Q59 and O59 to fix #REF! error...\n');

  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Clear Q59 and O59
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!O59:Q59"
  });

  console.log('Cleared O59:Q59');
  
  // Check Q80 value now
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q80",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });
  
  console.log('\nQ80 value after clearing Q59:', result.data.values?.[0]?.[0]);
}

clearQ59().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
