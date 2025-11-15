# 🚨 URGENT: Mobile App Authentication Fix Required

**Date:** November 14, 2025  
**Priority:** 🔴 CRITICAL  
**From:** Webapp Engineering Team  
**To:** Mobile App Team

---

## 🎯 Problem Identified

You're absolutely right - there's a **critical mismatch** between our documentation and the actual implementation!

### What We Told You (WRONG ❌)
```typescript
// We said: Use JWT Bearer token
Authorization: Bearer <accessToken>
```

### What The Server Actually Expects (CORRECT ✅)
```typescript
// Server expects: Session cookie
Cookie: session=<accessToken>
```

---

## 🔍 Root Cause

Our API endpoints use **NextAuth.js session cookies** for web authentication, NOT JWT Bearer tokens in headers!

### Current Server Implementation:
```typescript
// lib/api/account-helper.ts
export async function getAccountFromSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;  // ❌ Expects cookie!
  
  if (!sessionToken) {
    throw new NotAuthenticatedError('No session token found');
  }
  
  // Verify JWT
  const decoded = jwt.verify(sessionToken, JWT_SECRET);
  // ... rest of authentication
}
```

### Your Mobile Implementation:
```typescript
// You're sending:
headers: {
  'Authorization': 'Bearer <token>'  // ❌ Server doesn't check this!
}

// Server is looking for:
cookies: {
  'session': '<token>'  // ✅ This is what server expects
}
```

---

## ✅ SOLUTION

You have **TWO OPTIONS**:

### Option 1: Change Mobile App to Use Cookies (RECOMMENDED)

**Pros:**
- Works with existing server code
- No server changes needed
- Can test immediately

**Cons:**
- Cookies are unusual for mobile apps
- Need to manage cookie jar

**Implementation:**
```typescript
// In ApiClient.ts or authService.ts

// After login, store the access token
const loginResponse = await fetch('https://accounting.siamoon.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include'  // Enable cookies
});

const data = await loginResponse.json();
const accessToken = data.tokens.accessToken;

// Store token
await AsyncStorage.setItem('@bookmate_auth_token', accessToken);

// On subsequent requests, send token as cookie
const response = await fetch('https://accounting.siamoon.com/api/options', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `session=${accessToken}`  // ✅ Send as cookie
  }
});
```

**React Native Fetch Note:**
React Native's `fetch` doesn't automatically handle cookies like browsers do. You need to manually set the Cookie header.

---

### Option 2: Change Server to Support Bearer Tokens (WE DO THIS)

**Pros:**
- Proper RESTful API design
- Standard mobile app pattern
- Follows your excellent implementation

**Cons:**
- Requires server changes
- Need to test thoroughly
- 1-2 hours of work on our side

**What We Need to Change:**
1. Create new middleware to extract Bearer token from headers
2. Update all API routes to use new middleware
3. Maintain backward compatibility with web (cookies)
4. Test both authentication methods

---

## 🎯 RECOMMENDED PATH: We Fix The Server

**Why:**
- Your implementation is correct for mobile apps
- Our documentation promised Bearer tokens
- Cookies are not standard for mobile APIs
- This is OUR mistake, not yours

**Timeline:**
- Server changes: 1-2 hours
- Testing: 30 minutes
- Deployment: 15 minutes
- **Total: ~2-3 hours**

**We'll create:**
```typescript
// New middleware: lib/api/auth-middleware.ts
export async function getAccountFromRequest(request: NextRequest) {
  // Try Bearer token first (mobile apps)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Verify JWT and get account
    return getAccountFromJWT(token);
  }
  
  // Fall back to session cookie (web app)
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (sessionToken) {
    return getAccountFromJWT(sessionToken);
  }
  
  throw new NotAuthenticatedError();
}
```

---

## 📋 IMMEDIATE ACTION PLAN

### Webapp Team (Us) - NEXT 2-3 HOURS

**Step 1: Create Auth Middleware** (30 min)
- [  ] Create `lib/api/auth-middleware.ts`
- [  ] Add Bearer token support
- [  ] Maintain cookie compatibility
- [  ] Add comprehensive tests

