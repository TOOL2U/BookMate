#!/bin/bash

# Comprehensive API Endpoint Checker
# Compares local vs production responses for all endpoints

echo "=========================================="
echo "  COMPREHENSIVE API ENDPOINT CHECKER"
echo "=========================================="
echo "Date: $(date)"
echo ""

LOCAL_URL="http://localhost:3000"
PROD_URL="https://accounting.siamoon.com"

# Create results directory
mkdir -p api-health-check-results

echo "=========================================="
echo "1. /api/options - Main Dropdown Data"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/options" | jq '{
  properties: (.data.properties | length),
  operations: (.data.typeOfOperations | length),
  payments: (.data.typeOfPayments | length),
  paymentNames: [.data.typeOfPayments[].name],
  source: .source
}' | tee api-health-check-results/options-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/options" | jq '{
  properties: (.data.properties | length),
  operations: (.data.typeOfOperations | length),
  payments: (.data.typeOfPayments | length),
  paymentNames: [.data.typeOfPayments[].name],
  source: .source
}' | tee api-health-check-results/options-prod.json

echo ""
echo "COMPARISON:"
if diff <(curl -s "$LOCAL_URL/api/options" | jq -S '.data.typeOfPayments[].name') \
        <(curl -s "$PROD_URL/api/options" | jq -S '.data.typeOfPayments[].name') > /dev/null; then
    echo "✅ Payment types MATCH"
else
    echo "❌ Payment types DIFFER"
    echo "Local payment types:"
    curl -s "$LOCAL_URL/api/options" | jq '.data.typeOfPayments[].name'
    echo "Production payment types:"
    curl -s "$PROD_URL/api/options" | jq '.data.typeOfPayments[].name'
fi

echo ""
echo ""

echo "=========================================="
echo "2. /api/categories/all - All Categories"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/categories/all" | jq '{
  revenues: (.data.revenues | length),
  operations: (.data.typeOfOperation | length),
  properties: (.data.properties | length),
  payments: (.data.typeOfPayment | length),
  source: .meta.source
}' | tee api-health-check-results/categories-all-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/categories/all" | jq '{
  revenues: (.data.revenues | length),
  operations: (.data.typeOfOperation | length),
  properties: (.data.properties | length),
  payments: (.data.typeOfPayment | length),
  source: .meta.source
}' | tee api-health-check-results/categories-all-prod.json

echo ""
echo ""

echo "=========================================="
echo "3. /api/categories/expenses - Expenses"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/categories/expenses" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  firstFew: (.data.categories[0:3] // [])
}' | tee api-health-check-results/expenses-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/categories/expenses" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  firstFew: (.data.categories[0:3] // [])
}' | tee api-health-check-results/expenses-prod.json

echo ""
echo ""

echo "=========================================="
echo "4. /api/categories/revenues - Revenues"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/categories/revenues" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  revenues: (.data.revenues // [])
}' | tee api-health-check-results/revenues-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/categories/revenues" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  revenues: (.data.revenues // [])
}' | tee api-health-check-results/revenues-prod.json

echo ""
echo ""

echo "=========================================="
echo "5. /api/categories/properties - Properties"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/categories/properties" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  properties: (.data.properties // [])
}' | tee api-health-check-results/properties-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/categories/properties" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  properties: (.data.properties // [])
}' | tee api-health-check-results/properties-prod.json

echo ""
echo ""

echo "=========================================="
echo "6. /api/categories/payments - Payment Types"
echo "=========================================="
echo ""

echo "LOCAL:"
curl -s "$LOCAL_URL/api/categories/payments" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  paymentTypes: (.data.paymentTypes // [])
}' | tee api-health-check-results/payments-local.json

