# ✅ PHASE 1 TESTING CHECKLIST

## Pre-Flight Checks

Before testing the multi-account system, verify:

- [ ] Firebase project configured
- [ ] Firestore database exists
- [ ] Environment variables set (.env.local)
- [ ] At least one admin user created
- [ ] Build passes: `npm run build`
- [ ] Dev server runs: `npm run dev`

---

## Test 1: Admin Account Creation

**Purpose:** Verify admins can create new accounts

### Steps:
1. [ ] Login as admin user
2. [ ] Navigate to `/admin/accounts`
3. [ ] Click "Create New Account" button
4. [ ] Fill in form:
   - [ ] Company Name: "Test Company"
   - [ ] User Email: "test@example.com"
   - [ ] Sheet ID: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
   - [ ] Script URL: `https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec`
   - [ ] Secret: Your actual secret
5. [ ] Click "Create Account"

### Expected Results:
- [ ] Form validates all fields
- [ ] Success message appears
- [ ] Redirected to `/admin/accounts`
- [ ] New account appears in list
- [ ] Account ID is "test-company" (slugified)

### Verification:
```bash
# Check Firestore Console
# accounts collection → should have doc "test-company"
```

---

## Test 2: User Login with Account

**Purpose:** Verify users with accounts can login and see their data

### Steps:
1. [ ] Logout from admin account
2. [ ] Login as `test@example.com`
3. [ ] Should be redirected to dashboard
4. [ ] Open browser DevTools → Console

### Expected Results:
- [ ] No errors in console
- [ ] AccountProvider loads successfully
- [ ] Dashboard displays data
- [ ] Console shows: `🏢 Company: Test Company`

### Verification:
```javascript
// In browser console:
// Check if account context is loaded
// Look for AccountProvider logs
```

---

## Test 3: useAccount Hook

**Purpose:** Verify account data is accessible in components

### Steps:
1. [ ] While logged in as `test@example.com`
2. [ ] Navigate to `/account-test`
3. [ ] Verify account info displays

### Expected Results:
- [ ] Company name: "Test Company"
- [ ] Email: "test@example.com"
- [ ] Sheet ID displays correctly
- [ ] Script URL displays correctly
- [ ] "Refresh Account Data" button works

### Verification:
```typescript
// Page should show:
{
  "accountId": "test-company",
  "companyName": "Test Company",
  "userEmail": "test@example.com",
  "sheetId": "1UnCop...",
  "scriptUrl": "https://script.google.com/...",
  "status": "active"
}
```

---

## Test 4: P&L API with Account

**Purpose:** Verify P&L data uses account config

### Steps:
1. [ ] While logged in as `test@example.com`
2. [ ] Navigate to dashboard
3. [ ] View P&L section
4. [ ] Open Network tab in DevTools
5. [ ] Refresh page

### Expected Results:
- [ ] Request to `/api/pnl` succeeds
- [ ] Response contains P&L data
- [ ] Console logs show: `🏢 Company: Test Company`
- [ ] Data is from test user's spreadsheet

### Verification:
```bash
# Server logs should show:
📊 Fetching fresh P&L data from Google Sheets...
🏢 Company: Test Company
🔐 Using account-specific script URL
✅ P&L data fetched and cached successfully
```

---

## Test 5: Balance API with Account

**Purpose:** Verify Balance data uses account config

### Steps:
1. [ ] While logged in as `test@example.com`
2. [ ] Navigate to `/balance`
3. [ ] Open Network tab in DevTools

### Expected Results:
- [ ] Request to `/api/balance` succeeds
- [ ] Response contains balance data
- [ ] Console logs show company name
- [ ] Data is from test user's spreadsheet

### Verification:
```bash
# Server logs should show:
✅ [Balance API] Returning cached data for Test Company, month: ALL
```

---

## Test 6: Inbox API with Account

**Purpose:** Verify Inbox data uses account config

### Steps:
1. [ ] While logged in as `test@example.com`
2. [ ] Navigate to `/inbox`
3. [ ] Open Network tab in DevTools

