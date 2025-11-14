# 📱 BookMate Mobile App Integration - Complete Guide

**Date:** November 14, 2025  
**Version:** 2.0 (Multi-Tenant System)  
**For:** Mobile App Engineering Team  
**Production API:** https://accounting.siamoon.com

---

## 🎯 Executive Summary

The BookMate web application has undergone a **major architectural transformation** from a single-tenant to a **multi-tenant system** with complete data isolation. This document provides everything your mobile app team needs to integrate with the new system.

### What Changed?
- ✅ **Multi-tenant architecture** - Each user has their own Google Sheet and data
- ✅ **Session-based authentication** - JWT tokens with HttpOnly cookies
- ✅ **Account-specific APIs** - All endpoints now use user-specific configurations
- ✅ **Complete data isolation** - Zero cross-contamination between accounts
- ✅ **Settings management** - Users can manage their own categories/properties

### What This Means for Mobile App
- 🔄 **Authentication flow** - Users log in with email/password, system handles account mapping
- 🔄 **No hardcoded values** - All configuration (sheet ID, webhook URL, secrets) is dynamic per user
- ✅ **Existing APIs still work** - Same endpoints, but now properly isolated per account
- ✅ **Settings sync** - Users can manage categories in web app, mobile app sees changes

---

## 📚 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Authentication System](#authentication-system)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Multi-Tenant Data Flow](#multi-tenant-data-flow)
5. [Mobile App Integration Steps](#mobile-app-integration-steps)
6. [Code Examples](#code-examples)
7. [Testing Guide](#testing-guide)
8. [Migration from Old System](#migration-from-old-system)
9. [Security & Best Practices](#security--best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture Overview

### Old System (Single-Tenant)
```
Mobile App → Hardcoded Webhook URL → Single Google Sheet
                ↓
        Hardcoded Secret
```

**Problem:** All users shared the same Google Sheet. No data isolation.

### New System (Multi-Tenant)
```
Mobile App → Web API → Firebase Auth → Account Config (Firestore)
                ↓
        User's Specific Google Sheet + Webhook URL + Secret
```

**Benefits:**
- ✅ Each user has their own Google Sheet
- ✅ Each user has their own webhook URL and secret
- ✅ Complete data isolation
- ✅ Settings managed per account
- ✅ Scalable to unlimited users

### Data Flow Diagram
```
┌─────────────────┐
│   Mobile App    │
│   (Login UI)    │
└────────┬────────┘
         │ POST /api/auth/login
         │ { email, password }
         ▼
┌─────────────────┐
│  Web API Server │
│  (accounting.   │
│   siamoon.com)  │
└────────┬────────┘
         │
         ├─1─► Firebase Auth (verify user)
         │
         ├─2─► Create JWT session token
         │
         ├─3─► Query Firestore: accounts collection
         │     WHERE userEmail == email
         │
         └─4─► Return session + account config
               { token, accountId, companyName, sheetId, scriptUrl, scriptSecret }

┌─────────────────┐
│   Mobile App    │
│ (Subsequent API │
│    Requests)    │
└────────┬────────┘
         │ GET /api/balance
         │ Headers: { Authorization: Bearer <token> }
         ▼
┌─────────────────┐
│  Web API Server │
│ (Verify Token)  │
└────────┬────────┘
         │
         ├─1─► Decode JWT → extract userId & email
         │
         ├─2─► Query Firestore: accounts collection
         │     WHERE userEmail == email
         │
         ├─3─► Use account.scriptUrl + account.scriptSecret
         │     to fetch data from user's Google Sheet
         │
         └─4─► Return user-specific data
               Cache key: balance-{accountId}-{period}
```

---

## 🔐 Authentication System

### Overview
The web application now uses **Firebase Authentication** with **JWT session tokens** stored in HttpOnly cookies. Mobile apps must integrate with this system.

### Authentication Flow for Mobile Apps

#### Step 1: User Login
```typescript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "user": {
    "uid": "firebase-uid-123",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "account": {
    "accountId": "user-example-com",
    "companyName": "Example Company Ltd.",
    "userEmail": "user@example.com",
    "sheetId": "1ABC...XYZ",
    "scriptUrl": "https://script.google.com/macros/s/ABC123/exec",
    "scriptSecret": "super-secret-key-123"
  }
}
```

**Response (Error - 401):**
```json
{
  "ok": false,
  "error": "Invalid email or password"
}
```

**Response (Error - Account Not Found):**
```json
{
  "ok": false,
  "error": "No account configured for this user. Please contact support."
}
```

#### Step 2: Store Session Data
Mobile app should store:
- `token` - For subsequent API requests
- `account` - Account configuration for direct Apps Script calls (if needed)
- `user` - User profile information

```typescript
// Example: AsyncStorage (React Native)
await AsyncStorage.multiSet([
  ['@session:token', response.token],
  ['@session:account', JSON.stringify(response.account)],
  ['@session:user', JSON.stringify(response.user)]
]);
```

#### Step 3: Make Authenticated Requests
All API requests must include the token in the `Authorization` header:

```typescript
const token = await AsyncStorage.getItem('@session:token');

const response = await fetch('https://accounting.siamoon.com/api/balance', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Step 4: Handle Token Expiration
Tokens expire after 7 days. If you receive a 401 response, the user must log in again.

```typescript
if (response.status === 401) {
  const error = await response.json();
  if (error.error?.includes('expired') || error.error?.includes('Invalid session')) {
    // Clear session and redirect to login
    await AsyncStorage.multiRemove(['@session:token', '@session:account', '@session:user']);
    navigateToLogin();
  }
}
```

### User Signup
For new users:

```typescript
// POST /api/auth/signup
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "user": {
    "uid": "firebase-uid-456",
    "email": "newuser@example.com",
    "displayName": "New User"
  }
}
```

**Note:** After signup, the **admin must configure the account** in Firestore before the user can log in to the mobile app. The signup creates the Firebase user, but an admin needs to create the corresponding account configuration with sheetId, scriptUrl, etc.

### Logout
```typescript
// POST /api/auth/logout-session
// No body required, just include Authorization header

const response = await fetch('https://accounting.siamoon.com/api/auth/logout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Clear local storage
await AsyncStorage.multiRemove(['@session:token', '@session:account', '@session:user']);
```

---

## 📡 API Endpoints Reference

### Base URL
```
Production: https://accounting.siamoon.com
```

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | User login | ❌ |
| `/api/auth/signup` | POST | Create new user | ❌ |
| `/api/auth/logout-session` | POST | User logout | ✅ |
| `/api/auth/me` | GET | Get current user | ✅ |

### Data Endpoints (All Multi-Tenant Enabled ✅)

| Endpoint | Method | Description | Auth Required | Rate Limit |
|----------|--------|-------------|---------------|------------|
| `/api/balance` | GET | Get account balance | ✅ | 100/min |
| `/api/pnl` | GET | Get P&L report | ✅ | 100/min |
| `/api/pnl/property-person` | GET | Property/Person breakdown | ✅ | 100/min |
| `/api/pnl/overhead-expenses` | GET | Overhead expenses breakdown | ✅ | 100/min |
| `/api/inbox` | GET | Get inbox items | ✅ | 100/min |
| `/api/inbox` | POST | Create inbox item | ✅ | 30/min |
| `/api/inbox` | DELETE | Delete inbox item | ✅ | 30/min |
| `/api/options` | GET | Get dropdown options | ✅ | 100/min |

### Settings/Categories Endpoints (All Multi-Tenant Enabled ✅)

| Endpoint | Method | Description | Auth Required | Rate Limit |
|----------|--------|-------------|---------------|------------|
| `/api/categories/properties` | GET | Get property list | ✅ | 100/min |
| `/api/categories/properties` | POST | Update properties | ✅ | 30/min |
| `/api/categories/expenses` | GET | Get expense categories | ✅ | 100/min |
| `/api/categories/expenses` | POST | Update expenses | ✅ | 30/min |
| `/api/categories/revenues` | GET | Get revenue categories | ✅ | 100/min |
| `/api/categories/revenues` | POST | Update revenues | ✅ | 30/min |
| `/api/categories/payments` | GET | Get payment types | ✅ | 100/min |
| `/api/categories/payments` | POST | Update payments | ✅ | 30/min |
| `/api/categories/sync` | POST | Sync categories to sheet | ✅ | 10/min |

### Health/Monitoring Endpoints

| Endpoint | Method | Description | Auth Required | Rate Limit |
|----------|--------|-------------|---------------|------------|
| `/api/health/balance` | GET | Health check + sync status | ❌ | 200/min |
| `/api/admin/system-health` | GET | Full system health | ✅ (Admin) | 10/min |

---

## 🔄 Multi-Tenant Data Flow

### How Account Isolation Works

Every authenticated API request follows this flow:

1. **Extract Token** - Server reads `Authorization: Bearer <token>` header
2. **Verify Token** - Decode JWT and validate signature
3. **Get User Email** - Extract user email from token payload
4. **Query Firestore** - Fetch account config: `accounts.where('userEmail', '==', email)`
5. **Use Account Config** - All subsequent operations use:
   - `account.sheetId` - User's Google Sheet ID
   - `account.scriptUrl` - User's Apps Script webhook URL
   - `account.scriptSecret` - User's webhook secret
6. **Cache with Isolation** - Cache keys include `accountId`: `balance-{accountId}-month`
7. **Return User Data** - Only data from user's Google Sheet is returned

### Example: Balance API

**Old System (Single-Tenant):**
```typescript
// ❌ All users hit same sheet
const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Shared!
const data = await fetchFromSheet(SHEET_ID);
```

**New System (Multi-Tenant):**
```typescript
// ✅ Each user gets their own sheet
const account = await getAccountFromSession(req);
const sheetId = account.sheetId; // User-specific!
const data = await fetchFromSheet(sheetId);
```

### Cache Isolation

**Old System:**
```typescript
// ❌ Shared cache - user A sees user B's data!
const cacheKey = `balance-month`;
```

**New System:**
```typescript
// ✅ Isolated cache - each user has own cache entry
const cacheKey = `balance-${account.accountId}-month`;
```

---

## 📱 Mobile App Integration Steps

### Phase 1: Authentication Implementation

#### 1.1 Create Auth Service
```typescript
// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://accounting.siamoon.com';

export interface LoginResponse {
  ok: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string | null;
  };
  token?: string;
  account?: {
    accountId: string;
    companyName: string;
    userEmail: string;
    sheetId: string;
    scriptUrl: string;
    scriptSecret: string;
  };
  error?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.ok && data.token && data.account) {
    // Store session data
    await AsyncStorage.multiSet([
      ['@session:token', data.token],
      ['@session:account', JSON.stringify(data.account)],
      ['@session:user', JSON.stringify(data.user)],
    ]);
  }

  return data;
}

export async function logout(): Promise<void> {
  const token = await AsyncStorage.getItem('@session:token');

  if (token) {
    // Call logout endpoint
    try {
      await fetch(`${API_BASE}/api/auth/logout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Clear local storage
  await AsyncStorage.multiRemove([
    '@session:token',
    '@session:account',
    '@session:user',
  ]);
}

export async function getSession() {
  const [token, accountJson, userJson] = await AsyncStorage.multiGet([
    '@session:token',
    '@session:account',
    '@session:user',
  ]);

  if (!token[1] || !accountJson[1] || !userJson[1]) {
    return null;
  }

  return {
    token: token[1],
    account: JSON.parse(accountJson[1]),
    user: JSON.parse(userJson[1]),
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await AsyncStorage.getItem('@session:token');
  return !!token;
}
```

#### 1.2 Create API Client
```typescript
// services/apiClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://accounting.siamoon.com';

class ApiClient {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('@session:token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - session expired
    if (response.status === 401) {
      // Clear session and redirect to login
      await AsyncStorage.multiRemove([
        '@session:token',
        '@session:account',
        '@session:user',
      ]);
      
      throw new Error('Session expired. Please login again.');
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiClient();
```

#### 1.3 Create Login Screen
```typescript
// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { login } from '../services/authService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.ok) {
        // Success - navigate to main app
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', response.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### Phase 2: API Integration

#### 2.1 Fetch Balance
```typescript
// hooks/useBalance.ts
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export function useBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/balance');
      setBalance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, error, refresh: fetchBalance };
}
```

#### 2.2 Fetch P&L
```typescript
// hooks/usePnL.ts
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export function usePnL(period: 'month' | 'year' = 'month') {
  const [pnl, setPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPnL();
  }, [period]);

  const fetchPnL = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/pnl?period=${period}`);
      setPnl(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { pnl, loading, error, refresh: fetchPnL };
}
```

#### 2.3 Manage Categories
```typescript
// hooks/useCategories.ts
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export function useCategories(type: 'properties' | 'expenses' | 'revenues' | 'payments') {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/categories/${type}`);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCategories = async (newCategories: string[]) => {
    try {
      await apiClient.post(`/api/categories/${type}`, {
        categories: newCategories
      });
      setCategories(newCategories);
    } catch (err) {
      throw err;
    }
  };

  return { categories, loading, error, refresh: fetchCategories, update: updateCategories };
}
```

### Phase 3: Testing & Deployment

See [Testing Guide](#testing-guide) section below.

---

## 💻 Code Examples

### Complete Working Example: Dashboard Screen

```typescript
// screens/DashboardScreen.tsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl, Button } from 'react-native';
import { useBalance } from '../hooks/useBalance';
import { usePnL } from '../hooks/usePnL';
import { logout } from '../services/authService';

export function DashboardScreen({ navigation }) {
  const { balance, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useBalance();
  const { pnl, loading: pnlLoading, error: pnlError, refresh: refreshPnL } = usePnL('month');

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const handleRefresh = async () => {
    await Promise.all([refreshBalance(), refreshPnL()]);
  };

  if (balanceLoading || pnlLoading) {
    return <Text>Loading...</Text>;
  }

  if (balanceError || pnlError) {
    return <Text>Error: {balanceError || pnlError}</Text>;
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={balanceLoading} onRefresh={handleRefresh} />
      }
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          {balance?.companyName || 'BookMate'}
        </Text>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18 }}>Cash Balance</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold' }}>
            ฿{balance?.totalCash?.toLocaleString() || '0'}
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18 }}>Monthly P&L</Text>
          <Text>Revenue: ฿{pnl?.totalRevenue?.toLocaleString() || '0'}</Text>
          <Text>Expenses: ฿{pnl?.totalExpenses?.toLocaleString() || '0'}</Text>
          <Text style={{ fontWeight: 'bold' }}>
            Net: ฿{pnl?.netProfit?.toLocaleString() || '0'}
          </Text>
        </View>

        <Button title="Logout" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}
