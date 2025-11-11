# Phase 4: Repository Cleanup Plan

**Date**: November 11, 2025  
**Status**: In Progress  
**Goal**: Production-ready repository for App Store launch

---

## 🔍 Audit Findings

### Critical Issues Found

#### 1. **Sensitive Files in Repository** 🔴 CRITICAL
- `bookmate-bfd43-firebase-adminsdk-fbsvc-7fdcc88f27.json` - Firebase Admin SDK key
- `bookmate-bfd43-firebase-adminsdk-fbsvc-db725e4ba5.json` - Firebase Admin SDK key (duplicate)
- `config/google-credentials.json` - Google credentials file

**Action**: DELETE immediately and verify not in git history

#### 2. **82 Markdown Documentation Files** 🟡 HIGH
Most are legacy planning/debug docs:
- `APPS_SCRIPT_V8.6_TRANSFER_VERIFICATION.md`
- `BACKUP_COMPARISON.md`
- `CLEANUP_ANALYSIS_NOV_9.md`
- `CRITICAL_FIX_API_ENDPOINTS.md`
- `FIREBASE_FIXED_READY_TO_DEPLOY.md`
- `MOBILE_TEAM_OVERHEAD_EXPENSES_FIX.md`
- `PM_TRANSFER_ISSUE_RESOLUTION.md`
- Plus ~75 more

**Action**: Archive to `/docs/archive/` or delete, keep only essential ones

#### 3. **Empty/Test JavaScript Files** 🟡 MEDIUM
- `APPS_SCRIPT_V9_NEW_BALANCE_SYSTEM.js` (0 bytes)
- `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js` (0 bytes)
- `STAGING_TRANSFER_TESTS.js` (0 bytes)
- `TRANSFER_VERIFICATION_TESTS.js` (0 bytes)
- `test-correct-project.js`
- `test-firestore-simple.js`
- `test-firestore.js`
- `test-sendgrid.js`
- `convert-logo.js`

**Action**: DELETE all test/Apps Script files from root

#### 4. **Development Scripts** 🟡 MEDIUM
- `cleanup-project.sh` (empty)
- `set-google-credentials.sh`
- `setup-fonts.sh`
- `test-apis.sh`
- `update-firebase-env.sh`
- `update-vercel-env.sh`
- `verify-optimization.sh`

**Action**: Move to `/scripts/` directory or DELETE if obsolete

#### 5. **Temporary Files** 🟢 LOW
- `.dev-server.pid`
- `dev-server.log`
- `app/settings/page.tsx.pre-fix-backup`
- `app/reports/components/ReportPreview.tsx.backup`

**Action**: DELETE all

#### 6. **Test API Routes** 🟡 MEDIUM
- `app/api/alerts/test/`
- `app/api/test-firestore/`
- `app/api/test-redirect/`
- `app/api/test-sheets/`

**Action**: DELETE test endpoints

#### 7. **Duplicate/Unused Font Files** 🟢 LOW
- `app/fonts/made_mirage/` - MADE Mirage fonts
- `app/fonts/aileron/` - Multiple Aileron variants

**Action**: Keep only fonts actually used in production

#### 8. **Unnecessary Directories** 🟡 MEDIUM
- `src/` - Appears to be React Native mobile app code (not webapp)
- `functions/` - Firebase Functions (may be separate project)
- `prisma/dev.db` - Development database

**Action**: Verify purpose and remove if not needed for webapp

#### 9. **Sentry Template Files** 🟢 LOW
- `sentry.client.config.ts.template`
- `sentry.server.config.ts.template`

**Action**: Keep templates but ensure properly documented

---

## 📋 Cleanup Checklist

### Phase 4.1: Security & Sensitive Data ✅ Priority 1

- [ ] Remove Firebase Admin SDK JSON files
- [ ] Remove Google credentials JSON
- [ ] Verify files not in git history
- [ ] Update `.gitignore` to be comprehensive
- [ ] Run `npx git-secrets --scan`
- [ ] Verify `.env` files not committed

