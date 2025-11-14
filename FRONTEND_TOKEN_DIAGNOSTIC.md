# 🔍 Frontend Token Diagnostic Guide

**Issue:** New user seeing admin data  
**Root Cause:** Browser using cached admin token instead of new user's token  
**Solution:** Clear browser storage and use correct token

---

## ✅ Backend Verification: PASSED

Backend test confirmed:
```
✅ New user registration working
✅ Spreadsheet auto-provisioning working  
✅ JWT tokens contain correct user info
✅ /api/auth/me returns correct spreadsheet
✅ Multi-tenant isolation enforced correctly
```

**The backend is NOT the problem.** The issue is frontend token management.

---

## 🔍 Browser Diagnostic Steps

### Step 1: Open Browser DevTools
1. Open your app in browser (https://accounting.siamoon.com)
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab

### Step 2: Check Stored Token
In the console, type:

```javascript
// Check what token is stored
const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
console.log('Stored token:', token);

// Decode it (safe - just reading the payload)
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token belongs to:', payload.email);
  console.log('Token userId:', payload.userId);
  console.log('Token expires:', new Date(payload.exp * 1000));
}
```

**What to look for:**
- If `payload.email` is `"shaun@siamoon.com"` → **That's the problem!**
- If it's the new user's email → Token is correct

### Step 3: Check All Storage
```javascript
// Check everything stored
console.log('=== All localStorage ===');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, ':', localStorage.getItem(key));
}

console.log('\n=== All sessionStorage ===');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  console.log(key, ':', sessionStorage.getItem(key));
}

console.log('\n=== Cookies ===');
console.log(document.cookie);
```

---

## 🔧 Fix Options

### Option 1: Clear Everything (Recommended)
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('✅ All storage cleared!');
// Now refresh and login as new user
```

### Option 2: Clear Specific Keys
```javascript
// If you know the key names:
localStorage.removeItem('authToken');
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
sessionStorage.clear();
console.log('✅ Auth data cleared!');
```

### Option 3: Use Incognito/Private Window
1. Open new **Incognito/Private** window
2. Go to https://accounting.siamoon.com
3. Login as the new user
4. Check if you see their empty spreadsheet data

---

## 🎯 Expected Behavior After Fix

### New User Should See:
- ✅ **Empty spreadsheet data** (or template data)
- ✅ **Their own spreadsheet ID** in the UI
- ✅ **No balance entries** (unless they add some)
- ✅ **No P&L data** (empty)

### Admin Should See:
- ✅ **Existing data** from original spreadsheet
- ✅ **Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- ✅ **All their properties, balances, transactions**

---

## 🐛 Debugging Network Requests

### Check API Calls
1. DevTools → **Network** tab
2. Filter: **Fetch/XHR**
3. Make an API call (e.g., load balance page)
4. Click on the request
5. Go to **Request Headers**
6. Look for **Authorization: Bearer [token]**
7. Copy that token
8. Decode it at https://jwt.io
9. Check the `email` field

**If the Authorization header shows admin's email, but you're logged in as new user → Frontend bug!**

---

## 🔍 Common Frontend Issues

### Issue 1: Token Not Updated on Registration
**Problem:** Registration succeeds but old token still used

**Fix in your registration component:**
```typescript
// After successful registration
const response = await registerUser(email, password, name);

if (response.success) {
  // CRITICAL: Update stored token
  localStorage.setItem('authToken', response.tokens.accessToken);
  localStorage.setItem('refreshToken', response.tokens.refreshToken);
  
  // Update user context/state
  setUser(response.user);
  
  // Redirect
  router.push('/dashboard');
}
```

### Issue 2: Multiple Tabs/Windows
**Problem:** Admin logged in one tab, new user in another

**Fix:**
- Close **ALL** tabs
- Clear browser storage
- Open ONE tab only
- Login fresh

### Issue 3: Service Worker Cache
**Problem:** Service worker caching old API responses

**Fix:**
```javascript
// In DevTools → Application → Service Workers
// Click "Unregister" on any service workers
// Then refresh
```

---

## ✅ Verification Checklist

After clearing storage and logging in as new user:

- [ ] Decoded token shows **new user's email**
- [ ] `/api/auth/me` returns **new user's spreadsheet ID**
- [ ] Network requests show **correct Authorization header**
- [ ] Balance page shows **empty/no data**
- [ ] P&L page shows **empty/no data**
- [ ] UI shows **new user's spreadsheet ID** (not admin's)

---

## 📝 Frontend Code Review

### Check Your Auth Context/Store

**Look for:**
```typescript
// Zustand, Redux, Context, etc.
const authStore = {
  token: '', // Should be updated on login/register
  user: {},  // Should be updated on login/register
};

// On registration
function handleRegister(email, password, name) {
  const response = await api.register(email, password, name);
  
  // MUST DO THIS:
  authStore.token = response.tokens.accessToken;
  authStore.user = response.user;
  localStorage.setItem('authToken', response.tokens.accessToken);
}
```

### Check API Client
```typescript
// Your API client (axios, fetch, etc.)
const apiClient = axios.create({
  baseURL: 'https://accounting.siamoon.com',
  headers: {
    // Should read from current storage, not cached
    Authorization: `Bearer ${localStorage.getItem('authToken')}`
  }
});

// Or better - use interceptor:
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🎯 Quick Test Script

Run this in browser console after "fixing" the issue:

```javascript
(async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('❌ No token found!');
    return;
  }
  
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('📧 Token email:', payload.email);
  
  const response = await fetch('https://accounting.siamoon.com/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  console.log('📊 Spreadsheet ID:', data.user.spreadsheetId);
  console.log('✅ Is admin spreadsheet?', 
    data.user.spreadsheetId === '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8'
  );
  
  if (data.user.email !== payload.email) {
    console.error('❌ MISMATCH: Token and API response email differ!');
  } else {
    console.log('✅ Token and user match!');
  }
})();
```

---

## 📞 Next Steps

1. **Open browser DevTools**
2. **Run diagnostic scripts** above
3. **Identify which token** is being used
4. **Clear storage** if it's admin's token
5. **Login as new user** fresh
6. **Verify** you see empty data
7. **Report back** with findings

---

**TL;DR:** The backend is working perfectly. The frontend is using a cached admin token. Clear `localStorage` and login fresh as the new user.
