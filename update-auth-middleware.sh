#!/bin/bash

# Update all API routes to use new auth-middleware

echo "Updating API routes to support Bearer token authentication..."

# List of files to update
files=(
  "app/api/balance/route.ts"
  "app/api/categories/expenses/route.ts"
  "app/api/categories/properties/route.ts"
  "app/api/categories/payments/route.ts"
  "app/api/categories/revenues/route.ts"
  "app/api/categories/sync/route.ts"
  "app/api/pnl/route.ts"
  "app/api/pnl/overhead-expenses/route.ts"
  "app/api/pnl/property-person/route.ts"
  "app/api/inbox/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Replace import statement
    sed -i.bak "s/from '@\/lib\/api\/account-helper'/from '@\/lib\/api\/auth-middleware'/g" "$file"
    
    # Replace getAccountFromSession() with getAccountFromRequest(request)
    sed -i.bak "s/await getAccountFromSession()/await getAccountFromRequest(request)/g" "$file"
    
    # Remove backup file
    rm "${file}.bak"
    
    echo "✓ Updated $file"
  else
    echo "⚠ File not found: $file"
  fi
done

echo ""
echo "✅ All API routes updated!"
echo "Files modified: ${#files[@]}"