```

---

## 🧪 Testing Guide

### Test Accounts

| Account | Email | Purpose |
|---------|-------|---------|
| Test Account 1 | shaun@siamoon.com | Primary test account |
| Test Account 2 | maria@siamoon.com | Multi-tenant isolation testing |

**Note:** Contact web team for test passwords.

### Testing Checklist

#### Authentication Tests
- [ ] Login with valid credentials → Success, receives token + account
- [ ] Login with invalid credentials → 401 error
- [ ] Login with email that has no account → Error message
- [ ] Logout → Token cleared, redirects to login
- [ ] Make API call with expired token → 401 error, auto-logout

#### Data Isolation Tests
- [ ] Login as shaun@siamoon.com → See Shaun's data
- [ ] Logout
- [ ] Login as maria@siamoon.com → See Maria's different data
- [ ] Verify no data overlap between accounts
- [ ] Check cache doesn't show wrong user's data

#### API Integration Tests
- [ ] GET /api/balance → Returns user-specific balance
- [ ] GET /api/pnl → Returns user-specific P&L
- [ ] GET /api/categories/properties → Returns user's properties
- [ ] POST /api/categories/properties → Updates user's properties only
- [ ] GET /api/pnl/property-person → Returns user's property breakdown
- [ ] GET /api/pnl/overhead-expenses → Returns user's overhead expenses

#### Settings Management Tests
- [ ] Login as User A
- [ ] Add property "Building A" in web app
- [ ] Fetch categories in mobile app → "Building A" appears
- [ ] Add property "Building B" in mobile app
- [ ] Check web app → "Building B" appears
- [ ] Logout, login as User B
- [ ] Verify User B doesn't see User A's properties

---

## 🔄 Migration from Old System

### What Needs to Change in Mobile App

#### 1. Remove Hardcoded Configuration ❌

**Old Code (Remove this):**
```typescript
// ❌ DELETE THESE
const SCRIPT_URL = 'https://script.google.com/macros/s/ABC123/exec';
const SCRIPT_SECRET = 'my-secret-key';
const SHEET_ID = '1ABC...XYZ';
```

**New Code (Use this):**
```typescript
// ✅ Get from account session
const session = await getSession();
const { scriptUrl, scriptSecret, sheetId } = session.account;
```

#### 2. Add Authentication Layer ✅

**Old Code:**
```typescript
// ❌ Direct calls without auth
fetch('https://script.google.com/macros/s/ABC123/exec', {
  method: 'POST',
  body: JSON.stringify({
    secret: 'hardcoded-secret',
    data: ...
  })
});
```

**New Code:**
```typescript
// ✅ Use authenticated API client
await apiClient.post('/api/endpoint', {
  data: ...
});
```

#### 3. Update Data Fetching ✅

**Old Code:**
```typescript
// ❌ Fetch from hardcoded Apps Script
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    secret: SCRIPT_SECRET,
    action: 'getBalance'
  })
});
```

**New Code:**
```typescript
// ✅ Fetch from web API (which handles multi-tenancy)
const balance = await apiClient.get('/api/balance');
```

### Migration Timeline Recommendation

1. **Week 1:** Implement authentication (login/logout screens)
2. **Week 2:** Replace hardcoded config with session-based config
3. **Week 3:** Update all API calls to use new endpoints
4. **Week 4:** Testing with multiple accounts
5. **Week 5:** Production deployment

---

## 🔒 Security & Best Practices

### Token Storage
✅ **DO:**
- Store tokens in secure storage (AsyncStorage with encryption, Keychain/Keystore)
- Clear tokens on logout
- Handle 401 errors by clearing session and redirecting to login

❌ **DON'T:**
- Log tokens to console
- Store tokens in plain text files
- Send tokens in URL query parameters

### API Requests
✅ **DO:**
- Always include `Authorization: Bearer <token>` header
- Use HTTPS (https://accounting.siamoon.com)
- Handle errors gracefully
- Implement retry logic for network errors

❌ **DON'T:**
- Send tokens in request body
- Cache sensitive data without encryption
- Ignore SSL certificate errors

### Account Data
✅ **DO:**
- Treat `scriptSecret` as sensitive
- Clear account data on logout
- Validate data from API responses

❌ **DON'T:**
- Log `scriptSecret` to console
- Expose account config in error messages
- Share account data between user sessions

### Rate Limiting
✅ **DO:**
- Implement client-side caching (5-10 minutes for balance data)
- Use pull-to-refresh instead of auto-refresh every second
- Handle 429 (Too Many Requests) errors gracefully

❌ **DON'T:**
- Poll APIs excessively (<30 seconds interval)
- Retry failed requests immediately without backoff
- Ignore rate limit headers

---

## 🐛 Troubleshooting

### Common Issues

#### Issue 1: "Not authenticated" error
**Symptoms:** API returns 401 even after login

**Solutions:**
1. Check token is being sent: `console.log(headers['Authorization'])`
2. Verify token hasn't expired (tokens last 7 days)
3. Ensure token is prefixed with "Bearer ": `Bearer eyJhbGc...`
4. Check API endpoint URL is correct

#### Issue 2: "No account configured" error
**Symptoms:** Login succeeds but returns error about account

**Solutions:**
1. Verify user's email exists in Firestore `accounts` collection
2. Check account document has required fields: `sheetId`, `scriptUrl`, `scriptSecret`
3. Contact admin to configure account in Firestore

#### Issue 3: Wrong data displayed
**Symptoms:** User sees another user's data

**Solutions:**
1. Verify you're sending correct token (not cached from previous user)
2. Clear app storage and login again
3. Check API responses for `accountId` - should match logged-in user
4. Report to web team - this is a critical bug

#### Issue 4: Session expires immediately
**Symptoms:** User has to login again after closing app

**Solutions:**
1. Check AsyncStorage is persisting correctly
2. Verify token is not being cleared unintentionally
3. Check app isn't calling logout on app close

#### Issue 5: Rate limit errors (429)
**Symptoms:** "Too many requests" error

**Solutions:**
1. Implement caching for frequently accessed data
2. Reduce polling frequency (use 30-60 second intervals)
3. Check rate limit headers in response
4. Wait for `X-RateLimit-Reset` time before retrying

---

## 📞 Support & Contact

### Web Team Contacts
- **GitHub Repository:** TOOL2U/BookMate
- **Production URL:** https://accounting.siamoon.com
- **Health Dashboard:** https://accounting.siamoon.com/dashboard/health

### Getting Help
1. **Check this document first** - Most questions are answered here
2. **Review previous reports:**
   - `MOBILE_INTEGRATION_CONFIRMATION.md` - Earlier mobile integration docs
   - `PHASE_3-1_MOBILE_QUICK_START.md` - Account config setup
   - `PHASE_3-2_MOBILE_API_CLIENT.md` - API client implementation
3. **Create GitHub issue** - For bugs or feature requests
4. **Contact web team** - For urgent production issues

### Response Times
- **Critical Issues (Production down):** < 2 hours
- **API Issues:** < 4 hours
- **Feature Requests:** 1-2 weeks
- **Documentation Updates:** 24-48 hours

---

## 📋 API Endpoint Details

### Balance API
```
GET /api/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "companyName": "Example Company",
  "totalCash": 250000,
  "totalBank": 500000,
  "cashDetails": [
    { "property": "Office", "amount": 100000 },
    { "property": "Warehouse", "amount": 150000 }
  ],
  "bankDetails": [
    { "property": "Office", "amount": 300000 },
    { "property": "Warehouse", "amount": 200000 }
  ],
  "lastUpdated": "2025-11-14T10:30:00Z",
  "accountId": "user-example-com"
}
```

### P&L API
```
GET /api/pnl?period=month
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: `month` | `year`

