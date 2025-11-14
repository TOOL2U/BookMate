# 🚨 EMERGENCY DATA LEAKAGE DIAGNOSIS

## Current Status: CRITICAL
**Issue**: Tommy@gmail.com is seeing data from a different spreadsheet (Shaun's data)
**Deployment**: https://accounting.siamoon.com
**Latest Deploy**: Nov 13, 2025 - 12:03 PM EST (bookmate-67bwto0yl)

---

## ✅ CONFIRMED WORKING

### 1. Database - User Spreadsheet IDs
```sql
SELECT email, spreadsheet_id FROM users;
```
✅ **RESULT**:
- shaun@siamoon.com → `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- tommy@gmail.com → `1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g`

**Each user HAS their own unique spreadsheet ID in database**

### 2. Backend API Routes
✅ All API routes use `getSpreadsheetId(request)` which:
1. Decodes JWT token
2. Looks up user in database
3. Returns user's `spreadsheetId`

### 3. API Server-Side Caching
✅ Fixed - All caches now isolated by spreadsheetId:
- `/app/api/pnl/route.ts` - Uses `Map<spreadsheetId, data>`
- `/app/api/balance/route.ts` - Uses `Map<spreadsheetId, data>`
- `/app/api/inbox/route.ts` - Uses `Map<spreadsheetId, data>`
- `/app/api/options/route.ts` - Uses `Map<spreadsheetId, data>`

### 4. React Query Client-Side Cache Keys
✅ **JUST FIXED** - All cache keys now include `userId`:
```typescript
queryKeys = {
  pnl: () => ['pnl', getUserId()],
  balances: () => ['balances', getUserId()],
  dashboard: () => ['dashboard', getUserId()],
  // etc...
}
```

---

## 🔴 POTENTIAL ISSUES REMAINING

### Issue #1: Browser Cache from OLD Deployment
**Problem**: Tommy may be seeing BROWSER-CACHED data from BEFORE the fix
**Solution**: **HARD REFRESH** required (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on Windows)

### Issue #2: localStorage Contains Wrong User Data
**Problem**: If localStorage has old `userId` from previous session
**Check**: Open DevTools → Application → LocalStorage → Check `userId`, `accessToken`
**Solution**: Clear localStorage and re-login

### Issue #3: Tommy's Spreadsheet is EMPTY
**Problem**: Tommy's spreadsheet `1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g` might be a blank template
**What Tommy sees**: Empty sheet would show "0" for everything
**What you think**: "He's seeing Shaun's data because numbers match"
**Solution**: Verify Tommy's spreadsheet has actual data

---

## 🔍 IMMEDIATE DIAGNOSTIC STEPS

### Step 1: Verify Tommy's Spreadsheet Has Data
Open Tommy's spreadsheet: https://docs.google.com/spreadsheets/d/1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g/edit

**Check**:
- Does it have the P&L tab?
- Does it have actual numbers? Or is it empty?
- Is it shared with the service account?

### Step 2: Clear All Browser Cache for Tommy
1. Open incognito window
2. Go to https://accounting.siamoon.com
3. Open DevTools (F12)
4. Application → Storage → Clear site data
5. Hard refresh (Cmd+Shift+R)
6. Login as tommy@gmail.com

### Step 3: Check Network Requests
In DevTools Network tab, filter by "api":
1. Login as Tommy
2. Go to Dashboard
3. Watch the `/api/dashboard` request
4. Check the **Request Headers** → Should have `Authorization: Bearer ...` with Tommy's token
5. Check the **Response** → What data is returned?

### Step 4: Check React Query DevTools
1. Install React Query DevTools (if not already)
2. Login as Tommy
3. Open DevTools → React Query tab
4. Look at cache keys - should be `['pnl', 'a9638af9-8798-41a4-836f-06e1d95fbed8']` (Tommy's user ID)

---

## 🔧 IF STILL BROKEN - EMERGENCY FIXES

### Fix #1: Add Logging to API Route
Add this to `/app/api/pnl/route.ts` line 45:
```typescript
const spreadsheetId = await getSpreadsheetId(request);
console.log('🔍 PNL API - User SpreadsheetID:', spreadsheetId);
console.log('🔍 PNL API - Request Headers:', request.headers.get('Authorization')?.substring(0, 50));
```

Then check Vercel logs:
```bash
vercel logs https://accounting.siamoon.com
```

### Fix #2: Force Cache Clear on Logout
Add to `/app/api/auth/logout/route.ts`:
```typescript
response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
```

### Fix #3: Add User ID to API Response (Debugging)
Temporarily add to all API responses:
```typescript
return NextResponse.json({
  ...data,
  _debug: {
    userId: user.id,
    spreadsheetId: user.spreadsheetId,
    timestamp: new Date().toISOString()
  }
});
```

---

## 📊 WHAT TO TELL ME

Please provide:
1. ✅ "I did a hard refresh (Cmd+Shift+R)" - YES/NO
2. ✅ "I cleared localStorage and re-logged in" - YES/NO  
3. ✅ "Tommy's spreadsheet HAS actual data in it" - YES/NO (open the sheet and check)
4. ✅ Screenshot of Network tab showing `/api/dashboard` response
5. ✅ Screenshot of what Tommy sees on dashboard

---

## 🎯 ROOT CAUSE HYPOTHESIS

**Most Likely**: Tommy's spreadsheet is EMPTY (just a blank template)
- The spreadsheet exists ✅
- It's linked to Tommy's account ✅
- But it has NO DATA yet (blank template)
- So when Tommy logs in, he sees "empty" or "0" values
- **You think he's seeing Shaun's data, but it's actually just empty**

**Second Likely**: Browser cache from old deployment
- Tommy accessed the site BEFORE the React Query fix
- His browser cached the old global cache keys
- Hard refresh + clear storage needed

**Least Likely**: Code bug (we fixed everything)
- Server-side caching: FIXED ✅
- Client-side caching: FIXED ✅
- Database: WORKING ✅
- Auth: WORKING ✅

---

## ⚡ IMMEDIATE ACTION REQUIRED

1. **Open Tommy's spreadsheet** and verify it has data
2. **Hard refresh the browser** (Cmd+Shift+R)
3. **Clear browser localStorage** and re-login
4. **Check DevTools Network tab** to see actual API responses

If still broken after ALL 4 steps above, we need to add debugging logs and check Vercel runtime logs while Tommy is actively using the site.
