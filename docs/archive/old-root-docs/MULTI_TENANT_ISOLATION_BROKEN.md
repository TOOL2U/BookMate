# 🚨 CRITICAL: Multi-Tenant Isolation Broken

**Date:** November 13, 2025 11:12 UTC  
**Issue:** New users seeing admin spreadsheet data instead of their own  
**Status:** 🔴 INVESTIGATING

## Problem Report

User created a new account but the application is displaying data from the **admin spreadsheet** (`1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`) instead of the new user's spreadsheet.

### What We Know

1. ✅ **New user registration working**
   - Spreadsheet auto-created successfully
   - Example: `1J6osSSu0OiX58aF_djUHGcW8NtSq8zISrbtn8o7J6Wg`

2. ❌ **Data isolation broken**
   - New user sees admin data
   - Should see empty/template data from their own spreadsheet

3. ✅ **Middleware code looks correct**
   - `getUserSpreadsheetId()` properly checks user email
   - Returns admin spreadsheet only for `shaun@siamoon.com`
   - Returns user's own spreadsheet for all others

## Possible Root Causes

### 1. Frontend Using Cached Admin Token ⚠️ LIKELY
**Symptom:** User is logged in as new user, but frontend is sending admin's JWT token

**Why this happens:**
- User was logged in as admin before
- Token stored in localStorage/cookies
- New user registration doesn't clear old tokens
- Frontend continues sending admin's token with API requests

**How to verify:**
```javascript
// Check browser console or localStorage
localStorage.getItem('authToken')
// Should be new user's token, not admin's
```

**Fix:**
- Clear localStorage/cookies on registration
- Or ensure registration flow logs out previous user first

### 2. Frontend Not Using New User's Token
**Symptom:** Registration returns new token, but frontend ignores it

**Check:**
- Is the new token being stored after registration?
- Is it being used for subsequent API calls?

### 3. Browser Session Issue
**Symptom:** Multiple tabs with different users

**Fix:**
- Close all tabs
- Clear browser cache
- Login fresh

### 4. API Route Not Using Middleware
**Symptom:** Some API routes bypass authentication

**Verify:**
- All balance/PnL APIs should call `getUserSpreadsheetId(request)`
- Check recent code changes

## Diagnostic Steps

### Step 1: Verify Token in Browser
Open browser DevTools → Console:
```javascript
// Check what token is stored
localStorage.getItem('authToken')
// or
document.cookie
```

### Step 2: Decode the Token
Use https://jwt.io to decode the token and check:
- `userId` - should match new user's ID
- `email` - should match new user's email
- `exp` - should not be expired

### Step 3: Test API with Correct Token
```bash
# 1. Register new user (get their token)
curl -X POST "https://accounting.siamoon.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"debug@example.com","password":"Test2025!","name":"Debug User"}' \
  | jq -r '.tokens.accessToken'

# 2. Save that token
export NEW_USER_TOKEN="[paste token here]"

# 3. Test API with new user's token
curl -H "Authorization: Bearer $NEW_USER_TOKEN" \
  "https://accounting.siamoon.com/api/auth/me" | jq

# 4. Check spreadsheetId in response
# Should NOT be 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
```

### Step 4: Check Vercel Logs
Look for lines like:
```
⭐ Admin account detected - using original spreadsheet
📊 Using user's spreadsheet: [ID]
```

If you see "Admin account detected" for a non-admin email, that's the bug.

## Quick Fix (Frontend)

### Clear All Auth State on Registration

**In registration success handler:**
```typescript
// After successful registration
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ email, password, name })
});

const data = await response.json();

if (data.success) {
  // IMPORTANT: Clear any old tokens first
  localStorage.clear();
  sessionStorage.clear();
  
  // Then store new token
  localStorage.setItem('authToken', data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.tokens.refreshToken);
  
  // Reload or redirect
  window.location.href = '/dashboard';
}
```

### Clear Tokens on Logout
```typescript
// Logout function
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  // Or clear everything:
  localStorage.clear();
  sessionStorage.clear();
  
  window.location.href = '/login';
}
```

## Backend Verification

### Add Debug Logging
Temporarily add to `/lib/middleware/auth.ts`:

```typescript
export async function getUserSpreadsheetId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request);
  
  console.log('🔍 DEBUG - User:', {
    id: user.id,
    email: user.email,
    spreadsheetId: user.spreadsheetId
  });
  
  // Rest of the function...
}
```

This will show exactly which user is making the request.

## Expected Behavior

### New User Flow
```
1. User registers → Creates account + spreadsheet
2. Frontend stores NEW user's token
3. User makes API call → Sends NEW token
4. Middleware decodes token → Gets NEW user ID
5. Database lookup → Returns NEW user's spreadsheet
6. API uses NEW spreadsheet → Returns THEIR data
```

### Admin Flow
```
1. shaun@siamoon.com logs in
2. Middleware detects email === 'shaun@siamoon.com'
3. Returns ORIGINAL_SPREADSHEET_ID
4. APIs use admin spreadsheet
```

## Testing Checklist

- [ ] New user registered successfully
- [ ] New spreadsheet created (verified ID)
- [ ] Check browser localStorage for old admin token
- [ ] Decode token - confirm it's for NEW user
- [ ] Test `/api/auth/me` with new token
- [ ] Verify spreadsheetId in response
- [ ] Test balance/PnL APIs with new token
- [ ] Confirm data is from NEW spreadsheet (should be empty)
- [ ] Check Vercel logs for "Admin account detected" message
- [ ] Clear browser cache and retry

## Next Steps

**Most Likely Solution:**
The frontend is using the admin's cached JWT token instead of the new user's token. 

**Action Required:**
1. Check browser localStorage/cookies
2. Clear all cached tokens
3. Login as new user fresh
4. Verify token belongs to new user
5. Test API calls

---

**Status:** Awaiting frontend token verification  
**Priority:** 🔴 CRITICAL - Data isolation broken  
**Impact:** Privacy violation - users see other users' data  
**ETA to Fix:** 10 minutes (if it's just a frontend token issue)
