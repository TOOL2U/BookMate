#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function revertOverheadRanges() {
  console.log('\n🔧 Reverting named ranges back to Q80...\n');

  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get current spreadsheet info
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'namedRanges,sheets(properties(title,sheetId))'
  });

  // Find P&L sheet
  const pnlSheet = spreadsheet.data.sheets.find(s => 
    s.properties.title.includes('P&L') && s.properties.title.includes('DO NOT EDIT')
  );

  if (!pnlSheet) {
    console.error('ERROR: Could not find P&L sheet');
    return;
  }

  const sheetId = pnlSheet.properties.sheetId;
  console.log('P&L Sheet ID:', sheetId);

  // Find the overhead named ranges
  const namedRanges = spreadsheet.data.namedRanges || [];
  const monthOverhead = namedRanges.find(nr => nr.name === 'Month_Total_Overheads');
  const yearOverhead = namedRanges.find(nr => nr.name === 'Year_Total_Overheads');

  console.log('\nCurrent named ranges:');
  if (monthOverhead) {
    console.log('  Month_Total_Overheads: Row', monthOverhead.range.startRowIndex + 1);
  }
  if (yearOverhead) {
    console.log('  Year_Total_Overheads: Row', yearOverhead.range.startRowIndex + 1);
  }

  // Update named ranges back to row 80
  console.log('\nReverting named ranges to row 80...');

  const requests = [];

  if (monthOverhead) {
    requests.push({
      updateNamedRange: {
        namedRange: {
          namedRangeId: monthOverhead.namedRangeId,
          name: 'Month_Total_Overheads',
          range: {
            sheetId: sheetId,
            startRowIndex: 79,  // Row 80 (0-indexed)
            endRowIndex: 80,
            startColumnIndex: 14,  // Column O
            endColumnIndex: 15
          }
        },
        fields: 'range'
      }
    });
  }

  if (yearOverhead) {
    requests.push({
      updateNamedRange: {
        namedRange: {
          namedRangeId: yearOverhead.namedRangeId,
          name: 'Year_Total_Overheads',
          range: {
            sheetId: sheetId,
            startRowIndex: 79,  // Row 80 (0-indexed)
            endRowIndex: 80,
            startColumnIndex: 16,  // Column Q
            endColumnIndex: 17
          }
        },
        fields: 'range'
      }
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });

    console.log('  Reverted named ranges to row 80');
  }

  console.log('\n=== REVERTED ===');
  console.log('Named ranges back at row 80:');
  console.log('  Month_Total_Overheads: O80');
  console.log('  Year_Total_Overheads: Q80');
}

revertOverheadRanges().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
