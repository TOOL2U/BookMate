#!/bin/bash

# Comprehensive Vercel Endpoint Test
# Tests all production endpoints with detailed output

BASE_URL="https://bookmate.siamoon.com"

echo "=========================================="
echo "  Vercel Production Endpoint Tests"
echo "  URL: $BASE_URL"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Test P&L Data
echo "1️⃣  Testing P&L Data (GET /api/pnl)..."
response=$(curl -s "$BASE_URL/api/pnl")
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    echo "   ✅ PASS - P&L data fetched successfully"
    echo "   Data: $(echo "$response" | jq -c '{month_revenue: .data.month.revenue, year_revenue: .data.year.revenue}')"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - P&L data fetch failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test Inbox
echo "2️⃣  Testing Inbox (GET /api/inbox)..."
response=$(curl -s "$BASE_URL/api/inbox")
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.data | length')
    echo "   ✅ PASS - Inbox fetched successfully"
    echo "   Transaction count: $count"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Inbox fetch failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test Balance Get
echo "3️⃣  Testing Balance Get (POST /api/balance/get)..."
response=$(curl -s -X POST "$BASE_URL/api/balance/get" -H "Content-Type: application/json" -d '{}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    echo "   ✅ PASS - Balance data fetched successfully"
    echo "   Response: $(echo "$response" | jq -c '{ok: .ok, count: (.balances | length)}')"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Balance get failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test Balance By Property
echo "4️⃣  Testing Balance By Property (POST /api/balance/by-property)..."
response=$(curl -s -X POST "$BASE_URL/api/balance/by-property" -H "Content-Type: application/json" -d '{}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    echo "   ✅ PASS - Balance by property fetched successfully"
    count=$(echo "$response" | jq '.propertyBalances | length')
    total=$(echo "$response" | jq '.summary.totalBalance')
    echo "   Properties: $count, Total Balance: $total"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Balance by property failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test P&L Named Ranges
echo "5️⃣  Testing P&L Named Ranges (GET /api/pnl/namedRanges)..."
response=$(curl -s "$BASE_URL/api/pnl/namedRanges")
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.ranges | length')
    echo "   ✅ PASS - Named ranges fetched successfully"
    echo "   Named ranges count: $count"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Named ranges fetch failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test P&L Property/Person Expenses (Year)
echo "6️⃣  Testing P&L Property/Person - Year (POST /api/pnl/property-person)..."
response=$(curl -s -X POST "$BASE_URL/api/pnl/property-person" -H "Content-Type: application/json" -d '{"period":"year"}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.data | length')
    total=$(echo "$response" | jq '.total')
    echo "   ✅ PASS - Property/Person expenses fetched"
    echo "   Items: $count, Total: $total"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Property/Person expenses failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test P&L Property/Person Expenses (Month)
echo "7️⃣  Testing P&L Property/Person - Month (POST /api/pnl/property-person)..."
response=$(curl -s -X POST "$BASE_URL/api/pnl/property-person" -H "Content-Type: application/json" -d '{"period":"month"}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.data | length')
    total=$(echo "$response" | jq '.total')
    echo "   ✅ PASS - Property/Person expenses fetched"
    echo "   Items: $count, Total: $total"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Property/Person expenses failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test P&L Overhead Expenses (Year)
echo "8️⃣  Testing P&L Overhead - Year (POST /api/pnl/overhead-expenses)..."
response=$(curl -s -X POST "$BASE_URL/api/pnl/overhead-expenses" -H "Content-Type: application/json" -d '{"period":"year"}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.data | length')
    total=$(echo "$response" | jq '.total')
    echo "   ✅ PASS - Overhead expenses fetched"
    echo "   Items: $count, Total: $total"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Overhead expenses failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test P&L Overhead Expenses (Month)
echo "9️⃣  Testing P&L Overhead - Month (POST /api/pnl/overhead-expenses)..."
response=$(curl -s -X POST "$BASE_URL/api/pnl/overhead-expenses" -H "Content-Type: application/json" -d '{"period":"month"}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    count=$(echo "$response" | jq '.data | length')
    total=$(echo "$response" | jq '.total')
    echo "   ✅ PASS - Overhead expenses fetched"
    echo "   Items: $count, Total: $total"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Overhead expenses failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test Update Named Ranges
echo "🔟 Testing Update Named Ranges (POST /api/pnl/namedRanges)..."
response=$(curl -s -X POST "$BASE_URL/api/pnl/namedRanges" -H "Content-Type: application/json" -d '{"action":"update"}')
if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
    updated=$(echo "$response" | jq '.updated')
    echo "   ✅ PASS - Named ranges update successful"
    echo "   Updated: $updated"
    PASSED=$((PASSED + 1))
else
    echo "   ❌ FAIL - Named ranges update failed"
    echo "   Error: $(echo "$response" | jq -r '.error // "Unknown error"')"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo "Total Tests: $((PASSED + FAILED))"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All Vercel endpoints are working!"
    exit 0
else
    echo "⚠️  Some endpoints failed. Check the errors above."
    exit 1
fi
