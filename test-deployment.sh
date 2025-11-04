#!/bin/bash
# Post-deployment verification tests for dual format /api/options

echo "🧪 Testing /api/options Dual Format Deployment"
echo "================================================"
echo ""

API_URL="https://accounting.siamoon.com/api/options"

echo "⏳ Waiting 30 seconds for Vercel deployment..."
sleep 30

echo ""
echo "📡 Fetching /api/options..."
RESPONSE=$(curl -s "$API_URL")

echo ""
echo "✅ Test 1: Verify dual format structure"
echo "----------------------------------------"
PLAIN_KEYS=$(echo "$RESPONSE" | jq -r '.data | keys | map(select(. | startswith("properties") or . == "typeOfOperation" or . == "typeOfPayment" or . == "revenueCategories")) | .[]' 2>/dev/null)
RICH_KEYS=$(echo "$RESPONSE" | jq -r '.data | keys | map(select(. | endswith("Rich") or . == "typeOfOperations" or . == "typeOfPayments" or . == "revenues")) | .[]' 2>/dev/null)

echo "Plain format keys:"
echo "$PLAIN_KEYS"
echo ""
echo "Rich format keys:"
echo "$RICH_KEYS"

echo ""
echo "✅ Test 2: Count entries in each category"
echo "------------------------------------------"
echo "$RESPONSE" | jq '{
  plain: {
    properties: (.data.properties | length),
    operations: (.data.typeOfOperation | length),
    payments: (.data.typeOfPayment | length),
    revenues: (.data.revenueCategories | length)
  },
  rich: {
    properties: (.data.propertiesRich | length),
    operations: (.data.typeOfOperations | length),
    payments: (.data.typeOfPayments | length),
    revenues: (.data.revenues | length)
  }
}'

echo ""
echo "✅ Test 3: Verify test data entries are present"
echo "------------------------------------------------"
echo "Checking for numeric test entries (1, 2, 3, 4)..."

TEST_1=$(echo "$RESPONSE" | jq '.data.typeOfOperation | map(select(. == "1")) | length')
TEST_2=$(echo "$RESPONSE" | jq '.data.typeOfOperation | map(select(. == "2")) | length')
TEST_3=$(echo "$RESPONSE" | jq '.data.properties | map(select(. == "3")) | length')
TEST_4=$(echo "$RESPONSE" | jq '.data.typeOfPayment | map(select(. == "4")) | length')

echo "Revenue test entry '1': $TEST_1 found"
echo "Expense test entry '2': $TEST_2 found"
echo "Property test entry '3': $TEST_3 found"
echo "Payment test entry '4': $TEST_4 found"

echo ""
echo "✅ Test 4: Verify source identifier"
echo "-------------------------------------"
SOURCE=$(echo "$RESPONSE" | jq -r '.source')
echo "Source: $SOURCE"

if [ "$SOURCE" = "google_sheets_lists+data" ]; then
  echo "✅ Correct source identifier"
else
  echo "❌ Wrong source: expected 'google_sheets_lists+data', got '$SOURCE'"
fi

echo ""
echo "✅ Test 5: Sample rich object structure"
echo "----------------------------------------"
echo "First payment type (rich):"
echo "$RESPONSE" | jq '.data.typeOfPayments[0]'

echo ""
echo "✅ Test 6: Verify plain arrays are strings only"
echo "------------------------------------------------"
echo "First 3 payment types (plain):"
echo "$RESPONSE" | jq '.data.typeOfPayment[0:3]'

echo ""
echo "================================================"
echo "🎉 Deployment Verification Complete!"
echo "================================================"
