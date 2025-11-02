#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function checkStructure() {
  console.log('\n📊 Checking P&L Expense Structure...\n');

  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get column A labels for expense sections
  const labels = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!A1:A90"
  });

  console.log('=== EXPENSE SECTIONS ===\n');
  
  const rows = labels.data.values || [];
  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const label = row[0] || '';
    
    // Show key rows
    if (
      (rowNum >= 10 && rowNum <= 25) ||
      (rowNum >= 28 && rowNum <= 90 && label && label.trim())
    ) {
      const marker = label.includes('Total') || label.includes('TOTAL') ? '📌' : 
                     label.includes('Property') || label.includes('Person') ? '🏠' : 
                     label.includes('Overhead') || label.includes('OVERHEAD') ? '💼' : '  ';
      console.log(`${marker} Row ${rowNum.toString().padStart(2)}: ${label}`);
    }
  });

  // Get values from Q column for key rows
  console.log('\n\n=== Q COLUMN VALUES (Year Total) ===\n');
  
  const qValues = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q14:Q90",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  const qVals = qValues.data.values || [];
  [21, 59, 62, 80].forEach(rowNum => {
    const idx = rowNum - 14;  // Offset since we start at row 14
    const value = qVals[idx]?.[0];
    const label = rows[rowNum - 1]?.[0];
    if (value !== undefined || label) {
      console.log(`Row ${rowNum} (${label}): ${value}`);
    }
  });
}

checkStructure().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