**Response:**
```json
{
  "ok": true,
  "period": "month",
  "periodLabel": "November 2025",
  "totalRevenue": 150000,
  "totalExpenses": 85000,
  "netProfit": 65000,
  "profitMargin": 43.3,
  "revenueBreakdown": [
    { "category": "Rent Income", "amount": 120000 },
    { "category": "Service Fees", "amount": 30000 }
  ],
  "expenseBreakdown": [
    { "category": "Construction", "amount": 45000 },
    { "category": "Utilities", "amount": 25000 },
    { "category": "Overhead", "amount": 15000 }
  ],
  "accountId": "user-example-com"
}
```

### Property/Person Breakdown API
```
GET /api/pnl/property-person?period=month
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "period": "month",
  "periodLabel": "November 2025",
  "breakdown": [
    {
      "property": "Building A",
      "revenue": 60000,
      "expenses": 35000,
      "net": 25000,
      "profitMargin": 41.7
    },
    {
      "property": "Building B",
      "revenue": 90000,
      "expenses": 50000,
      "net": 40000,
      "profitMargin": 44.4
    }
  ],
  "accountId": "user-example-com"
}
```

### Overhead Expenses Breakdown API
```
GET /api/pnl/overhead-expenses?period=month
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "period": "month",
  "periodLabel": "November 2025",
  "totalOverhead": 15000,
  "breakdown": [
    { "category": "Office Supplies", "amount": 5000 },
    { "category": "Marketing", "amount": 7000 },
    { "category": "Professional Fees", "amount": 3000 }
  ],
  "accountId": "user-example-com"
}
```

