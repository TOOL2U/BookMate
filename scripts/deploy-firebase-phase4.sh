#!/bin/bash

# Firebase Phase 4 - Complete Deployment Script
# ============================================================================
# This script automates the complete Firebase setup and deployment process
# Run this after manually configuring secrets in Google Cloud Secret Manager
# ============================================================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🔥 FIREBASE PHASE 4 - DEPLOYMENT SCRIPT                 ║"
echo "║            Project: bookmate-bfd43                              ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo "❌ Firebase CLI not found"
  echo "Install with: npm install -g firebase-tools"
  exit 1
fi

echo "✅ Firebase CLI found: $(firebase --version)"
echo ""

# Check we're logged in
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
  echo "❌ Not logged in to Firebase"
  echo "Run: firebase login"
  exit 1
}
echo "✅ Authenticated"
echo ""

# Confirm project
echo "📋 Current Firebase project:"
firebase use
echo ""

# Step 1: Deploy Firestore Rules
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Deploy Firestore Rules (Open Access - MVP Mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Deploy Firestore rules? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  firebase deploy --only firestore:rules
  echo "✅ Firestore rules deployed"
else
  echo "⏭️  Skipped Firestore rules"
fi
echo ""

# Step 2: Build Functions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Build Cloud Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Building TypeScript..."
cd functions
npm run build
cd ..
echo "✅ Cloud Functions built"
echo ""

# Step 3: Check Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Verify Secrets are Configured"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Before deploying functions, ensure these secrets are set:"
echo ""
echo "Required secrets:"
echo "  - GOOGLE_SHEET_ID"
echo "  - SHEETS_WEBHOOK_SECRET"
echo "  - BASE_URL"
echo "  - OPENAI_API_KEY"
echo ""
echo "Set secrets with:"
echo '  firebase functions:secrets:set SECRET_NAME --data "value"'
echo ""
read -p "Have you configured all secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "❌ Please configure secrets first:"
  echo ""
  echo 'firebase functions:secrets:set GOOGLE_SHEET_ID --data "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"'
  echo 'firebase functions:secrets:set SHEETS_WEBHOOK_SECRET --data "VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8="'
  echo 'firebase functions:secrets:set BASE_URL --data "https://accounting.siamoon.com"'
  echo 'firebase functions:secrets:set OPENAI_API_KEY --data "YOUR_KEY_HERE"'
  echo ""
  exit 1
fi
echo ""

# Step 4: Deploy Functions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Deploy Cloud Functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Deploy Cloud Functions? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  firebase deploy --only functions
  echo "✅ Cloud Functions deployed"
else
  echo "⏭️  Skipped Cloud Functions deployment"
fi
echo ""

# Step 5: Verify Deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Verify Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Firebase Console → Firestore"
echo "   https://console.firebase.google.com/project/bookmate-bfd43/firestore"
echo ""
echo "2. Create test collections:"
echo "   - balances"
echo "   - transactions"
echo "   - activityLogs"
echo "   - aiChecks"
echo ""
echo "3. Test the Cloud Function:"
echo "   - Add a document to 'transactions' collection"
echo "   - Check function logs: firebase functions:log --only onTransactionWrite"
echo "   - Verify 'balances' collection updated"
echo ""
echo "4. Get Firebase config for mobile team:"
echo "   - Firebase Console → Project Settings → Your apps → Add app → Web"
echo "   - Copy config object"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation: FIREBASE_PHASE4_SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
