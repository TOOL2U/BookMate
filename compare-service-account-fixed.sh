#!/bin/bash

echo "======================================"
echo "SERVICE ACCOUNT KEY COMPARISON"
echo "======================================"
echo ""

# Extract and parse the Vercel env variable (remove outer quotes if present)
VERCEL_KEY=$(grep "GOOGLE_SERVICE_ACCOUNT_KEY=" .env.production.local | cut -d '=' -f2-)

# Remove surrounding quotes if they exist
VERCEL_KEY=$(echo "$VERCEL_KEY" | sed 's/^"//;s/"$//')

echo "Vercel key format check..."
echo "First 100 chars: ${VERCEL_KEY:0:100}..."
echo ""

# Parse the JSON
VERCEL_EMAIL=$(echo "$VERCEL_KEY" | jq -r '.client_email // empty')
VERCEL_PROJECT=$(echo "$VERCEL_KEY" | jq -r '.project_id // empty')
VERCEL_PRIVATE_KEY_ID=$(echo "$VERCEL_KEY" | jq -r '.private_key_id // empty')

# Local config
LOCAL_EMAIL=$(cat config/google-credentials.json | jq -r '.client_email')
LOCAL_PROJECT=$(cat config/google-credentials.json | jq -r '.project_id')
LOCAL_PRIVATE_KEY_ID=$(cat config/google-credentials.json | jq -r '.private_key_id')

echo "LOCAL config/google-credentials.json:"
echo "  Email: $LOCAL_EMAIL"
echo "  Project: $LOCAL_PROJECT"
echo "  Private Key ID: ${LOCAL_PRIVATE_KEY_ID:0:20}..."
echo ""

echo "VERCEL GOOGLE_SERVICE_ACCOUNT_KEY:"
echo "  Email: $VERCEL_EMAIL"
echo "  Project: $VERCEL_PROJECT"
echo "  Private Key ID: ${VERCEL_PRIVATE_KEY_ID:0:20}..."
echo ""

echo "======================================"
echo "COMPARISON RESULT"
echo "======================================"

MATCH=true

if [ "$LOCAL_EMAIL" != "$VERCEL_EMAIL" ]; then
  echo "❌ Email MISMATCH"
  echo "   Local:  $LOCAL_EMAIL"
  echo "   Vercel: $VERCEL_EMAIL"
  MATCH=false
else
  echo "✅ Email matches: $LOCAL_EMAIL"
fi

if [ "$LOCAL_PROJECT" != "$VERCEL_PROJECT" ]; then
  echo "❌ Project MISMATCH"
  echo "   Local:  $LOCAL_PROJECT"
  echo "   Vercel: $VERCEL_PROJECT"
  MATCH=false
else
  echo "✅ Project matches: $LOCAL_PROJECT"
fi

if [ "$LOCAL_PRIVATE_KEY_ID" != "$VERCEL_PRIVATE_KEY_ID" ]; then
  echo "❌ Private Key ID MISMATCH"
  echo "   Local:  ${LOCAL_PRIVATE_KEY_ID:0:30}..."
  echo "   Vercel: ${VERCEL_PRIVATE_KEY_ID:0:30}..."
  MATCH=false
else
  echo "✅ Private Key ID matches"
fi

echo ""

if [ "$MATCH" = true ]; then
  echo "🎉 ALL FIELDS MATCH - Vercel has correct service account"
else
  echo "⚠️  MISMATCH DETECTED - Vercel has DIFFERENT service account"
  echo ""
  echo "This means Vercel is using a DIFFERENT service account than local."
  echo "The spreadsheet template needs to be shared with: $VERCEL_EMAIL"
fi