### Expected Results:
- [ ] Request to `/api/inbox` succeeds
- [ ] Response contains inbox entries
- [ ] Console logs show company name
- [ ] Data is from test user's Apps Script

### Verification:
```bash
# Server logs should show:
📥 Fetching fresh inbox data for Test Company...
✅ Fetched X entries from Google Sheets
```

---

## Test 7: User WITHOUT Account

**Purpose:** Verify error handling for users without accounts

### Steps:
1. [ ] Logout from test account
2. [ ] Login with email that has NO account in Firestore
   - Example: `noaccountuser@gmail.com`

### Expected Results:
- [ ] AccountProvider shows error screen
- [ ] Message: "No Account Found"
- [ ] Subtitle: "No BookMate account is linked to this email..."
- [ ] "Contact Support" button visible
- [ ] API requests return 403 Forbidden

### Verification:
```bash
# Server logs should show:
❌ No account found for user: noaccountuser@gmail.com
```

---

## Test 8: Multi-Account Isolation

**Purpose:** Verify complete data isolation between accounts

### Setup:
1. [ ] Create Account A:
   - Email: `alice@company.com`
   - Company: "Alice Corp"
   - Sheet ID: (use a test sheet)
2. [ ] Create Account B:
   - Email: `bob@othercorp.com`
   - Company: "Bob Industries"
   - Sheet ID: (use different test sheet)

### Steps:
1. [ ] Login as `alice@company.com`
2. [ ] Note the data shown (P&L, Balance, Inbox)
3. [ ] Logout
4. [ ] Login as `bob@othercorp.com`
5. [ ] Note the data shown

### Expected Results:
- [ ] Alice sees data from Alice's spreadsheet only
- [ ] Bob sees data from Bob's spreadsheet only
- [ ] No data overlap
- [ ] Different company names in logs
- [ ] Different cache keys used

### Verification:
```bash
# Alice's session:
🏢 Company: Alice Corp
Cache key: pnl_alice-corp

# Bob's session:
🏢 Company: Bob Industries
Cache key: pnl_bob-industries
```

---

## Test 9: Cache Isolation

**Purpose:** Verify cache is account-specific

### Steps:
1. [ ] Login as Alice
2. [ ] Load P&L data (fresh fetch)
3. [ ] Refresh page (should be cached)
4. [ ] Logout
5. [ ] Login as Bob
6. [ ] Load P&L data (should be fresh, not Alice's cache)

### Expected Results:
- [ ] Alice's first load: `"cached": false`
- [ ] Alice's second load: `"cached": true`
- [ ] Bob's first load: `"cached": false` (different cache)
- [ ] Bob never sees Alice's cached data

---

## Test 10: Session Expiry

**Purpose:** Verify session handling

### Steps:
1. [ ] Login as test user
2. [ ] Open DevTools → Application → Cookies
3. [ ] Delete `session` cookie
4. [ ] Refresh page

### Expected Results:
- [ ] Redirected to login page
- [ ] Or shows "Not authenticated" error
- [ ] Clear error message
- [ ] No data displayed

---

## Test 11: Admin Protection

**Purpose:** Verify non-admins cannot access admin routes

### Steps:
1. [ ] Login as regular user (not admin)
2. [ ] Try to navigate to `/admin/accounts`

### Expected Results:
- [ ] Access denied
- [ ] Redirected to dashboard
- [ ] Or shows "Access denied" error

---

## Test 12: Form Validation

**Purpose:** Verify account creation form validation

### Steps:
1. [ ] Login as admin
2. [ ] Navigate to `/admin/accounts/new`
3. [ ] Try to submit empty form
4. [ ] Try invalid email
5. [ ] Try invalid Script URL
6. [ ] Try duplicate email

### Expected Results:
- [ ] Empty form: All fields show errors
- [ ] Invalid email: "Invalid email address"
- [ ] Invalid URL: "Script URL must start with https://script.google.com/macros/s/"
- [ ] Duplicate email: "An account already exists for this email"

---

## Performance Tests

### Test 13: Account Loading Speed

**Purpose:** Measure account loading performance

### Steps:
1. [ ] Login as test user
2. [ ] Open DevTools → Network tab
3. [ ] Clear cache
4. [ ] Refresh page
5. [ ] Check time for `/api/account` request

### Expected Results:
- [ ] Account loads in < 500ms
- [ ] No noticeable delay
- [ ] Smooth transition to dashboard

---

### Test 14: Cached vs Fresh Requests

**Purpose:** Verify caching performance

### Steps:
1. [ ] Login as test user
2. [ ] Load P&L data (Network tab open)
3. [ ] Note response time
4. [ ] Refresh within 60 seconds
5. [ ] Note response time

### Expected Results:
- [ ] First load: 2-5 seconds
- [ ] Cached load: < 100ms
- [ ] Response includes `"cached": true`

---

## Production Readiness

### Test 15: Build and Deploy

**Purpose:** Verify production build

### Steps:
```bash
# Clean build
rm -rf .next
npm run build

# Check output
# Should show: ✓ Compiled successfully
```

### Expected Results:
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] All pages generated

