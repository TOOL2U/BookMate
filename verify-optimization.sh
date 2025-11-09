#!/bin/bash

echo "🔍 Verifying Performance Optimization..."
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2 (MISSING)"
        return 1
    fi
}

echo -e "${BLUE}📁 Infrastructure Files:${NC}"
check_file "components/providers/QueryProvider.tsx" "QueryProvider"
check_file "lib/api.ts" "API Layer"
check_file "hooks/useQueries.ts" "React Query Hooks"
check_file "components/ui/Skeleton.tsx" "Skeleton Loaders"
check_file "lib/performance.ts" "Performance Monitoring"
echo ""

echo -e "${BLUE}📄 Optimized Pages:${NC}"
check_file "app/dashboard/page.tsx" "Dashboard (optimized)"
check_file "app/pnl/page.tsx" "P&L (optimized)"
check_file "app/balance/page.tsx" "Balance (optimized)"
check_file "app/settings/page.tsx" "Settings (optimized)"
echo ""

echo -e "${BLUE}💾 Backup Files:${NC}"
check_file "app/dashboard/page.tsx.backup" "Dashboard backup"
check_file "app/pnl/page.tsx.backup" "P&L backup"
check_file "app/balance/page.tsx.backup" "Balance backup"
check_file "app/settings/page.tsx.backup" "Settings backup"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
check_file "OPTIMIZATION_SUMMARY.md" "Summary Report"
check_file "BACKUP_COMPARISON.md" "Backup Comparison"
check_file "PERFORMANCE_COMPLETE.md" "Completion Report"
check_file "test-apis.sh" "API Test Script"
echo ""

echo "========================================"
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. npm run dev"
echo "2. Visit http://localhost:3000/dashboard"
echo "3. Check React Query DevTools (bottom right)"
echo "4. See performance logs in browser console"

