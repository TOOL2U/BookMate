#!/bin/bash

# Phase 3A: Firebase Setup & Installation Script
# Run this script to install all Phase 3 dependencies

set -e  # Exit on error

echo "================================================"
echo "🔥 Phase 3A: Firebase Installation"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Please run this script from the project root directory"
  exit 1
fi

echo "📦 Installing Firebase dependencies..."
echo ""

# Install Firebase Client SDK
echo "1️⃣ Installing Firebase Client SDK..."
npm install firebase

# Install Firebase Admin SDK
echo "2️⃣ Installing Firebase Admin SDK..."
npm install firebase-admin

# Install Firebase CLI globally (if not already installed)
echo "3️⃣ Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
  echo "Installing Firebase CLI globally..."
  npm install -g firebase-tools
else
  echo "✅ Firebase CLI already installed ($(firebase --version))"
fi

echo ""
echo "================================================"
echo "✅ Firebase Dependencies Installed"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣ Create Firebase project:"
echo "   https://console.firebase.google.com/"
echo ""
echo "2️⃣ Login to Firebase CLI:"
echo "   firebase login"
echo ""
echo "3️⃣ Initialize Firebase in this project:"
echo "   firebase init"
echo "   - Select: Firestore, Functions"
echo "   - Language: TypeScript"
echo ""
echo "4️⃣ Get Firebase credentials and add to .env.local"
echo "   See PHASE3_FIREBASE_SETUP.md for details"
echo ""
echo "5️⃣ Run test script to verify setup:"
echo "   node test-firebase-setup.js"
echo ""
echo "================================================"