### Categories API
```
GET /api/categories/properties
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "categories": [
    "Building A",
    "Building B",
    "Warehouse",
    "Office"
  ],
  "accountId": "user-example-com"
}
```

**Update Categories:**
```
POST /api/categories/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "categories": [
    "Building A",
    "Building B",
    "Warehouse",
    "Office",
    "New Building"
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Properties updated successfully",
  "count": 5
}
```

### Inbox API
```
GET /api/inbox
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": "inbox-123",
      "detail": "Pay utility bill",
      "amount": 5000,
      "date": "2025-11-15",
      "category": "Utilities",
      "status": "pending"
    }
  ],
  "accountId": "user-example-com"
}
```

**Create Inbox Item:**
```
POST /api/inbox
Authorization: Bearer <token>
Content-Type: application/json

{
  "detail": "Pay contractor",
  "amount": 25000,
  "date": "2025-11-20",
  "category": "Construction"
}
```

**Delete Inbox Item:**
```
DELETE /api/inbox?id=inbox-123
Authorization: Bearer <token>
```

---

## 🎯 Summary & Next Steps

### What We've Built
✅ **Multi-tenant system** - Complete data isolation per user  
✅ **Session-based auth** - Secure JWT tokens with 7-day expiry  
✅ **Account-specific APIs** - All endpoints use user's Google Sheet  
✅ **Settings management** - Users manage their own categories/properties  
✅ **Full API documentation** - Complete reference for mobile integration

### What Mobile Team Needs to Do
1. **Implement authentication** - Login/logout screens with session management
2. **Update API calls** - Use new authenticated endpoints
3. **Remove hardcoded config** - Use dynamic account configuration
4. **Test multi-tenancy** - Verify data isolation with multiple accounts
5. **Deploy to production** - Roll out to users

### Timeline Estimate
- **Authentication:** 1 week
- **API Integration:** 2 weeks
- **Testing:** 1 week
- **Production Deployment:** 1 week
- **Total:** 5 weeks

### We're Here to Help!
The web team is standing by to support your integration. Don't hesitate to reach out with questions or issues.

---

**Document Version:** 2.0  
**Last Updated:** November 14, 2025  
**Prepared by:** Web Application Team  
**For:** Mobile App Engineering Team  

🚀 **Ready to integrate? Let's make BookMate mobile amazing!**