### Phase 4.2: File Cleanup ✅ Priority 2

**Root Directory**:
- [ ] Delete 82 legacy markdown docs (keep essentials)
- [ ] Delete empty JavaScript files
- [ ] Delete test JavaScript files
- [ ] Delete `.dev-server.pid`
- [ ] Delete `dev-server.log`
- [ ] Move/delete shell scripts
- [ ] Keep: `README.md`, `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`

**Test Routes**:
- [ ] Delete `app/api/alerts/test/`
- [ ] Delete `app/api/test-firestore/`
- [ ] Delete `app/api/test-redirect/`
- [ ] Delete `app/api/test-sheets/`

**Backup Files**:
- [ ] Delete `app/settings/page.tsx.pre-fix-backup`
- [ ] Delete `app/reports/components/ReportPreview.tsx.backup`

**Verify Directories**:
- [ ] Check if `src/` is needed (React Native?)
- [ ] Check if `functions/` is needed (Firebase Functions?)
- [ ] Delete `prisma/dev.db`

### Phase 4.3: Codebase Organization ✅ Priority 3

- [ ] Verify `/app` structure (Next.js 15 App Router)
- [ ] Verify `/components` structure
- [ ] Verify `/lib` shared utilities
- [ ] Move global configs to `/config/`
- [ ] Clean up TypeScript (no `any`, unused imports)
- [ ] Organize `/docs` properly

### Phase 4.4: Documentation ✅ Priority 4

**Create/Update**:
- [ ] `README.md` - Concise, production-focused
- [ ] `SECURITY.md` - How secrets are handled
- [ ] `DEPLOYMENT.md` - Vercel deployment instructions
- [ ] `CHANGELOG.md` - Last 3 production updates
- [ ] `LICENSE.md` - MIT or company license

**Essential Docs to Keep**:
- [ ] `PHASE_2_COMPLETE.md`
- [ ] `PHASE_3_IMPLEMENTATION.md`
- [ ] `WEBAPP_PHASE_3_COMPLETION_REPORT.md`
- [ ] `MOBILE_INTEGRATION_CONFIRMATION.md`

**Archive/Delete**:
- [ ] All other `.md` files → move to `/docs/archive/`

### Phase 4.5: Final Verification ✅ Priority 5

- [ ] Run `npm run lint` - Fix all errors
- [ ] Run `npm run build` - Verify zero errors
- [ ] Run `npm run test` (if tests exist)
- [ ] Check Vercel deployment logs
- [ ] Verify `/health` endpoint works
- [ ] Verify `/privacy` and `/terms` pages work

### Phase 4.6: Git Cleanup & Tagging ✅ Priority 6

- [ ] Remove obsolete branches
- [ ] Clean commit history (if needed)
- [ ] Create tag: `v1.0.0-appstore`
- [ ] Push tag to GitHub

---

## 📊 Expected Outcomes

**Before Cleanup**:
- ~82 markdown files in root
- Multiple sensitive credential files
- Test endpoints in production code
- ~600MB repository size

**After Cleanup**:
- ~5 essential markdown files in root
- Zero sensitive files
- Zero test endpoints
- ~300MB repository size (estimated)

**Production Ready**:
- ✅ Clean file structure
- ✅ No security vulnerabilities
- ✅ Professional documentation
- ✅ Passing build pipeline
- ✅ Tagged release

---

## 🚀 Next Steps

1. Execute security cleanup (Priority 1)
2. Execute file cleanup (Priority 2)
3. Organize codebase (Priority 3)
4. Update documentation (Priority 4)
5. Run final verification (Priority 5)
6. Tag release (Priority 6)
7. Generate final audit report

---

**Estimated Time**: 2-3 hours  
**Risk Level**: Low (backup created)  
**Impact**: High (production readiness)
