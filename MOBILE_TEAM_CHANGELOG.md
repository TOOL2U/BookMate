# 🔄 BookMate API - Changelog for Mobile Team

**Last Updated:** November 14, 2025  
**For:** Mobile App Engineering Team

---

## 📋 Recent Changes Summary

### November 14, 2025 - Settings Page Multi-Tenant Fix

**Status:** ✅ DEPLOYED TO PRODUCTION

#### What Changed?
Fixed critical data isolation bug where users were seeing each other's data in the Settings page category management.

#### Endpoints Fixed:
- ✅ `GET /api/categories/properties` - Now returns user-specific properties
- ✅ `POST /api/categories/properties` - Now updates user-specific properties
- ✅ `GET /api/categories/expenses` - Now returns user-specific expenses
- ✅ `POST /api/categories/expenses` - Now updates user-specific expenses
- ✅ `GET /api/categories/revenues` - Now returns user-specific revenues
- ✅ `POST /api/categories/revenues` - Now updates user-specific revenues
- ✅ `GET /api/categories/payments` - Now returns user-specific payment types
- ✅ `POST /api/categories/payments` - Now updates user-specific payment types

#### Impact on Mobile App:
✅ **No breaking changes** - Endpoints work the same way  
✅ **Better data isolation** - Users now see only their own categories  
✅ **Settings sync** - Changes in web app now properly isolated per user

#### What Mobile Team Should Test:
```typescript
// Login as User A
const categoriesA = await apiClient.get('/api/categories/properties');
// Should return User A's properties only

// Logout and login as User B
const categoriesB = await apiClient.get('/api/categories/properties');
// Should return User B's different properties (no overlap)
```

---

### November 12-13, 2025 - Multi-Tenant Core System

**Status:** ✅ DEPLOYED TO PRODUCTION

#### What Changed?
Converted entire system from single-tenant to multi-tenant architecture.

#### Endpoints Fixed:
- ✅ `GET /api/balance` - Account-specific balance data
- ✅ `GET /api/pnl` - Account-specific P&L reports
- ✅ `GET /api/pnl/property-person` - Account-specific property breakdown
- ✅ `GET /api/pnl/overhead-expenses` - Account-specific overhead breakdown
- ✅ `GET /api/options` - Account-specific dropdown options
- ✅ `POST /api/categories/sync` - Account-specific sync

#### How It Works:
```typescript
// OLD SYSTEM (Before Nov 12)
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // ❌ Shared by all users

// NEW SYSTEM (After Nov 12)
const account = await getAccountFromSession(request);
const sheetId = account.sheetId; // ✅ User-specific
```

#### Impact on Mobile App:
⚠️ **Breaking change** if you were using hardcoded configuration  
✅ **No breaking change** if you use authenticated API endpoints  
✅ **Required:** Must send `Authorization: Bearer <token>` header  
✅ **Required:** Must handle 401 responses (session expired)

---

### November 11, 2025 - Authentication System Complete

**Status:** ✅ DEPLOYED TO PRODUCTION

#### New Endpoints:
- ✅ `POST /api/auth/login` - User login with email/password
- ✅ `POST /api/auth/signup` - User registration
- ✅ `POST /api/auth/logout-session` - User logout
- ✅ `GET /api/auth/me` - Get current user info

#### Authentication Flow:
```typescript
// 1. Login
const response = await fetch('https://accounting.siamoon.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
// data.token - JWT token for subsequent requests
// data.account - User's account configuration
// data.user - User profile

// 2. Use token for API requests
const balance = await fetch('https://accounting.siamoon.com/api/balance', {
  headers: {
    'Authorization': `Bearer ${data.token}`
  }
});
```

#### Impact on Mobile App:
⚠️ **Breaking change** - Must implement authentication  
❌ **Old approach:** Direct Apps Script calls with hardcoded secret  
✅ **New approach:** Login → Get token → Use token for API calls  
✅ **Migration required:** See [Complete Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)

---

## 🔍 Detailed Change Log

### API Endpoint Changes

#### Before Multi-Tenant System (❌ Old)
```typescript
// Direct calls to Apps Script
fetch('https://script.google.com/macros/s/ABC123/exec', {
  method: 'POST',
  body: JSON.stringify({
    secret: 'hardcoded-secret', // Same for all users!
    action: 'getBalance'
  })
});
```

