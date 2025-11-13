#!/bin/bash

# Script to add authentication to all settings components and activity page

echo "🔐 Adding authentication to frontend components..."
echo ""

# File paths
FILES=(
  "components/settings/ExpenseCategoryManager.tsx.backup"
  "components/settings/RevenueManager.tsx"
  "components/settings/PaymentTypeManager.tsx"
  "app/activity/page.tsx"
)

# Step 1: Copy backup file if it exists
if [ -f "components/settings/ExpenseCategoryManager.tsx.backup" ]; then
  cp components/settings/ExpenseCategoryManager.tsx.backup components/settings/ExpenseCategoryManager.tsx
  echo "✅ Restored ExpenseCategoryManager from backup"
fi

# Step 2: Use sed to add import and replace fetch calls
for file in "components/settings/ExpenseCategoryManager.tsx" "components/settings/RevenueManager.tsx" "components/settings/PaymentTypeManager.tsx"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import after the lucide-react import (line 4)
    sed -i.tmp '4 a\
import { fetchWithAuth, postWithAuth } from '"'"'@/lib/api/client'"'"';
' "$file"
    
    # Replace fetch with fetchWithAuth for GET requests
    sed -i.tmp "s|const res = await fetch('/api/categories/|const res = await fetchWithAuth('/api/categories/|g" "$file"
    
    # Replace fetch with postWithAuth for POST requests
    sed -i.tmp "s|await fetch('/api/categories/\([^']*\)', {$|await postWithAuth('/api/categories/\1', {|g" "$file"
    
    # Remove method, headers, and body from POST calls (handled by postWithAuth)
    # This is complex, so we'll handle it manually
    
    rm -f "$file.tmp"
    echo "✅ Updated $file"
  fi
done

echo ""
echo "🎉 Done! Please manually review the changes and test."
