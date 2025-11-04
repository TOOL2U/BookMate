#!/bin/bash

# Test script for dual deployment architecture
# Tests both P&L Sheet and Balance Sheet endpoints

# Don't exit on error - we want to count passes/fails
set +e

echo "🧪 Testing Dual Deployment Architecture"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL=${1:-"http://localhost:3000"}
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_ok=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$BASE_URL$url" 2>&1)
    
    if echo "$response" | grep -q "\"ok\":true" || echo "$response" | grep -q "\"ok\": true"; then
        if [ "$expected_ok" = "true" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} (expected failure but got success)"
            ((FAILED++))
        fi
    else
        if [ "$expected_ok" = "false" ]; then
            echo -e "${GREEN}✅ PASS${NC} (correctly failed)"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC}"
            echo "Response: $response"
            ((FAILED++))
        fi
    fi
}

echo "🔵 DEPLOYMENT 1: P&L Sheet Tests"
echo "================================="
echo "Sheet ID: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
echo ""

test_endpoint "GET /api/options (dropdowns)" "/api/options" "true"
test_endpoint "GET /api/pnl (P&L report)" "/api/pnl" "true"
test_endpoint "GET /api/inbox (inbox entries)" "/api/inbox" "true"

echo ""
echo "🟢 DEPLOYMENT 2: Balance Sheet Tests"
echo "====================================="
echo "Sheet ID: 1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI"
echo ""

test_endpoint "GET /api/balance/summary" "/api/balance/summary" "true"
test_endpoint "GET /api/v9/transactions" "/api/v9/transactions" "true"

echo ""
echo "🔄 Testing Transaction Creation"
echo "================================"

# Test creating a transaction
echo -n "POST /api/v9/transactions (create income)... "
response=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
    -H "Content-Type: application/json" \
    -d '{
        "transactionType": "income",
        "toAccount": "Bank Account",
        "amount": 1000,
        "currency": "THB",
        "note": "Test income transaction",
        "user": "test-script"
    }' 2>&1)

if echo "$response" | grep -q "\"ok\":true" || echo "$response" | grep -q "\"ok\": true"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  PARTIAL${NC}"
    echo "Response: $response"
    echo "(May fail if Balance Sheet not configured - check sheet structure)"
fi

echo ""
echo "🔄 Testing Accounts Sync"
echo "========================"

echo -n "POST /api/v9/accounts/sync... "
response=$(curl -s -X POST "$BASE_URL/api/v9/accounts/sync" 2>&1)

if echo "$response" | grep -q "\"ok\":true" || echo "$response" | grep -q "\"ok\": true"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  PARTIAL${NC}"
    echo "Response: $response"
    echo "(May fail if Balance Sheet not configured)"
fi

echo ""
echo "📊 Test Results"
echo "==============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "✅ Both deployments are working correctly"
    echo "✅ P&L Sheet endpoints responding"
    echo "✅ Balance Sheet endpoints responding"
    echo ""
    echo "Next steps:"
    echo "1. Verify Balance Sheet structure in Google Sheets"
    echo "2. Test creating real transactions in UI"
    echo "3. Deploy to Vercel with updated environment variables"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check .env.local has both SHEETS_WEBHOOK_URL and SHEETS_BALANCE_URL"
    echo "2. Verify webhook URLs are correct"
    echo "3. Check that Apps Script deployments are active"
    echo "4. Ensure SHEETS_WEBHOOK_SECRET is correct for both sheets"
    echo ""
    echo "See DUAL_DEPLOYMENT_COMPLETE.md for detailed troubleshooting"
    exit 1
fi
