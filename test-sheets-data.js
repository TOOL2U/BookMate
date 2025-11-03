const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

(async () => {
  try {
    const credentials = JSON.parse(fs.readFileSync('config/google-credentials.json', 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('Spreadsheet ID:', spreadsheetId);
    console.log('\n=== Fetching Data!D2:D (Payment Type Names) ===');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!D2:D',
    });
    
    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows`);
    rows.forEach((row, index) => {
      console.log(`Row ${index + 2}: "${row[0]}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
  }
})();
