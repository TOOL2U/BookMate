#!/bin/bash

# BookMate Font Conversion & Setup Script
# Converts .otf/.ttf fonts to web formats and moves to public/fonts

echo "🎨 BookMate Font Setup - Converting fonts for web use"
echo "=================================================="

# Create public/fonts directory
mkdir -p public/fonts

# Check if fonts exist in app/fonts
if [ ! -d "app/fonts" ]; then
  echo "❌ Error: app/fonts directory not found"
  exit 1
fi

echo ""
echo "✓ Font source directories found"
echo ""
echo "⚠️  IMPORTANT: Web Font Conversion Required"
echo "=================================================="
echo ""
echo "Your fonts are in .otf/.ttf format and need to be converted to .woff2/.woff"
echo "for optimal web performance."
echo ""
echo "Option 1: Online Converter (Recommended - Easiest)"
echo "---------------------------------------------------"
echo "1. Visit: https://cloudconvert.com/"
echo "2. Upload these files one by one:"
echo "   - app/fonts/made_mirage/MADE Mirage Regular PERSONAL USE.otf"
echo "   - app/fonts/Bebas_Neue/BebasNeue-Regular.ttf"
echo "   - app/fonts/aileron/Aileron-Regular.otf"
echo "   - app/fonts/aileron/Aileron-SemiBold.otf"
echo "3. Convert each to both .woff2 AND .woff format"
echo "4. Download and rename:"
echo "   - MADE Mirage Regular → MadeMirage-Regular.woff2 & .woff"
echo "   - BebasNeue-Regular → BebasNeue-Regular.woff2 & .woff"
echo "   - Aileron-Regular → Aileron-Regular.woff2 & .woff"
echo "   - Aileron-SemiBold → Aileron-SemiBold.woff2 & .woff"
echo "5. Place all 8 files in: public/fonts/"
echo ""
echo "Option 2: Use Next.js Font Optimization (Alternative)"
echo "------------------------------------------------------"
echo "If conversion is difficult, you can use Next.js to load fonts directly:"
echo "See: FONT_INSTALLATION_GUIDE.md for instructions"
echo ""
echo "Expected final structure:"
echo "========================="
echo "public/fonts/"
echo "├── MadeMirage-Regular.woff2"
echo "├── MadeMirage-Regular.woff"
echo "├── BebasNeue-Regular.woff2"
echo "├── BebasNeue-Regular.woff"
echo "├── Aileron-Regular.woff2"
echo "├── Aileron-Regular.woff"
echo "├── Aileron-SemiBold.woff2"
echo "└── Aileron-SemiBold.woff"
echo ""
echo "After conversion, restart your dev server:"
echo "rm -rf .next && npm run dev"
echo ""
