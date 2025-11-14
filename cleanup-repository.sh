#!/bin/bash

# BookMate Directory Cleanup Script
# Date: November 14, 2025
# Purpose: Safely organize and cleanup repository files

set -e  # Exit on error

echo "🧹 BookMate Directory Cleanup Script"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in BookMate root directory!${NC}"
    echo "Please run this script from /Users/shaunducker/Desktop/BookMate-webapp"
    exit 1
fi

echo -e "${YELLOW}⚠️  IMPORTANT: This script will reorganize your files.${NC}"
echo "   A git commit is recommended before proceeding."
echo ""
read -p "Have you committed your current changes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please commit your changes first, then run this script again."
    exit 1
fi

echo ""
echo "Starting cleanup in 3 seconds... (Ctrl+C to cancel)"
sleep 3

# ============================================================================
# PHASE 1: CREATE DIRECTORY STRUCTURE
# ============================================================================

echo ""
echo -e "${GREEN}Phase 1: Creating directory structure...${NC}"

mkdir -p docs/archive/old-root-docs
mkdir -p docs/archive/old-setup-guides
mkdir -p scripts/archive/old-admin-scripts
mkdir -p scripts/archive/old-test-scripts
mkdir -p tests/integration
mkdir -p temp/old-secrets  # Temporary folder for secret files

echo "✓ Directory structure created"

# ============================================================================
# PHASE 2: DOCUMENTATION CLEANUP (125+ files!)
# ============================================================================

echo ""
echo -e "${GREEN}Phase 2: Moving documentation files...${NC}"
echo "   (Keeping README.md in root)"

# Count files to move
MD_COUNT=$(find . -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "COMPREHENSIVE_DIRECTORY_AUDIT.md" | wc -l | xargs)
echo "   Found $MD_COUNT .md files to move"

# Move all .md files except README.md and the audit file
find . -maxdepth 1 -name "*.md" \
    ! -name "README.md" \
    ! -name "COMPREHENSIVE_DIRECTORY_AUDIT.md" \
    -exec mv {} docs/archive/old-root-docs/ \;

echo "✓ Moved $MD_COUNT documentation files to docs/archive/old-root-docs/"

# ============================================================================
# PHASE 3: ENVIRONMENT FILE CLEANUP
# ============================================================================

echo ""
echo -e "${GREEN}Phase 3: Cleaning up environment files...${NC}"

# Remove temporary/backup environment files
if [ -f ".env.local.tmp" ]; then
    rm .env.local.tmp
    echo "✓ Deleted .env.local.tmp (empty temporary file)"
fi

if [ -f ".env.local.bak" ]; then
    mv .env.local.bak temp/old-secrets/
    echo "✓ Moved .env.local.bak to temp/old-secrets/ (verify before final deletion)"
fi

echo "✓ Environment files cleaned"
echo "   Kept: .env.local, .env.example, .env.local.example"

# ============================================================================
# PHASE 4: SECRET FILE CONSOLIDATION
# ============================================================================

echo ""
echo -e "${GREEN}Phase 4: Consolidating secret files...${NC}"
echo -e "${YELLOW}   ⚠️  Moving (not deleting) secret files to temp/old-secrets/${NC}"
echo "   Review these files and verify secrets are in .env.local before deleting!"

# Move secret files to temporary location
SECRET_FILES=(
    "COPY_THIS_TO_VERCEL.txt"
    "COPY_TO_VERCEL.txt"
    "VERCEL_ENV_VALUES.txt"
    "FINAL_VERCEL_KEY.txt"
    "NEW_VERCEL_KEY.txt"
    "FIREBASE_PRIVATE_KEY.txt"
    "firebase-private-key-one-line.txt"
)

for file in "${SECRET_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" temp/old-secrets/
        echo "   ✓ Moved $file"
    fi
done

echo "✓ Secret files moved to temp/old-secrets/"
echo "   ${YELLOW}ACTION REQUIRED: Review and delete temp/old-secrets/ after verification${NC}"

# ============================================================================
# PHASE 5: SCRIPT ORGANIZATION
# ============================================================================

echo ""
echo -e "${GREEN}Phase 5: Organizing scripts...${NC}"

