#!/bin/bash

# Get Firebase Service Account Credentials
# This script helps you download the Firebase Admin SDK service account key

set -e

PROJECT_ID="bookmate-bfd43"
SERVICE_ACCOUNT_FILE="firebase-admin-key.json"

echo "🔑 Firebase Service Account Setup"
echo "=================================="
echo ""
echo "To get your Firebase Admin SDK credentials, you need to:"
echo ""
echo "1. Go to Firebase Console:"
echo "   https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts"
echo ""
echo "2. Click 'Generate new private key'"
echo ""
echo "3. Download the JSON file"
echo ""
echo "4. Save it as: ${SERVICE_ACCOUNT_FILE}"
echo "   (in the root of your project)"
echo ""
echo "5. Extract the values and add to .env.local:"
echo ""
echo "   FIREBASE_ADMIN_PROJECT_ID=${PROJECT_ID}"
echo "   FIREBASE_ADMIN_CLIENT_EMAIL=<client_email from JSON>"
echo "   FIREBASE_ADMIN_PRIVATE_KEY=<private_key from JSON>"
echo ""
echo "-----------------------------------"
echo ""
echo "Or run this command to extract automatically (after downloading the key):"
echo ""
echo "  node scripts/extract-service-account.js ${SERVICE_ACCOUNT_FILE}"
echo ""
