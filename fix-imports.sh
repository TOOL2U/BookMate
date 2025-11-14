#!/bin/bash

# Fix all imports to use getAccountFromRequest

files=$(find app/api -name "route.ts" -exec grep -l "from '@/lib/api/auth-middleware'" {} \;)

for file in $files; do
  echo "Fixing imports in $file..."
  sed -i.bak "s/getAccountFromSession, NoAccountError, NotAuthenticatedError/getAccountFromRequest, NoAccountError, NotAuthenticatedError/g" "$file"
  sed -i.bak "s/getAccountFromSession}/getAccountFromRequest}/g" "$file"
  rm -f "${file}.bak"
  echo "  ✓ Fixed"
done

echo ""
echo "✅ All imports fixed!"
