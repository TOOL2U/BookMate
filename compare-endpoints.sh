#!/bin/bash

# Endpoint Comparison Script
# Run this to compare /api/options vs /api/categories/all
# Usage: ./compare-endpoints.sh [BASE_URL]
# Example: ./compare-endpoints.sh https://your-app.vercel.app
# Example: ./compare-endpoints.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"

echo "=============================================="
echo "  ENDPOINT COMPARISON TEST"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo ""

# Create output directory
mkdir -p endpoint-comparison-results

echo "=============================================="
echo "1. Testing /api/options"
echo "=============================================="
echo ""

echo "Fetching $BASE_URL/api/options ..."
curl -s "$BASE_URL/api/options" > endpoint-comparison-results/options-raw.json

echo "✅ Response saved to: endpoint-comparison-results/options-raw.json"
echo ""

echo "--- Response Structure ---"
cat endpoint-comparison-results/options-raw.json | jq '{
  ok: .ok,
  source: .source,
  cached: .cached,
  data_keys: (.data | keys),
  properties_count: (.data.properties | length),
  operations_count: (.data.typeOfOperations | length),
  payments_count: (.data.typeOfPayments | length),
  properties_sample: (.data.properties[0:2]),
  operations_sample: (.data.typeOfOperations[0:2]),
  payments_sample: (.data.typeOfPayments[0:1])
}' | tee endpoint-comparison-results/options-summary.json

echo ""
echo ""

echo "=============================================="
echo "2. Testing /api/categories/all"
echo "=============================================="
echo ""

echo "Fetching $BASE_URL/api/categories/all ..."
curl -s "$BASE_URL/api/categories/all" > endpoint-comparison-results/categories-all-raw.json

echo "✅ Response saved to: endpoint-comparison-results/categories-all-raw.json"
echo ""

echo "--- Response Structure ---"
cat endpoint-comparison-results/categories-all-raw.json | jq '{
  ok: .ok,
  data_keys: (.data | keys),
  revenues_count: (.data.revenues | length),
  expenses_count: (.data.expenses | length),
  properties_count: (.data.properties | length),
  payments_count: (.data.payments | length),
  revenues_sample: (.data.revenues[0:2]),
  expenses_sample: (.data.expenses[0:2]),
  properties_sample: (.data.properties[0:2]),
  payments_sample: (.data.payments[0:2])
}' | tee endpoint-comparison-results/categories-all-summary.json

echo ""
echo ""

echo "=============================================="
echo "3. DETAILED COMPARISON"
echo "=============================================="
echo ""

echo "--- Properties Comparison ---"
echo "/api/options properties:"
cat endpoint-comparison-results/options-raw.json | jq '.data.properties'
echo ""
echo "/api/categories/all properties:"
cat endpoint-comparison-results/categories-all-raw.json | jq '.data.properties'
echo ""

echo "--- Payment Types Comparison ---"
echo "/api/options payments (with monthly data):"
cat endpoint-comparison-results/options-raw.json | jq '.data.typeOfPayments'
echo ""
echo "/api/categories/all payments (strings only):"
cat endpoint-comparison-results/categories-all-raw.json | jq '.data.payments'
echo ""

echo "--- Operations/Categories Comparison ---"
echo "/api/options typeOfOperations (combined):"
cat endpoint-comparison-results/options-raw.json | jq '.data.typeOfOperations | length' 
echo "items total"
echo ""
echo "/api/categories/all (separated):"
echo "  Revenues: $(cat endpoint-comparison-results/categories-all-raw.json | jq '.data.revenues | length') items"
echo "  Expenses: $(cat endpoint-comparison-results/categories-all-raw.json | jq '.data.expenses | length') items"
echo ""

echo "=============================================="
echo "4. KEY DIFFERENCES SUMMARY"
echo "=============================================="
echo ""

cat > endpoint-comparison-results/DIFFERENCES.md << 'EOF'
# Endpoint Comparison Results

## Response Structure Differences

### /api/options
```json
{
  "ok": true,
  "source": "google_sheets_lists",
  "cached": false,
  "data": {
    "properties": ["string", "string", ...],
    "typeOfOperations": ["string", "string", ...],  // Combined revenues + expenses
    "typeOfPayments": [
      {
        "name": "string",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
    ]
  }
}
```

### /api/categories/all
```json
{
  "ok": true,
  "data": {
    "revenues": ["string", "string", ...],    // Separated
    "expenses": ["string", "string", ...],    // Separated
    "properties": ["string", "string", ...],
    "payments": ["string", "string", ...]     // Simple strings, NO monthly data
  }
}
```

## Key Differences

| Feature | /api/options | /api/categories/all |
|---------|-------------|---------------------|
| **Revenues & Expenses** | Combined in `typeOfOperations` | Separated: `revenues` + `expenses` |
| **Payment Data** | Objects with `monthly` + `yearTotal` | Simple string array |
| **Properties** | ✅ Included | ✅ Included |
| **Source Info** | ✅ Shows `source` + `cached` | ❌ No metadata |
| **Google Sheets** | ✅ Fetches from Lists blocks | ❓ Unknown source |
| **Monthly Tracking** | ✅ Payment monthly data | ❌ No monthly data |

## Use Case Recommendations

### Use /api/options if you need:
- ✅ Payment monthly data (for charts, analytics)
- ✅ Combined revenue + expense list (for single picker)
- ✅ Data source transparency (source field)
- ✅ Future-proof (includes all data types)

### Use /api/categories/all if you need:
- ✅ Separated revenues vs expenses (for filtered pickers)
- ✅ Simple string arrays (no nested objects)
- ✅ Lightweight response (no monthly data)

## Questions to Answer

1. **Does /api/categories/all fetch from Google Sheets or static config?**
2. **Which endpoint is the "source of truth"?**
3. **Should we deprecate one of them?**
4. **Do mobile apps need payment monthly data?**

EOF

cat endpoint-comparison-results/DIFFERENCES.md

echo ""
echo "=============================================="
echo "✅ COMPARISON COMPLETE"
echo "=============================================="
echo ""
echo "Results saved to: endpoint-comparison-results/"
echo ""
echo "Files created:"
echo "  - options-raw.json (full response)"
echo "  - options-summary.json (key metrics)"
echo "  - categories-all-raw.json (full response)"
echo "  - categories-all-summary.json (key metrics)"
echo "  - DIFFERENCES.md (comparison report)"
echo ""
echo "Next steps:"
echo "  1. Review the DIFFERENCES.md file"
echo "  2. Check if /api/categories/all fetches from Google Sheets"
echo "  3. Decide which endpoint to standardize on"
echo ""