echo ""
echo "PRODUCTION:"
curl -s "$PROD_URL/api/categories/payments" | jq '{
  count: (.data.count // 0),
  source: (.data.source // "unknown"),
  paymentTypes: (.data.paymentTypes // [])
}' | tee api-health-check-results/payments-prod.json

echo ""
echo ""

echo "=========================================="
echo "7. SUMMARY - Critical Checks"
echo "=========================================="
echo ""

# Count checks
LOCAL_PAYMENTS=$(curl -s "$LOCAL_URL/api/options" | jq '.data.typeOfPayments | length')
PROD_PAYMENTS=$(curl -s "$PROD_URL/api/options" | jq '.data.typeOfPayments | length')

LOCAL_PROPERTIES=$(curl -s "$LOCAL_URL/api/options" | jq '.data.properties | length')
PROD_PROPERTIES=$(curl -s "$PROD_URL/api/options" | jq '.data.properties | length')

LOCAL_OPERATIONS=$(curl -s "$LOCAL_URL/api/options" | jq '.data.typeOfOperations | length')
PROD_OPERATIONS=$(curl -s "$PROD_URL/api/options" | jq '.data.typeOfOperations | length')

echo "Payment Types Count:"
echo "  Local: $LOCAL_PAYMENTS"
echo "  Production: $PROD_PAYMENTS"
if [ "$LOCAL_PAYMENTS" = "$PROD_PAYMENTS" ]; then
    echo "  ✅ MATCH"
else
    echo "  ❌ MISMATCH - PRODUCTION ISSUE!"
fi

echo ""
echo "Properties Count:"
echo "  Local: $LOCAL_PROPERTIES"
echo "  Production: $PROD_PROPERTIES"
if [ "$LOCAL_PROPERTIES" = "$PROD_PROPERTIES" ]; then
    echo "  ✅ MATCH"
else
    echo "  ❌ MISMATCH - PRODUCTION ISSUE!"
fi

echo ""
echo "Operations Count:"
echo "  Local: $LOCAL_OPERATIONS"
echo "  Production: $PROD_OPERATIONS"
if [ "$LOCAL_OPERATIONS" = "$PROD_OPERATIONS" ]; then
    echo "  ✅ MATCH"
else
    echo "  ❌ MISMATCH - PRODUCTION ISSUE!"
fi

echo ""
echo "=========================================="
echo "8. Detailed Payment Types Comparison"
echo "=========================================="
echo ""

echo "Expected (Local):"
curl -s "$LOCAL_URL/api/options" | jq '.data.typeOfPayments[].name'

echo ""
echo "Actual (Production):"
curl -s "$PROD_URL/api/options" | jq '.data.typeOfPayments[].name'

echo ""
echo "Missing in Production:"
comm -23 \
  <(curl -s "$LOCAL_URL/api/options" | jq -r '.data.typeOfPayments[].name' | sort) \
  <(curl -s "$PROD_URL/api/options" | jq -r '.data.typeOfPayments[].name' | sort)

echo ""
echo "Extra in Production (shouldn't happen):"
comm -13 \
  <(curl -s "$LOCAL_URL/api/options" | jq -r '.data.typeOfPayments[].name' | sort) \
  <(curl -s "$PROD_URL/api/options" | jq -r '.data.typeOfPayments[].name' | sort)

echo ""
echo "=========================================="
echo "9. Data Source Check"
echo "=========================================="
echo ""

LOCAL_SOURCE=$(curl -s "$LOCAL_URL/api/options" | jq -r '.source')
PROD_SOURCE=$(curl -s "$PROD_URL/api/options" | jq -r '.source')

echo "Local source: $LOCAL_SOURCE"
echo "Production source: $PROD_SOURCE"

if [ "$LOCAL_SOURCE" = "$PROD_SOURCE" ]; then
    echo "✅ Both using: $LOCAL_SOURCE"
else
    echo "⚠️  Different sources!"
    echo "   Local: $LOCAL_SOURCE"
    echo "   Production: $PROD_SOURCE"
fi

echo ""
echo "=========================================="
echo "✅ HEALTH CHECK COMPLETE"
echo "=========================================="
echo ""
echo "Results saved to: api-health-check-results/"
echo ""
echo "Summary:"
echo "  - Payment types: $([ "$LOCAL_PAYMENTS" = "$PROD_PAYMENTS" ] && echo "✅" || echo "❌")"
echo "  - Properties: $([ "$LOCAL_PROPERTIES" = "$PROD_PROPERTIES" ] && echo "✅" || echo "❌")"
echo "  - Operations: $([ "$LOCAL_OPERATIONS" = "$PROD_OPERATIONS" ] && echo "✅" || echo "❌")"
echo "  - Data source: $([ "$LOCAL_SOURCE" = "$PROD_SOURCE" ] && echo "✅" || echo "⚠️ ")"
echo ""

if [ "$LOCAL_PAYMENTS" != "$PROD_PAYMENTS" ] || [ "$LOCAL_PROPERTIES" != "$PROD_PROPERTIES" ] || [ "$LOCAL_OPERATIONS" != "$PROD_OPERATIONS" ]; then
    echo "⚠️  ACTION REQUIRED: Production data differs from local!"
    echo "    Review api-health-check-results/ for details"
    exit 1
else
    echo "✅ All checks passed! Production matches local."
    exit 0
fi
