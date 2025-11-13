#!/bin/bash

PROD_URL="https://accounting.siamoon.com"
TEST_EMAIL="debuguser$(date +%s)@example.com"
TEST_PASSWORD="DebugUser2025!"

echo "======================================"
echo "DETAILED REGISTRATION DEBUG TEST"
echo "======================================"
echo "Email: $TEST_EMAIL"
echo ""

# Register with verbose output
echo "Registering user..."
RESPONSE=$(curl -v -X POST "$PROD_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Debug User\"
  }" 2>&1)

echo "$RESPONSE"
echo ""
echo "======================================"

# Extract just the JSON response
JSON_RESPONSE=$(echo "$RESPONSE" | grep -A 100 "^{" | grep -B 100 "^}")

if [ -n "$JSON_RESPONSE" ]; then
  echo "Parsed JSON Response:"
  echo "$JSON_RESPONSE" | jq '.'
  
  SPREADSHEET_ID=$(echo "$JSON_RESPONSE" | jq -r '.user.spreadsheetId // empty')
  echo ""
  echo "Spreadsheet ID from response: '$SPREADSHEET_ID'"
  
  if [ -z "$SPREADSHEET_ID" ] || [ "$SPREADSHEET_ID" == "null" ]; then
    echo "❌ No spreadsheet ID - provisioning failed"
    echo ""
    echo "Possible reasons:"
    echo "1. Service account key not configured properly in Vercel"
    echo "2. Template spreadsheet not shared with service account"
    echo "3. Error during spreadsheet copy operation"
    echo "4. Check Vercel function logs for actual error"
  else
    echo "✅ Spreadsheet created: $SPREADSHEET_ID"
  fi
fi

