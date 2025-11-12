#!/bin/bash

# Phase 2 Batch Update Script
# Updates all API routes to use getUserSpreadsheetId instead of process.env.GOOGLE_SHEET_ID

echo "🚀 Phase 2: Updating API routes to use user spreadsheet..."
echo ""

# List of files to update (excluding debug and admin endpoints)
FILES=(
  "app/api/categories/payments/route.ts"
  "app/api/categories/properties/route.ts"
  "app/api/categories/revenues/route.ts"
  "app/api/categories/sync/route.ts"
  "app/api/balance/route.ts"
  "app/api/health/balance/route.ts"
  "app/api/pnl/route.ts"
  "app/api/pnl/namedRanges/route.ts"
  "app/api/pnl/overhead-expenses/route.ts"
  "app/api/pnl/property-person/route.ts"
)

COUNT=0
TOTAL=${#FILES[@]}

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Updating: $file"
    COUNT=$((COUNT + 1))
  else
    echo "⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Would update $COUNT/$TOTAL files"
echo ""
echo "Note: This is a dry run. Use TypeScript replacements for actual updates."
