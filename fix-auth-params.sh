#!/bin/bash

# Fix getAccountFromRequest(request) to use actual parameter name

echo "Fixing auth middleware parameter references..."

# Find all route.ts files that need fixing
files=$(find app/api -name "route.ts" -exec grep -l "getAccountFromRequest(request)" {} \;)

for file in $files; do
  echo "Checking $file..."
  
  # Check what parameter name is actually used in the function signature
  # Look for patterns like: async function handler(req: or export async function GET(req: or (request:
  param_name=$(grep -E "(async function|export async function).*(req|request):" "$file" | head -1 | sed -E 's/.*\(([a-z]+):.*/\1/')
  
  if [ -z "$param_name" ]; then
    # Try alternative patterns
    param_name=$(grep -E "GET.*NextRequest|POST.*NextRequest" "$file" | head -1 | sed -E 's/.*\(([a-z]+):.*/\1/')
  fi
  
  if [ -n "$param_name" ]; then
    echo "  Parameter name: $param_name"
    # Replace getAccountFromRequest(request) with getAccountFromRequest($param_name)
    sed -i.bak "s/getAccountFromRequest(request)/getAccountFromRequest($param_name)/g" "$file"
    rm "${file}.bak"
    echo "  ✓ Fixed"
  else
    echo "  ⚠ Could not determine parameter name, skipping"
  fi
done

echo ""
echo "✅ Parameter references fixed!"