---

### Test 16: Environment Variables

**Purpose:** Verify all required env vars

### Steps:
```bash
# Check .env.local
cat .env.local | grep -E "FIREBASE|GOOGLE"
```

### Expected Results:
- [ ] `FIREBASE_ADMIN_PROJECT_ID` set
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL` set
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` set
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` set (optional)

---

## Success Criteria

### All Tests Must Pass:
- [ ] Admin can create accounts ✅
- [ ] Users with accounts can login ✅
- [ ] useAccount() hook works ✅
- [ ] P&L API uses account config ✅
- [ ] Balance API uses account config ✅
- [ ] Inbox API uses account config ✅
- [ ] Users without accounts see error ✅
- [ ] Multi-account isolation verified ✅
- [ ] Cache is account-specific ✅
- [ ] Session expiry handled ✅
- [ ] Admin routes protected ✅
- [ ] Form validation works ✅
- [ ] Performance acceptable ✅
- [ ] Build passes ✅

---

## If Tests Fail

### Debugging Steps:

**Account not loading:**
```bash
# Check Firestore
# Collection: accounts
# Doc ID should match email's company name (slugified)

# Check server logs
npm run dev
# Look for errors in terminal
```

**API returning wrong data:**
```bash
# Check which account is loaded
# Browser console → useAccount()
console.log(account);

# Check server logs
# Should show company name and script URL being used
```

**Build failing:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build

# Check specific error
# Look at TypeScript errors
```

**Authentication issues:**
```bash
# Verify Firebase config
# Check session cookie exists
# Browser DevTools → Application → Cookies → session

# Verify admin claims
# Firebase Console → Authentication → Users → Custom Claims
```

---

## Post-Testing Report

After completing all tests, fill out:

```markdown
## Test Results

Date: _______________
Tester: _______________

### Passing Tests:
- [ ] Test 1: Admin Account Creation
- [ ] Test 2: User Login with Account
- [ ] Test 3: useAccount Hook
- [ ] Test 4: P&L API
- [ ] Test 5: Balance API
- [ ] Test 6: Inbox API
- [ ] Test 7: User Without Account
- [ ] Test 8: Multi-Account Isolation
- [ ] Test 9: Cache Isolation
- [ ] Test 10: Session Expiry
- [ ] Test 11: Admin Protection
- [ ] Test 12: Form Validation
- [ ] Test 13: Loading Speed
- [ ] Test 14: Caching
- [ ] Test 15: Build
- [ ] Test 16: Environment Variables

### Issues Found:
(List any bugs or issues)

### Overall Status:
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ NEEDS FIXES
- [ ] ❌ MAJOR ISSUES

### Notes:
(Additional observations)
```

---

**Ready to test!** 🧪

Start with Test 1 and work through sequentially for best results.
