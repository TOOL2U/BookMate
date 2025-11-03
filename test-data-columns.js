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
    
    console.log('\n=== Testing Data Sheet Columns ===\n');
    
    // Fetch first few rows from each column
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['Data!A1:D10']
    });
    
    const values = response.data.valueRanges[0].values || [];
    
    console.log('Data!A1:D10 (First 10 rows):');
    values.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
