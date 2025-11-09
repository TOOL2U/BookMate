#!/bin/bash

# Test all API endpoints used by optimized pages
echo "🧪 Testing BookMate WebApp APIs..."
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response" -eq 200 ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# Test all endpoints
echo "📊 Dashboard APIs:"
test_endpoint "P&L Data" "/api/pnl"
test_endpoint "Balances" "/api/balances"
test_endpoint "Overhead Categories" "/api/overhead-expenses"
test_endpoint "Property Categories" "/api/property-categories"
echo ""

echo "💰 Balance APIs:"
test_endpoint "Options (Banks)" "/api/options"
echo ""

echo "⚙️ Settings APIs:"
test_endpoint "Options (Categories)" "/api/options"
test_endpoint "Category Sync Status" "/api/categories/sync"
echo ""

echo "=================================="
echo "🎉 API testing complete!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/dashboard"
echo "2. Open React Query DevTools (bottom right)"
echo "3. Check browser console for performance logs"
echo "4. Navigate between pages to test caching"
