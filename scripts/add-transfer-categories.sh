#!/bin/bash

# Add Transfer Categories to Google Sheets
# This script adds "Revenue - Transfer" and "EXP - Transfer" to the operations list

set -e

echo "🔧 Adding Transfer Categories to Google Sheets"
echo "=============================================="
echo ""

# Get credentials from environment
SHEET_ID="${GOOGLE_SHEET_ID:-1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8}"
SERVICE_ACCOUNT_KEY="${GOOGLE_SERVICE_ACCOUNT_KEY_PATH:-./accounting-buddy-476114-82555a53603b.json}"

if [ ! -f "$SERVICE_ACCOUNT_KEY" ]; then
    echo "❌ Error: Service account key not found at: $SERVICE_ACCOUNT_KEY"
    echo ""
    echo "Please ensure you have the service account JSON key file."
    echo "Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable if it's in a different location."
    exit 1
fi

echo "📋 Configuration:"
echo "  Sheet ID: $SHEET_ID"
echo "  Service Account: $SERVICE_ACCOUNT_KEY"
echo ""

# Install required packages if not present
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed."
    exit 1
fi

# Create a temporary Node.js script to add the categories
cat > /tmp/add-transfer-categories.js << 'EOFJS'
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function addTransferCategories() {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
    const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './accounting-buddy-476114-82555a53603b.json';
    
    console.log('📡 Connecting to Google Sheets...');
    
    // Load service account credentials
    const serviceAccountAuth = new JWT({
        email: require(SERVICE_ACCOUNT_FILE).client_email,
        key: require(SERVICE_ACCOUNT_FILE).private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    console.log(`✅ Connected to: ${doc.title}`);
    console.log('');
    
    // Find the Data or Lists sheet
    let sheet = doc.sheetsByTitle['Data'] || doc.sheetsByTitle['Lists'];
    
    if (!sheet) {
        console.log('❌ Error: Could not find "Data" or "Lists" sheet');
        console.log('Available sheets:');
        doc.sheetsByIndex.forEach(s => console.log(`  - ${s.title}`));
        process.exit(1);
    }
    
    console.log(`📄 Using sheet: ${sheet.title}`);
    
    // Load rows
    await sheet.loadCells();
    const rows = await sheet.getRows();
    
    console.log(`📊 Found ${rows.length} existing rows`);
    console.log('');
    
    // Check if Transfer categories already exist
    const existingOps = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const opName = row._rawData[0] || ''; // Column A
        if (opName) {
            existingOps.push(opName);
        }
    }
    
    console.log('🔍 Checking for existing Transfer categories...');
    
    const hasRevenueTransfer = existingOps.some(op => 
        op.toLowerCase().includes('transfer') && op.toLowerCase().includes('revenue')
    );
    const hasExpenseTransfer = existingOps.some(op => 
        op.toLowerCase().includes('transfer') && op.toLowerCase().includes('exp')
    );
    
    if (hasRevenueTransfer && hasExpenseTransfer) {
        console.log('✅ Transfer categories already exist!');
        console.log('   - Revenue Transfer: Found ✓');
        console.log('   - Expense Transfer: Found ✓');
        console.log('');
        console.log('No changes needed.');
        return;
    }
    
    // Add missing categories
    const categoriesToAdd = [];
    
    if (!hasRevenueTransfer) {
        categoriesToAdd.push({
            name: 'Revenue - Transfer',
            type: 'Revenue',
            description: 'Internal transfer (incoming)'
        });
    }
    
    if (!hasExpenseTransfer) {
        categoriesToAdd.push({
            name: 'EXP - Transfer',
            type: 'Expense',
            description: 'Internal transfer (outgoing)'
        });
    }
    
    console.log(`📝 Adding ${categoriesToAdd.length} new categories:`);
    categoriesToAdd.forEach(cat => console.log(`   - ${cat.name}`));
    console.log('');
    
    // Add new rows
    for (const category of categoriesToAdd) {
        await sheet.addRow({
            'Type of Operation': category.name,
            'Category': category.type,
            // Add other columns as needed based on your sheet structure
        });
        console.log(`✅ Added: ${category.name}`);
    }
    
    console.log('');
    console.log('🎉 Transfer categories added successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify categories in Google Sheets');
    console.log('2. Clear webapp cache (Settings page)');
    console.log('3. Test: curl http://localhost:3000/api/options | jq \'.data.typeOfOperation[] | select(contains("Transfer"))\'');
    console.log('4. Notify mobile team that Transfer categories are available');
}

addTransferCategories().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
EOFJS

echo "📦 Installing dependencies..."
npm install --no-save google-spreadsheet google-auth-library 2>&1 | grep -v "npm WARN" || true
echo ""

echo "🚀 Running script..."
echo ""

# Run the script
GOOGLE_SHEET_ID="$SHEET_ID" \
GOOGLE_SERVICE_ACCOUNT_KEY_PATH="$SERVICE_ACCOUNT_KEY" \
node /tmp/add-transfer-categories.js

# Cleanup
rm -f /tmp/add-transfer-categories.js

echo ""
echo "✅ Script complete!"
