# Post-Deployment Testing Guide

## Deployment Status
- ✅ Code pushed to GitHub (commit: `dc241d1`)
- ⏳ Waiting for Vercel deployment
- 📋 Testing required before declaring success

## Quick Test Steps

### 1. Wait for Vercel Deployment
Check Vercel dashboard: https://vercel.com/tool2u/bookmate-webapp

Or run:
```bash
vercel logs --follow
```

Look for: `✅ Production deployment complete`

### 2. Test Tommy's Account (CRITICAL)
**Login**: tommy@gmail.com
**Expected Spreadsheet ID**: `1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g`

**Test Checklist**:
- [ ] Can login successfully
- [ ] Dashboard loads without 404 errors
- [ ] See Tommy's data (NOT Shaun's admin data)
- [ ] P&L page loads and shows correct data
- [ ] Balance page loads and shows correct data
- [ ] Inbox/Activity page loads
- [ ] Analytics dropdown options populate

**What to look for in Browser Console** (F12 → Console):
```
✅ GOOD: Data loads successfully
❌ BAD: "Failed to fetch" or 404 errors
❌ BAD: "Requested entity was not found"
```

### 3. Test Admin Account (Verification)
**Login**: shaun@siamoon.com
**Expected Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

**Test Checklist**:
- [ ] Can login successfully
- [ ] Dashboard loads with admin data
- [ ] All pages work correctly

### 4. Check Vercel Runtime Logs
```bash
# Watch real-time logs
vercel logs --follow

# Or check specific function logs
vercel logs /api/options
vercel logs /api/balance
```

**Look for**:
```
✅ GOOD: "Using spreadsheet: 1aGXG-vcOVQkYb7..."
✅ GOOD: Successful API responses

❌ BAD: "Error: Requested entity was not found"
❌ BAD: 404 status codes
❌ BAD: "GaxiosError: Request failed with status code 404"
```

### 5. Test Data Isolation (CRITICAL)
**Goal**: Confirm Tommy sees ONLY his data, not Shaun's

**How to verify**:
1. Login as Tommy
2. Note the data shown (numbers, properties, etc.)
3. Logout
4. Login as Shaun
5. Verify the data is DIFFERENT
6. Logout
7. Login as Tommy again
8. Verify he sees the SAME data as step 2 (his data, not Shaun's)

## Success Criteria
All of these must be TRUE:
- ✅ Tommy can login and see data
- ✅ No 404 "Requested entity was not found" errors
- ✅ Tommy sees his own data (not Shaun's)
- ✅ Shaun sees his own data (not Tommy's)
- ✅ All pages load without errors
- ✅ Vercel logs show no 404 errors for spreadsheet access

## Failure Indicators
If ANY of these occur, the fix didn't work:
- ❌ 404 errors in console or Vercel logs
- ❌ "Requested entity was not found" errors
- ❌ Tommy sees Shaun's data (or vice versa)
- ❌ Empty data when it should have content
- ❌ Infinite loading states

## If Tests PASS ✅
The fix worked! All three layers of the multi-tenant isolation are now complete:
1. ✅ Server-side cache isolation
2. ✅ Client-side cache isolation
3. ✅ Shared Drive API access

**Next steps**:
- Document the fix
- Monitor for 24 hours
- Consider adding integration tests

## If Tests FAIL ❌
The Shared Drive scope fix didn't solve the issue. Time to rollback.

**Rollback steps**:
```bash
# Option 1: Rollback to before multi-tenant changes
git log --oneline -20
# Find commit before "54e093c feat: Complete multi-tenant authentication"

# Rollback to that commit
git reset --hard COMMIT_HASH  # e.g., 2422476 or earlier

# Force push
git push origin main --force

# Redeploy
vercel --prod
```

**Possible last good commits**:
- `2422476` - Before multi-tenant feature
- `24ffc42` - Before authentication changes
- `6d50482` - Production-ready tag (safe fallback)

## Debugging Next Steps (If Rollback Needed)
If the fix fails, the issue might be:

1. **Different root cause**: Not Shared Drive related
2. **Service account permissions**: Need to check Google Cloud Console
3. **OAuth scopes**: May need user OAuth consent for Drive access
4. **Spreadsheet sharing**: Service account may not have access

**To investigate**:
```bash
# Check what Google Cloud permissions the service account has
# Go to: https://console.cloud.google.com/iam-admin/serviceaccounts

# Check if spreadsheet is shared with service account email
# Service account email is in GOOGLE_SERVICE_ACCOUNT_KEY
```

---

**Current Time**: Ready to test
**Deployment Commit**: `dc241d1`
**Test Account**: tommy@gmail.com
**Expected Result**: No 404 errors, correct data shown
