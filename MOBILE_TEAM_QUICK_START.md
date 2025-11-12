# 📱 Mobile Team - Quick Start Guide

**TL;DR**: Authentication API is ready. Use these endpoints to login users.

---

## 🎯 What You Need

### 1. API Base URL
```
https://accounting.siamoon.com/api
```

### 2. Primary Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "shaun@siamoon.com",
  "password": "Shaun231!"
}
```

### 3. Response
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "name": "..." },
  "tokens": {
    "accessToken": "eyJhbGc...",  // Use for 15 min
    "refreshToken": "eyJhbGc...", // Use to refresh
    "expiresIn": 900
  }
}
```

### 4. Use Token
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

### 5. Refresh When Expired
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

---

## 📦 What to Store (Securely!)

```typescript
// After successful login, store:
- accessToken  (15 min lifetime)
- refreshToken (7 day lifetime)
- userId
- userEmail
- userName
```

**IMPORTANT**: Use secure storage only!
- iOS: Keychain
- Android: EncryptedSharedPreferences
- React Native: expo-secure-store
- Flutter: flutter_secure_storage

---

## 🔧 Implementation Steps

1. **Build Login Screen**
   - Email input field
   - Password input field
   - Login button

2. **Call Login API**
   ```typescript
   const response = await fetch('https://accounting.siamoon.com/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, password })
   });
   ```

3. **Store Tokens Securely**
   ```typescript
   if (response.ok) {
     const { tokens } = await response.json();
     await SecureStore.setItemAsync('accessToken', tokens.accessToken);
     await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
   }
   ```

4. **Add Authorization Header to All Requests**
   ```typescript
   const token = await SecureStore.getItemAsync('accessToken');
   const response = await fetch(url, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

5. **Handle Token Expiration**
   ```typescript
   if (response.status === 401) {
     // Token expired, refresh it
     await refreshAccessToken();
     // Retry request
   }
   ```

---

## 🧪 Test Credentials

```
Email: shaun@siamoon.com
Password: Shaun231!
```

---

## 📚 Full Documentation

See: **MOBILE_APP_AUTHENTICATION_GUIDE.md**
- Complete API reference
- Code examples for React Native, Flutter, Swift, Kotlin
- Security guidelines
- Error handling
- Implementation timeline

---

## 🆘 Need Help?

Contact: Shaun Ducker (shaun@siamoon.com)

---

**Status**: ✅ Ready to implement  
**Timeline**: 4 weeks  
**Priority**: High
