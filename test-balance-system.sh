#!/bin/bash

###############################################################################
# BookMate Balance System - Comprehensive QA Test Suite
# Generated: November 4, 2025
# 
# This script runs all QA checks from the Balance System QA Report
# Run this after deploying Apps Script V9 and creating API endpoints
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Base URL
BASE_URL=${BASE_URL:-"http://localhost:3000"}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BookMate Balance System QA Test Suite                  ║${NC}"
echo -e "${BLUE}║  Testing: $BASE_URL                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Helper Functions
###############################################################################

test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

test_skip() {
    echo -e "${YELLOW}⏭️  SKIP${NC}: $1"
    ((SKIPPED++))
}

section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

###############################################################################
# 0. Pre-Flight Checks
###############################################################################

section "0️⃣  PRE-FLIGHT CHECKS"

# Check environment variables
if [ -f .env.local ]; then
    test_pass "Environment file .env.local exists"
    
    if grep -q "GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8" .env.local; then
        test_pass "GOOGLE_SHEET_ID correctly configured"
    else
        test_fail "GOOGLE_SHEET_ID not found or incorrect"
    fi
    
    if grep -q "SHEETS_WEBHOOK_URL=" .env.local && grep -q "https://script.google.com" .env.local; then
        test_pass "SHEETS_WEBHOOK_URL configured"
    else
        test_fail "SHEETS_WEBHOOK_URL not configured"
    fi
    
    if grep -q "FEATURE_BALANCE_PHASE2=true" .env.local; then
        test_pass "FEATURE_BALANCE_PHASE2 enabled"
    else
        test_skip "FEATURE_BALANCE_PHASE2 not enabled"
    fi
else
    test_fail "Environment file .env.local not found"
fi

# Check if server is running
if curl -s "$BASE_URL" > /dev/null 2>&1; then
    test_pass "Server is running at $BASE_URL"
else
    test_fail "Server is NOT running at $BASE_URL"
    echo ""
    echo -e "${RED}Please start the dev server with: npm run dev${NC}"
    exit 1
fi

###############################################################################
# 1. API Endpoint Tests
###############################################################################

section "1️⃣  API ENDPOINT TESTS"

# Test 1.1: GET /api/options
echo "Testing: GET /api/options"
RESPONSE=$(curl -s "$BASE_URL/api/options")
if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    test_pass "/api/options returns ok:true"
    
    # Check for required fields
    if echo "$RESPONSE" | jq -e '.data.typeOfPayments' > /dev/null 2>&1; then
        test_pass "/api/options has typeOfPayments"
    else
        test_fail "/api/options missing typeOfPayments"
    fi
    
    if echo "$RESPONSE" | jq -e '.data.properties' > /dev/null 2>&1; then
        test_pass "/api/options has properties"
    else
        test_fail "/api/options missing properties"
    fi
else
    test_fail "/api/options failed or returned ok:false"
fi

# Test 1.2: GET /api/balance/summary
echo ""
echo "Testing: GET /api/balance/summary"
RESPONSE=$(curl -s "$BASE_URL/api/balance/summary")
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        test_pass "/api/balance/summary endpoint working"
        
        # Check for data structure
        if echo "$RESPONSE" | jq -e '.data.accounts' > /dev/null 2>&1; then
            ACCOUNT_COUNT=$(echo "$RESPONSE" | jq -r '.data.accounts | length')
            test_pass "/api/balance/summary has $ACCOUNT_COUNT accounts"
        else
            test_fail "/api/balance/summary missing accounts array"
        fi
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        test_fail "/api/balance/summary returned error: $ERROR_MSG"
    fi
else
    test_fail "/api/balance/summary not responding correctly"
fi

# Test 1.3: GET /api/balance/get
echo ""
echo "Testing: GET /api/balance/get"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/balance/get" -H "Content-Type: application/json")
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    test_pass "/api/balance/get endpoint exists"
else
    test_fail "/api/balance/get not responding"
fi

# Test 1.4: GET /api/v9/transactions
echo ""
echo "Testing: GET /api/v9/transactions"
RESPONSE=$(curl -s "$BASE_URL/api/v9/transactions?month=ALL")
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        test_pass "/api/v9/transactions endpoint working"
        
        if echo "$RESPONSE" | jq -e '.data.transactions' > /dev/null 2>&1; then
            TRANS_COUNT=$(echo "$RESPONSE" | jq -r '.data.transactions | length')
            test_pass "/api/v9/transactions returned $TRANS_COUNT transactions"
        fi
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        test_fail "/api/v9/transactions returned error: $ERROR_MSG"
    fi
else
    test_fail "/api/v9/transactions not responding correctly"
fi

