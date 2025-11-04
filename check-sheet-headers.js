const { google } = require('googleapis');
const fs = require('fs');

async function checkHeaders() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || fs.readFileSync('accounting-buddy-476114-82555a53603b.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
  
  // Get all sheet names and their first rows
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: true
  });
  
  console.log('\n=== SHEET HEADERS ANALYSIS ===\n');
  
  for (const sheet of response.data.sheets || []) {
    const title = sheet.properties?.title;
    const rowData = sheet.data?.[0]?.rowData?.[0]?.values || [];
    const headers = rowData.map(cell => 
      cell?.formattedValue || cell?.userEnteredValue?.stringValue || ''
    ).filter(h => h);
    
    console.log(`📋 ${title}`);
    console.log(`   Headers: ${headers.join(' | ')}`);
    console.log('');
  }
}

checkHeaders().catch(console.error);
