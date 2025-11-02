#!/bin/bash

# Test all Vercel production endpoints
# URL: https://accounting.siamoon.com

BASE_URL="https://accounting.siamoon.com"
SECRET="${SHEETS_WEBHOOK_SECRET}"

echo "=========================================="
echo "  Testing Vercel Production Endpoints"
echo "=========================================="
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        if echo "$body" | jq -e '.ok' > /dev/null 2>&1; then
            echo "  Response: $(echo "$body" | jq -c '{ok: .ok, message: .message // .error // "success"}')"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        echo "  Error: $(echo "$body" | head -c 200)"
    fi
    echo ""
}

# Test 1: Health check (home page)
test_endpoint "Home Page" "$BASE_URL/" "GET"

# Test 2: P&L Data
test_endpoint "P&L Data (GET)" "$BASE_URL/api/pnl" "GET"

# Test 3: Inbox
test_endpoint "Inbox (GET)" "$BASE_URL/api/inbox" "GET"

# Test 4: Balance - Get
test_endpoint "Balance Get" "$BASE_URL/api/balance/get" "POST" '{}'

# Test 5: Balance - By Property
test_endpoint "Balance By Property" "$BASE_URL/api/balance/by-property" "POST" '{}'

# Test 6: P&L Named Ranges
test_endpoint "P&L Named Ranges (List)" "$BASE_URL/api/pnl/namedRanges" "GET"

# Test 7: P&L Property/Person Expenses
test_endpoint "P&L Property/Person (Year)" "$BASE_URL/api/pnl/property-person" "POST" '{"period":"year"}'

# Test 8: P&L Overhead Expenses
test_endpoint "P&L Overhead (Year)" "$BASE_URL/api/pnl/overhead-expenses" "POST" '{"period":"year"}'

# Test 9: Health check via API
test_endpoint "API Health" "$BASE_URL/api/health" "GET"

echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "Total: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All endpoint tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some endpoint tests failed${NC}"
    exit 1
fi