#### After Multi-Tenant System (✅ New)
```typescript
// Authenticated calls to web API
fetch('https://accounting.siamoon.com/api/balance', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userToken}`, // User-specific!
    'Content-Type': 'application/json'
  }
});

// Web API handles:
// 1. Token validation
// 2. Get user from token
// 3. Get account config from Firestore
// 4. Use account.sheetId/scriptUrl/scriptSecret
// 5. Return user-specific data
```

---

## 📊 Complete Endpoint Status

### ✅ Multi-Tenant Ready (All Production Endpoints)

| Endpoint | Status | Data Isolation | Cache Isolation | Notes |
|----------|--------|----------------|-----------------|-------|
| `POST /api/auth/login` | ✅ Ready | N/A | N/A | Returns user token + account |
| `POST /api/auth/signup` | ✅ Ready | N/A | N/A | Creates Firebase user |
| `POST /api/auth/logout-session` | ✅ Ready | N/A | N/A | Clears session |
| `GET /api/auth/me` | ✅ Ready | ✅ Yes | N/A | Returns current user |
| `GET /api/balance` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific balance |
| `GET /api/pnl` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific P&L |
| `GET /api/pnl/property-person` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific breakdown |
| `GET /api/pnl/overhead-expenses` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific overhead |
| `GET /api/options` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific options |
| `GET /api/inbox` | ✅ Ready | ✅ Yes | ✅ Yes | User-specific inbox |
| `POST /api/inbox` | ✅ Ready | ✅ Yes | N/A | Create user inbox item |
| `DELETE /api/inbox` | ✅ Ready | ✅ Yes | N/A | Delete user inbox item |
| `GET /api/categories/properties` | ✅ Ready | ✅ Yes | N/A | User-specific properties |
| `POST /api/categories/properties` | ✅ Ready | ✅ Yes | N/A | Update user properties |
| `GET /api/categories/expenses` | ✅ Ready | ✅ Yes | N/A | User-specific expenses |
| `POST /api/categories/expenses` | ✅ Ready | ✅ Yes | N/A | Update user expenses |
| `GET /api/categories/revenues` | ✅ Ready | ✅ Yes | N/A | User-specific revenues |
| `POST /api/categories/revenues` | ✅ Ready | ✅ Yes | N/A | Update user revenues |
| `GET /api/categories/payments` | ✅ Ready | ✅ Yes | N/A | User-specific payments |
| `POST /api/categories/payments` | ✅ Ready | ✅ Yes | N/A | Update user payments |
| `POST /api/categories/sync` | ✅ Ready | ✅ Yes | N/A | Sync user categories |

**Legend:**
- ✅ Ready - Production ready, fully tested
- ✅ Yes - Feature implemented and tested
- N/A - Not applicable to this endpoint

---

## 🔐 Security Changes

### November 12-14, 2025 - Complete Data Isolation

#### Before:
- ❌ All users shared same Google Sheet
- ❌ Hardcoded webhook URL and secret
- ❌ No authentication required
- ❌ Users could see each other's data

#### After:
- ✅ Each user has isolated Google Sheet
- ✅ Dynamic webhook URL and secret per user
- ✅ JWT authentication required
- ✅ Complete data isolation enforced

#### Security Verification Test:
```typescript
// Test case: Verify zero cross-contamination
async function testDataIsolation() {
  // Login as User A
  const loginA = await login('userA@example.com', 'password');
  const balanceA = await getBalance(loginA.token);
  
  // Logout
  await logout(loginA.token);
  
  // Login as User B
  const loginB = await login('userB@example.com', 'password');
  const balanceB = await getBalance(loginB.token);
  
  // Verify different data
  assert(balanceA.accountId !== balanceB.accountId);
  assert(balanceA.companyName !== balanceB.companyName);
  assert(balanceA.totalCash !== balanceB.totalCash); // Different balances!
}
```

---

## 📱 Migration Guide for Mobile App

### What Needs to Change

#### 1. Remove Hardcoded Configuration ❌

**Delete these:**
```typescript
// ❌ REMOVE THESE CONSTANTS
const GOOGLE_SHEET_ID = '1ABC...XYZ';
const SCRIPT_URL = 'https://script.google.com/macros/s/ABC123/exec';
const SCRIPT_SECRET = 'hardcoded-secret';
```

**Replace with:**
```typescript
// ✅ GET FROM SESSION
const session = await getSession();
const { sheetId, scriptUrl, scriptSecret } = session.account;
```

#### 2. Add Authentication Layer ✅

**New code to add:**
```typescript
// authService.ts
export async function login(email: string, password: string) {
  const response = await fetch('https://accounting.siamoon.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.ok) {
    await AsyncStorage.setItem('@session:token', data.token);
    await AsyncStorage.setItem('@session:account', JSON.stringify(data.account));
    return data;
  }
  
  throw new Error(data.error || 'Login failed');
}
```

#### 3. Update API Calls ✅

**Old approach:**
```typescript
// ❌ OLD - Direct Apps Script
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    secret: SCRIPT_SECRET,
    action: 'getBalance'
  })
});
```

**New approach:**
```typescript
// ✅ NEW - Authenticated web API
const token = await AsyncStorage.getItem('@session:token');
const response = await fetch('https://accounting.siamoon.com/api/balance', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🧪 Testing Checklist

Use this checklist to verify your mobile app works with the new system:

### Authentication Tests
- [ ] Login with valid credentials → Success, receive token + account
- [ ] Login with invalid email → 401 error
- [ ] Login with wrong password → 401 error
- [ ] Login with unregistered email → Error: "No account configured"
- [ ] Logout → Token cleared, session ended
- [ ] API call with expired token → 401 error, auto-logout

### Data Isolation Tests
- [ ] Login as User A → See User A's balance
- [ ] Logout
- [ ] Login as User B → See User B's different balance
- [ ] Verify balances are different (no cross-contamination)
- [ ] Login as User A again → Cache shows User A's data (not User B's)

