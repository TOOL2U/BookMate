#!/bin/bash

echo "======================================"
echo "SERVICE ACCOUNT KEY COMPARISON"
echo "======================================"
echo ""

# Check if the local config file exists
if [ ! -f "config/google-credentials.json" ]; then
  echo "❌ config/google-credentials.json not found"
  exit 1
fi

# Check if the pulled env file exists
if [ ! -f ".env.production.local" ]; then
  echo "❌ .env.production.local not found"
  exit 1
fi

echo "Comparing service account keys..."
echo ""

# Extract key fields from local config
LOCAL_EMAIL=$(cat config/google-credentials.json | jq -r '.client_email')
LOCAL_PROJECT=$(cat config/google-credentials.json | jq -r '.project_id')
LOCAL_PRIVATE_KEY_ID=$(cat config/google-credentials.json | jq -r '.private_key_id')

echo "LOCAL config/google-credentials.json:"
echo "  Email: $LOCAL_EMAIL"
echo "  Project: $LOCAL_PROJECT"
echo "  Private Key ID: ${LOCAL_PRIVATE_KEY_ID:0:20}..."
echo ""

# Extract and parse the Vercel env variable
VERCEL_KEY=$(grep "GOOGLE_SERVICE_ACCOUNT_KEY=" .env.production.local | cut -d '=' -f2-)

# Check if it exists
if [ -z "$VERCEL_KEY" ]; then
  echo "❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.production.local"
  exit 1
fi

# Parse the JSON from Vercel
VERCEL_EMAIL=$(echo "$VERCEL_KEY" | jq -r '.client_email // empty')
VERCEL_PROJECT=$(echo "$VERCEL_KEY" | jq -r '.project_id // empty')
VERCEL_PRIVATE_KEY_ID=$(echo "$VERCEL_KEY" | jq -r '.private_key_id // empty')

if [ -z "$VERCEL_EMAIL" ]; then
  echo "❌ VERCEL key is not valid JSON or missing fields"
  echo "Raw value preview: ${VERCEL_KEY:0:100}..."
  exit 1
fi

echo "VERCEL GOOGLE_SERVICE_ACCOUNT_KEY:"
echo "  Email: $VERCEL_EMAIL"
echo "  Project: $VERCEL_PROJECT"
echo "  Private Key ID: ${VERCEL_PRIVATE_KEY_ID:0:20}..."
echo ""

echo "======================================"
echo "COMPARISON RESULT"
echo "======================================"

if [ "$LOCAL_EMAIL" == "$VERCEL_EMAIL" ] && \
   [ "$LOCAL_PROJECT" == "$VERCEL_PROJECT" ] && \
   [ "$LOCAL_PRIVATE_KEY_ID" == "$VERCEL_PRIVATE_KEY_ID" ]; then
  echo "✅ Keys MATCH - Vercel has the correct service account key"
else
  echo "❌ Keys DO NOT MATCH"
  echo ""
  echo "Differences:"
  [ "$LOCAL_EMAIL" != "$VERCEL_EMAIL" ] && echo "  - Email: local=$LOCAL_EMAIL vercel=$VERCEL_EMAIL"
  [ "$LOCAL_PROJECT" != "$VERCEL_PROJECT" ] && echo "  - Project: local=$LOCAL_PROJECT vercel=$VERCEL_PROJECT"
  [ "$LOCAL_PRIVATE_KEY_ID" != "$VERCEL_PRIVATE_KEY_ID" ] && echo "  - Private Key ID: DIFFERENT"
  echo ""
  echo "ACTION REQUIRED: Update Vercel environment variable"
fi

echo ""
echo "======================================"
echo "ADDITIONAL CHECKS"
echo "======================================"

# Check if private_key field exists and has proper format
LOCAL_HAS_PRIVATE_KEY=$(cat config/google-credentials.json | jq -e '.private_key' > /dev/null && echo "YES" || echo "NO")
VERCEL_HAS_PRIVATE_KEY=$(echo "$VERCEL_KEY" | jq -e '.private_key' > /dev/null && echo "YES" || echo "NO")

echo "Private key field exists:"
echo "  Local: $LOCAL_HAS_PRIVATE_KEY"
echo "  Vercel: $VERCEL_HAS_PRIVATE_KEY"

if [ "$VERCEL_HAS_PRIVATE_KEY" == "YES" ]; then
  VERCEL_PRIVATE_KEY_PREVIEW=$(echo "$VERCEL_KEY" | jq -r '.private_key' | head -c 50)
  echo "  Vercel private_key starts with: $VERCEL_PRIVATE_KEY_PREVIEW..."
fi