# Test 1.5: GET /api/v9/accounts/sync
echo ""
echo "Testing: GET /api/v9/accounts/sync"
RESPONSE=$(curl -s "$BASE_URL/api/v9/accounts/sync")
if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    test_pass "/api/v9/accounts/sync endpoint exists"
else
    test_fail "/api/v9/accounts/sync not responding"
fi

###############################################################################
# 2. Transaction Creation Tests
###############################################################################

section "2️⃣  TRANSACTION CREATION TESTS"

echo -e "${YELLOW}Note: These tests will create actual data in Google Sheets${NC}"
echo -e "${YELLOW}Only run if you want to test end-to-end functionality${NC}"
echo ""
read -p "Run transaction creation tests? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    
    # Test 2.1: Create Revenue Transaction
    echo ""
    echo "Testing: POST /api/v9/transactions (Revenue)"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
        -H "Content-Type: application/json" \
        -d '{
            "date": "2025-11-04",
            "fromAccount": "",
            "toAccount": "Cash",
            "amount": 100,
            "type": "Revenue",
            "detail": "QA Test - Revenue",
            "month": "NOV"
        }')
    
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        ROW=$(echo "$RESPONSE" | jq -r '.rowAdded // "unknown"')
        test_pass "Revenue transaction created (row $ROW)"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        test_fail "Revenue transaction failed: $ERROR_MSG"
    fi
    
    # Test 2.2: Create Expense Transaction
    echo ""
    echo "Testing: POST /api/v9/transactions (Expense)"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
        -H "Content-Type: application/json" \
        -d '{
            "date": "2025-11-04",
            "fromAccount": "Cash",
            "toAccount": "",
            "amount": 40,
            "type": "Expense",
            "detail": "QA Test - Expense",
            "month": "NOV"
        }')
    
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        ROW=$(echo "$RESPONSE" | jq -r '.rowAdded // "unknown"')
        test_pass "Expense transaction created (row $ROW)"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        test_fail "Expense transaction failed: $ERROR_MSG"
    fi
    
    # Test 2.3: Create Transfer Transaction
    echo ""
    echo "Testing: POST /api/v9/transactions (Transfer)"
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
        -H "Content-Type: application/json" \
        -d '{
            "date": "2025-11-04",
            "fromAccount": "Cash",
            "toAccount": "Bank",
            "amount": 60,
            "type": "Transfer",
            "detail": "QA Test - Transfer",
            "month": "NOV"
        }')
    
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        ROW=$(echo "$RESPONSE" | jq -r '.rowAdded // "unknown"')
        test_pass "Transfer transaction created (row $ROW)"
    else
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        test_fail "Transfer transaction failed: $ERROR_MSG"
    fi
    
    # Test 2.4: Verify Balance Updated
    echo ""
    echo "Waiting 2 seconds for sheets to recalculate..."
    sleep 2
    
    echo "Verifying balance updates..."
    RESPONSE=$(curl -s "$BASE_URL/api/balance/summary")
    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        # Expected: Cash should reflect all 3 transactions
        CASH_BALANCE=$(echo "$RESPONSE" | jq -r '.data.accounts[] | select(.account=="Cash") | .currentBalance // "N/A"')
        if [ "$CASH_BALANCE" != "N/A" ]; then
            test_pass "Cash balance updated to: $CASH_BALANCE"
        else
            test_fail "Cash account not found in balance summary"
        fi
    else
        test_fail "Could not verify balance update"
    fi
    
else
    test_skip "Transaction creation tests (user declined)"
    test_skip "Revenue transaction test"
    test_skip "Expense transaction test"
    test_skip "Transfer transaction test"
    test_skip "Balance verification test"
fi

###############################################################################
# 3. Validation Tests
###############################################################################

section "3️⃣  VALIDATION TESTS"

# Test 3.1: Missing required field
echo "Testing: Transaction validation (missing field)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
    -H "Content-Type: application/json" \
    -d '{
        "date": "2025-11-04",
        "amount": 100,
        "type": "Revenue"
    }')

if echo "$RESPONSE" | jq -e '.ok == false' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
    if echo "$ERROR_MSG" | grep -q "Missing"; then
        test_pass "Validation correctly rejects missing fields"
    else
        test_fail "Validation error message incorrect: $ERROR_MSG"
    fi
else
    test_fail "Validation did not catch missing fields"
fi

# Test 3.2: Revenue without toAccount
echo ""
echo "Testing: Revenue validation (missing toAccount)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
    -H "Content-Type: application/json" \
    -d '{
        "date": "2025-11-04",
        "fromAccount": "",
        "toAccount": "",
        "amount": 100,
        "type": "Revenue",
        "detail": "Test",
        "month": "NOV"
    }')