### Settings Management Tests
- [ ] Get properties → Returns user-specific list
- [ ] Add property → Updates user's list only
- [ ] Get expenses → Returns user-specific categories
- [ ] Update expenses → Updates user's categories only
- [ ] Verify other user doesn't see changes

### Error Handling Tests
- [ ] Network error → Show retry option
- [ ] 401 error → Auto-logout and redirect to login
- [ ] 429 error (rate limit) → Show "wait X seconds" message
- [ ] 500 error → Show "server error" message

---

## 🚀 Deployment Timeline

### Completed ✅
- **Nov 11, 2025:** Authentication system deployed
- **Nov 12, 2025:** Multi-tenant core system deployed
- **Nov 13, 2025:** Multi-tenant P&L endpoints deployed
- **Nov 14, 2025:** Multi-tenant settings endpoints deployed

### Current Status ✅
- **Production:** https://accounting.siamoon.com
- **All endpoints:** Multi-tenant enabled
- **Security:** Complete data isolation
- **Testing:** Verified with multiple accounts

### Mobile Team Next Steps
1. **This week:** Implement authentication
2. **Next week:** Update API calls
3. **Week 3:** Test with multiple accounts
4. **Week 4:** Production deployment

---

## 📞 Support

### Questions?
1. **Check documentation:**
   - [Complete Integration Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)
   - [Start Here Document](./MOBILE_TEAM_START_HERE.md)

2. **Test accounts:**
   - Contact web team for test credentials
   - shaun@siamoon.com (Account 1)
   - maria@siamoon.com (Account 2)

3. **Report issues:**
   - Create GitHub issue for bugs
   - Tag @webapp-team for urgent issues

### Web Team Contact
- **Production URL:** https://accounting.siamoon.com
- **Health Dashboard:** https://accounting.siamoon.com/dashboard/health
- **Response time:** < 4 hours for API issues

---

## 📝 Summary

### What Changed?
✅ **Authentication:** Required for all data endpoints  
✅ **Multi-tenant:** Each user has isolated data  
✅ **Settings:** Users manage their own categories  
✅ **Security:** Complete data isolation enforced

### What Mobile Team Must Do?
1. ⚠️ **Implement authentication** (login/logout)
2. ⚠️ **Remove hardcoded config** (sheet ID, webhook URL, secret)
3. ⚠️ **Use authenticated API calls** (include Bearer token)
4. ⚠️ **Handle 401 errors** (session expiration)
5. ✅ **Test with multiple accounts** (verify isolation)

### Timeline?
- **Authentication:** 1 week
- **API updates:** 1 week  
- **Testing:** 1 week
- **Total:** 3 weeks

---

**Need Help?** Start with the [📱 Complete Integration Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)!

---

**Version:** 1.0  
**Last Updated:** November 14, 2025  
**Next Review:** As needed (when new features added)