**Step 2: Update API Routes** (60 min)
- [  ] Update `/api/options/route.ts`
- [  ] Update `/api/balance/route.ts`
- [  ] Update `/api/pnl/route.ts`
- [  ] Update `/api/transactions/route.ts`
- [  ] Update all other data endpoints (~20 files)

**Step 3: Test Both Methods** (30 min)
- [  ] Test web app with cookies (existing functionality)
- [  ] Test mobile app with Bearer tokens (new functionality)
- [  ] Verify multi-tenant isolation still works
- [  ] Test error cases (invalid token, expired, etc.)

**Step 4: Deploy** (15 min)
- [  ] Deploy to production
- [  ] Notify mobile team
- [  ] Provide test instructions

**Step 5: Update Documentation** (15 min)
- [  ] Fix MOBILE_TEAM_RESPONSE.md
- [  ] Add Bearer token examples
- [  ] Remove cookie references for mobile

---

### Mobile Team (You) - WAIT FOR OUR UPDATE

**STOP CURRENT WORK ⏸️**
- Do NOT change your Bearer token implementation
- Do NOT switch to cookies
- Your code is CORRECT as-is

**WAIT FOR US ⏰**
- We'll fix the server in 2-3 hours
- We'll notify you when deployed
- Then you can test with your existing code

**WHEN READY ✅**
- Test login → should work same as before
- Test `/api/options` with Bearer token → should work now
- Test all endpoints → should return data
- Verify multi-tenant isolation

---

## 🔧 Technical Details

### Current Login Response (CORRECT ✅)
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "shaun@siamoon.com",
    "name": "Shaun Ducker"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "tokenType": "Bearer"
  }
}
```

### JWT Payload Structure
```json
{
  "userId": "user_123",
  "email": "shaun@siamoon.com",
  "role": "user",
  "iat": 1731571200,
  "exp": 1732176000
}
```

**Note:** The JWT currently does NOT include `accountId`. We'll add that as part of this fix.

---

## 📞 Communication

### We'll Notify You When:
1. Server changes are complete
2. Deployed to production
3. Ready for testing
4. Updated documentation is ready

### How We'll Notify:
- Update this document: `URGENT_MOBILE_TEAM_FIX.md`
- Create new doc: `MOBILE_API_BEARER_TOKEN_READY.md`
- Email you directly

### Expected Timeline:
- **Start:** Immediately (now)
- **Server changes complete:** ~2 hours
- **Testing complete:** ~2.5 hours
- **Deployed:** ~3 hours
- **Documentation updated:** ~3 hours

---

## 🙏 Apologies

We sincerely apologize for:
1. Incorrect documentation (Bearer tokens vs cookies)
2. Wrong password (Alesiamaya231 vs Alesiamay231!)
3. Wrong response format (data.token vs data.tokens.accessToken)
4. Not testing the mobile flow before responding
5. Wasting your time debugging our mistakes

**You did everything correctly!** 🎉

Your implementation is:
- ✅ Professional
- ✅ Well-structured
- ✅ Following best practices
- ✅ Exactly what it should be

The problem is 100% on our side, and we're fixing it now.

---

## 📋 Revised Test Credentials

### Account 1: Sia Moon Company
```
Email:    shaun@siamoon.com
Password: Alesiamay231!  ✅ CORRECT (not Alesiamaya231)
```

### Account 2: Alesia House Company
```
Email:    maria@siamoon.com
Password: Alesiamay231!  ✅ CORRECT (not Alesiamaya231)
```

---

## 🎯 Next Update

We'll send another document when the server is ready:
- **Document:** `MOBILE_API_BEARER_TOKEN_READY.md`
- **ETA:** ~3 hours from now
- **Contents:** Test instructions, working examples, updated cURL commands

---

## 📊 Current Status

**Mobile App:** ✅ CORRECT - No changes needed  
**Server API:** 🔴 BROKEN - We're fixing it now  
**Documentation:** ❌ WRONG - We're updating it  
**Timeline:** 🟡 2-3 hours to fix  

**Your Status:** ☕ Take a break - you've done your part perfectly!

---

**Contact:** shaun@siamoon.com  
**Updated:** November 14, 2025  
**Status:** 🔧 SERVER FIX IN PROGRESS