if echo "$RESPONSE" | jq -e '.ok == false' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
    if echo "$ERROR_MSG" | grep -qi "toAccount"; then
        test_pass "Validation correctly requires toAccount for revenue"
    else
        test_fail "Validation error message incorrect: $ERROR_MSG"
    fi
else
    test_fail "Validation did not catch missing toAccount"
fi

###############################################################################
# 4. Performance Tests
###############################################################################

section "4️⃣  PERFORMANCE TESTS"

echo "Testing: Response time for /api/options"
START=$(date +%s%N)
curl -s "$BASE_URL/api/options" > /dev/null
END=$(date +%s%N)
ELAPSED=$((($END - $START) / 1000000))  # Convert to milliseconds

if [ $ELAPSED -lt 2000 ]; then
    test_pass "/api/options responded in ${ELAPSED}ms (< 2s target)"
else
    test_fail "/api/options responded in ${ELAPSED}ms (> 2s target)"
fi

echo ""
echo "Testing: Response time for /api/balance/summary"
START=$(date +%s%N)
curl -s "$BASE_URL/api/balance/summary" > /dev/null
END=$(date +%s%N)
ELAPSED=$((($END - $START) / 1000000))

if [ $ELAPSED -lt 2000 ]; then
    test_pass "/api/balance/summary responded in ${ELAPSED}ms (< 2s target)"
else
    test_fail "/api/balance/summary responded in ${ELAPSED}ms (> 2s target)"
fi

###############################################################################
# 5. Data Integrity Tests
###############################################################################

section "5️⃣  DATA INTEGRITY TESTS"

# Test 5.1: Options data structure
echo "Testing: Options data structure"
RESPONSE=$(curl -s "$BASE_URL/api/options")
if echo "$RESPONSE" | jq -e '.data.typeOfPayments | type == "array"' > /dev/null 2>&1; then
    test_pass "typeOfPayments is an array"
else
    test_fail "typeOfPayments is not an array"
fi

if echo "$RESPONSE" | jq -e '.data.properties | type == "array"' > /dev/null 2>&1; then
    test_pass "properties is an array"
else
    test_fail "properties is not an array"
fi

# Test 5.2: Balance summary data structure
echo ""
echo "Testing: Balance summary data structure"
RESPONSE=$(curl -s "$BASE_URL/api/balance/summary")
if echo "$RESPONSE" | jq -e '.data.accounts | type == "array"' > /dev/null 2>&1; then
    test_pass "accounts is an array"
    
    # Check first account has required fields
    FIRST_ACCOUNT=$(echo "$RESPONSE" | jq -r '.data.accounts[0]')
    if echo "$FIRST_ACCOUNT" | jq -e '.account' > /dev/null 2>&1; then
        test_pass "Account has 'account' field"
    fi
    
    if echo "$FIRST_ACCOUNT" | jq -e '.currentBalance' > /dev/null 2>&1; then
        test_pass "Account has 'currentBalance' field"
    fi
else
    test_fail "accounts is not an array"
fi

###############################################################################
# 6. Cache-Busting Tests
###############################################################################

section "6️⃣  CACHE-BUSTING TESTS"

echo "Testing: Cache-busting parameter accepted"
RESPONSE1=$(curl -s "$BASE_URL/api/options?t=12345")
RESPONSE2=$(curl -s "$BASE_URL/api/options?t=67890")

if echo "$RESPONSE1" | jq -e '.ok == true' > /dev/null 2>&1 && \
   echo "$RESPONSE2" | jq -e '.ok == true' > /dev/null 2>&1; then
    test_pass "API accepts cache-busting parameter"
else
    test_fail "API fails with cache-busting parameter"
fi

###############################################################################
# 7. Error Handling Tests
###############################################################################

section "7️⃣  ERROR HANDLING TESTS"

# Test 7.1: Invalid JSON
echo "Testing: Invalid JSON handling"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v9/transactions" \
    -H "Content-Type: application/json" \
    -d '{invalid json}')

if echo "$RESPONSE" | jq -e '.ok == false' > /dev/null 2>&1; then
    test_pass "API handles invalid JSON gracefully"
else
    test_fail "API did not handle invalid JSON"
fi

# Test 7.2: Non-existent month filter
echo ""
echo "Testing: Invalid month filter"
RESPONSE=$(curl -s "$BASE_URL/api/v9/transactions?month=INVALID")
if echo "$RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    test_pass "API handles invalid month parameter"
else
    test_fail "API crashes on invalid month"
fi

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⏭️  Skipped: $SKIPPED${NC}"
echo ""
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate: ${SUCCESS_RATE}%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! Balance System is ready!         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  SOME TESTS FAILED - Review results above           ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
