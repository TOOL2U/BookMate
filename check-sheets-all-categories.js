const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkAllCategories() {
  try {
    const credentialsPath = path.join(__dirname, 'accounting-buddy-476114-82555a53603b.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';

    console.log('🔍 CHECKING ALL CATEGORIES IN GOOGLE SHEETS\n');
    console.log('='.repeat(60));

    // Check Properties
    console.log('\n📋 PROPERTIES (Data!C1:C20)');
    console.log('-'.repeat(60));
    const propsResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!C1:C20',
    });
    const propRows = propsResult.data.values || [];
    propRows.forEach((row, i) => {
      const value = row[0] || '';
      const rowNum = i + 1;
      if (value) {
        console.log(`  Row ${rowNum}: "${value}"`);
      }
    });
    const propCount = propRows.filter(r => r[0] && !['PROPERTY', 'Property'].includes(r[0]?.trim())).length;
    console.log(`\n  Total (excluding header): ${propCount}`);

    // Check Payment Types
    console.log('\n💳 PAYMENT TYPES (Data!D1:D20)');
    console.log('-'.repeat(60));
    const paysResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!D1:D20',
    });
    const payRows = paysResult.data.values || [];
    payRows.forEach((row, i) => {
      const value = row[0] || '';
      const rowNum = i + 1;
      if (value) {
        console.log(`  Row ${rowNum}: "${value}"`);
      }
    });
    const payCount = payRows.filter(r => r[0] && !['PAYMENT TYPE', 'Type of Payment', 'TYPE OF PAYMENT'].includes(r[0]?.trim())).length;
    console.log(`\n  Total (excluding header): ${payCount}`);

    // Check Revenues
    console.log('\n💰 REVENUES (Data!A1:A20)');
    console.log('-'.repeat(60));
    const revsResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!A1:A20',
    });
    const revRows = revsResult.data.values || [];
    revRows.forEach((row, i) => {
      const value = row[0] || '';
      const rowNum = i + 1;
      if (value) {
        console.log(`  Row ${rowNum}: "${value}"`);
      }
    });
    const revCount = revRows.filter(r => r[0] && !['REVENUES', 'Revenue'].includes(r[0]?.trim())).length;
    console.log(`\n  Total (excluding header): ${revCount}`);

    // Check Expenses
    console.log('\n💸 OVERHEAD EXPENSES (Data!B1:B40)');
    console.log('-'.repeat(60));
    const expResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!B1:B40',
    });
    const expRows = expResult.data.values || [];
    expRows.forEach((row, i) => {
      const value = row[0] || '';
      const rowNum = i + 1;
      if (value) {
        console.log(`  Row ${rowNum}: "${value}"`);
      }
    });
    const expCount = expRows.filter(r => r[0] && !['OVERHEAD EXPENSES', 'EXPENSES', 'Expense'].includes(r[0]?.trim())).length;
    console.log(`\n  Total (excluding header): ${expCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Properties: ${propCount} (API should return ${propCount})`);
    console.log(`Payment Types: ${payCount} (API should return ${payCount})`);
    console.log(`Revenues: ${revCount}`);
    console.log(`Expenses: ${expCount}`);
    console.log(`Total Operations: ${revCount + expCount} (API should return ${revCount + expCount})`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllCategories();