# Move duplicate admin creation scripts
if [ -d "scripts" ]; then
    # Find and move duplicate create-admin scripts (keep create-siamoon-admin.ts)
    find scripts -maxdepth 1 -name "create-admin-*.ts" \
        ! -name "create-siamoon-admin.ts" \
        -exec mv {} scripts/archive/old-admin-scripts/ \; 2>/dev/null || true
    
    find scripts -maxdepth 1 -name "create-admin-*.js" \
        -exec mv {} scripts/archive/old-admin-scripts/ \; 2>/dev/null || true
    
    find scripts -maxdepth 1 -name "create-admin-*.mjs" \
        -exec mv {} scripts/archive/old-admin-scripts/ \; 2>/dev/null || true
    
    echo "✓ Archived duplicate admin creation scripts"
fi

# ============================================================================
# PHASE 6: TEST FILE ORGANIZATION
# ============================================================================

echo ""
echo -e "${GREEN}Phase 6: Organizing test files...${NC}"

# Move test and verification scripts from root
TEST_FILES=(
    "test-scope-permissions.mjs"
    "test-service-account.mjs"
    "test-sheets-create.mjs"
    "test-template-copy.mjs"
    "verify-db-data.mjs"
    "list-service-account-files.mjs"
    "list-shared-drives.mjs"
    "provision-existing-users.mjs"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" tests/integration/
        echo "   ✓ Moved $file to tests/integration/"
    fi
done

echo "✓ Test files organized"

# ============================================================================
# PHASE 7: UTILITY & LOG CLEANUP
# ============================================================================

echo ""
echo -e "${GREEN}Phase 7: Cleaning up logs and utilities...${NC}"

# Delete log files
if [ -f "dev-server.log" ]; then
    rm dev-server.log
    echo "✓ Deleted dev-server.log"
fi

if [ -f "logs_result.csv" ]; then
    rm logs_result.csv
    echo "✓ Deleted logs_result.csv"
fi

# Move utility scripts
if [ -f "fix-expense-auth.js" ]; then
    mv fix-expense-auth.js scripts/archive/
    echo "✓ Moved fix-expense-auth.js to scripts/archive/"
fi

if [ -f "fix-supabase-rls.sql" ]; then
    mv fix-supabase-rls.sql docs/archive/old-setup-guides/
    echo "✓ Moved fix-supabase-rls.sql to docs/archive/"
fi

echo "✓ Logs and utilities cleaned"

# ============================================================================
# PHASE 8: BACKUP FILE CLEANUP
# ============================================================================

echo ""
echo -e "${GREEN}Phase 8: Removing backup files...${NC}"

# Remove backup files from app/settings
if [ -f "app/settings/page.tsx.SAFE_BACKUP_20251109_184942" ]; then
    rm app/settings/page.tsx.SAFE_BACKUP_20251109_184942
    echo "✓ Deleted app/settings/page.tsx.SAFE_BACKUP_20251109_184942"
fi

if [ -f "app/settings/page.tsx.before-sidebar-fix" ]; then
    rm app/settings/page.tsx.before-sidebar-fix
    echo "✓ Deleted app/settings/page.tsx.before-sidebar-fix"
fi

echo "✓ Backup files removed"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "======================================="
echo -e "${GREEN}✅ Cleanup Complete!${NC}"
echo "======================================="
echo ""
echo "📊 Summary:"
echo "   ✓ Moved $MD_COUNT documentation files to docs/archive/"
echo "   ✓ Cleaned up environment files"
echo "   ✓ Organized secret files (review temp/old-secrets/)"
echo "   ✓ Archived duplicate scripts"
echo "   ✓ Organized test files"
echo "   ✓ Deleted log files"
echo "   ✓ Removed backup files"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "   1. Review temp/old-secrets/ folder"
echo "   2. Verify all secrets are in .env.local"
echo "   3. Delete temp/old-secrets/ after verification"
echo "   4. Test the application: npm run dev"
echo "   5. Commit changes: git add . && git commit -m 'chore: organize and cleanup repository structure'"
echo ""
echo -e "${GREEN}🎉 Your repository is now clean and organized!${NC}"
echo ""
