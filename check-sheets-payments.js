const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkGoogleSheetsPayments() {
  try {
    // Load credentials
    const credPath = path.join(__dirname, 'config', 'google-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
    
    console.log('Checking Google Sheets payment types...\n');
    
    // Check Data!D2:D
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!D2:D',
    });
    
    const dataPayments = (dataResponse.data.values || []).flat().filter(Boolean);
    
    console.log('=== Data!D2:D (Payment Type Names) ===');
    dataPayments.forEach((type, idx) => {
      console.log(`  ${idx + 1}. "${type}"`);
    });
    console.log(`Total in Data sheet: ${dataPayments.length}\n`);
    
    // Check Lists!R2:R
    const listsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Lists!R2:R',
    });
    
    const listsPayments = (listsResponse.data.values || []).flat().filter(Boolean);
    
    console.log('=== Lists!R2:R (Payment Categories in Lists) ===');
    listsPayments.forEach((type, idx) => {
      console.log(`  ${idx + 1}. "${type}"`);
    });
    console.log(`Total in Lists sheet: ${listsPayments.length}\n`);
    
    // Compare
    console.log('=== Analysis ===');
    if (dataPayments.length === 5) {
      console.log('✅ Data sheet has 5 payment types (CORRECT)');
    } else {
      console.log(`❌ Data sheet has ${dataPayments.length} payment types (WRONG - should be 5)`);
      console.log('Missing:');
      const expected = [
        'Bank Transfer - Bangkok Bank - Shaun Ducker',
        'Bank Transfer - Bangkok Bank - Maria Ren',
        'Bank transfer - Krung Thai Bank - Family Account',
        'Cash - Family',
        'Cash - Alesia'
      ];
      expected.forEach(exp => {
        if (!dataPayments.includes(exp)) {
          console.log(`  - "${exp}"`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
  }
}

checkGoogleSheetsPayments();
