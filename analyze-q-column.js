#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function analyzeQColumn() {
  console.log('\n📊 Analyzing Q Column Values...\n');

  const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // Get Q14:Q20 (Property/Person)
  const propPerson = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q14:Q20",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  // Get Q31:Q58 (Overhead)
  const overhead = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q31:Q58",
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  console.log('=== PROPERTY/PERSON (Q14:Q20) ===');
  let propTotal = 0;
  propPerson.data.values?.forEach((row, idx) => {
    const val = row[0];
    if (typeof val === 'number') {
      console.log(`  Q${14 + idx}: ${val}`);
      propTotal += val;
    }
  });
  console.log(`  SUM: ${propTotal}`);

  console.log('\n=== OVERHEAD (Q31:Q58) ===');
  let overheadTotal = 0;
  let hasValues = false;
  overhead.data.values?.forEach((row, idx) => {
    const val = row[0];
    if (typeof val === 'number') {
      console.log(`  Q${31 + idx}: ${val}`);
      overheadTotal += val;
      hasValues = true;
    }
  });
  console.log(`  SUM: ${overheadTotal}`);

  if (!hasValues) {
    console.log('  ⚠️  NO VALUES FOUND in Q31:Q58!');
    console.log('  This suggests overhead expenses might not have any year-to-date values,');
    console.log('  or the data is in different rows.');
  }

  // Check the formula in Q80
  const q80Formula = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'P&L (DO NOT EDIT)'!Q80",
    valueRenderOption: 'FORMULA'
  });

  console.log('\n=== Q80 ANALYSIS ===');
  console.log(`  Formula: ${q80Formula.data.values?.[0]?.[0]}`);
  console.log(`  Actual Q80 value: ${overheadTotal}`);
  console.log(`  Q21 value (Property/Person): ${propTotal}`);
  
  if (overheadTotal === propTotal && propTotal === 50000) {
    console.log('\n⚠️  ISSUE FOUND:');
    console.log('  Q80 formula =SUM(Q31:Q58) is returning 50000');
    console.log('  Q21 formula =SUM(Q14:Q20) is also returning 50000');
    console.log('  This suggests the formulas might be incorrect or the range is wrong.');
  }
}

analyzeQColumn().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
