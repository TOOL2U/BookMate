#!/bin/bash

echo "======================================"
echo "CHECKING MASTER TEMPLATE ACCESS"
echo "======================================"
echo ""

TEMPLATE_ID="1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU"

echo "Master Template ID: $TEMPLATE_ID"
echo "URL: https://docs.google.com/spreadsheets/d/$TEMPLATE_ID/edit"
echo ""
echo "This template needs to be:"
echo "1. Shared with the service account email"
echo "2. Accessible with 'Viewer' or 'Editor' permissions"
echo ""
echo "Service Account Email from .env:"
if [ -f .env ]; then
  SERVICE_ACCOUNT_EMAIL=$(grep "GOOGLE_SERVICE_ACCOUNT_EMAIL" .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
  if [ -n "$SERVICE_ACCOUNT_EMAIL" ]; then
    echo "   $SERVICE_ACCOUNT_EMAIL"
  else
    echo "   ⚠️  GOOGLE_SERVICE_ACCOUNT_EMAIL not found in .env"
  fi
else
  echo "   ⚠️  .env file not found"
fi
echo ""
echo "======================================"
echo "TESTING LOCAL SPREADSHEET PROVISIONING"
echo "======================================"
echo ""

# Create a test script to provision a spreadsheet locally
cat > test-provision-local.ts << 'EOTS'
import { provisionUserSpreadsheetAuto } from './lib/services/spreadsheet-provisioning';

async function test() {
  console.log('Testing spreadsheet provisioning...\n');
  
  const result = await provisionUserSpreadsheetAuto(
    'test-user-id',
    'test@example.com',
    'Test User'
  );
  
  console.log('\nResult:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ SUCCESS!');
    console.log('Spreadsheet ID:', result.spreadsheetId);
    console.log('URL:', result.spreadsheetUrl);
  } else {
    console.log('\n❌ FAILED!');
    console.log('Error:', result.error);
  }
}

test().catch(console.error);
EOTS

echo "Running local test..."
npx tsx test-provision-local.ts

rm -f test-provision-local.ts

