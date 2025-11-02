#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function fixOverheadRanges() {
  console.log('\n🔧 Fixing Total Overhead named ranges...\n');

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
    console.log('  Month_Total_Overheads: Row', monthOverhead.range.startRowIndex + 1, '(currently O80)');
  }
  if (yearOverhead) {
    console.log('  Year_Total_Overheads: Row', yearOverhead.range.startRowIndex + 1, '(currently Q80)');
  }

  // First, add formulas to row 59
  console.log('\nStep 1: Adding formulas to row 59...');
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!O59",
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['=SUM(O31:O58)']]
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q59",
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['=SUM(Q31:Q58)']]
    }
  });

  console.log('  Added SUM formulas to O59 and Q59');

  // Update named ranges to point to row 59
  console.log('\nStep 2: Updating named ranges to row 59...');

  const requests = [];

  if (monthOverhead) {
    requests.push({
      updateNamedRange: {
        namedRange: {
          namedRangeId: monthOverhead.namedRangeId,
          name: 'Month_Total_Overheads',
          range: {
            sheetId: sheetId,
            startRowIndex: 58,  // Row 59
            endRowIndex: 59,
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
            startRowIndex: 58,  // Row 59
            endRowIndex: 59,
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

    console.log('  Updated named ranges');
  }

  console.log('\n=== FIXED ===');
  console.log('Total Overhead now at row 59:');
  console.log('  Month_Total_Overheads: O59 = SUM(O31:O58)');
  console.log('  Year_Total_Overheads: Q59 = SUM(Q31:Q58)');
  console.log('\nOverhead expenses ONLY (rows 31-58)');
  console.log('Property/Person remains at row 21 (separate)');
}

fixOverheadRanges().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
