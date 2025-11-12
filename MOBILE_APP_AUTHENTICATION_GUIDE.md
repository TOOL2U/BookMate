# 📱 Mobile App Authentication Integration Guide

**To**: Mobile App Development Team  
**From**: Backend Development Team  
**Date**: November 12, 2025  
**Subject**: Authentication System Integration - REST API Implementation  
**Priority**: High

---

## 📋 Executive Summary

The BookMate web application has implemented a complete authentication system with:
- ✅ Database-backed user accounts (PostgreSQL)
- ✅ JWT token-based authentication
- ✅ Firebase Auth integration for cross-platform compatibility
- ✅ REST API endpoints ready for mobile consumption

**Your Task**: Integrate the mobile app with our authentication API endpoints.

---

## 🎯 What You Need to Do

### 1. Implement Login Screen
Create a login UI with email/password fields that calls our authentication API.

### 2. Handle JWT Tokens
Store and manage access tokens (15 min) and refresh tokens (7 days).

### 3. Implement Auto-Refresh
Automatically refresh expired access tokens using refresh tokens.

### 4. Handle Authentication State
Maintain user session across app restarts.

---

## 🔌 API Endpoints

### Base URL
```
Production: https://accounting.siamoon.com/api
Development: http://localhost:3000/api
```

### Available Endpoints

#### 1. **User Registration** (Optional - if you want in-app registration)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "User Name",
  "phone": "+1234567890"  // Optional
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firebaseUid": "firebase-uid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "status": "active",
    "emailVerified": false,
    "createdAt": "2025-11-12T07:59:01.241Z"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Response (400/409)**:
```json
{
  "error": "Email already exists"
}
```

---

#### 2. **User Login** ⭐ **PRIMARY ENDPOINT**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "shaun@siamoon.com",
  "password": "Shaun231!"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "8241429b-c546-4bbb-9236-a76847abdab3",
    "firebaseUid": "UTJR1afV2VdPjaEZOSqIx5olZ4x2",
    "email": "shaun@siamoon.com",
    "name": "Shaun Ducker",
    "role": "user",
    "status": "active",
    "emailVerified": false,
    "phone": null,
    "avatarUrl": null,
    "workspaceId": null,
    "organizationId": null,
    "lastLoginAt": "2025-11-12T07:56:39.202Z",
    "lastLoginIp": "::1",
    "loginCount": 1,
    "preferences": {}
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password"
}
```

**Error Response (423 Locked)**:
```json
{
  "error": "Account locked due to multiple failed login attempts. Try again later."
}
```

---

#### 3. **Refresh Access Token** ⭐ **CRITICAL**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGc...",  // New access token
    "refreshToken": "eyJhbGc...", // New refresh token (rotated)
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Response (401)**:
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

#### 4. **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "8241429b-c546-4bbb-9236-a76847abdab3",
    "email": "shaun@siamoon.com",
    "name": "Shaun Ducker",
    "role": "user",
    "status": "active"
    // ... other user fields
  }
}
```

**Error Response (401)**:
```json
{
  "error": "Unauthorized"
}
```

---

#### 5. **Logout**
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."  // Optional but recommended
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🔐 Token Management Guide

### Access Token
- **Lifetime**: 15 minutes
- **Use**: Include in `Authorization: Bearer {token}` header for all API requests
- **Storage**: Secure storage (iOS: Keychain, Android: EncryptedSharedPreferences)
- **Refresh**: When you get a 401 error, use refresh token to get new access token

### Refresh Token
- **Lifetime**: 7 days
- **Use**: Get a new access token when it expires
- **Storage**: Secure storage (same as access token)
- **Rotation**: Each refresh call returns a NEW refresh token (old one is revoked)

### Token Flow Diagram
```
1. User logs in
   ↓
2. Receive access token (15 min) + refresh token (7 days)
   ↓
3. Store both tokens securely
   ↓
4. Use access token for API calls
   ↓
5. When access token expires (401 error)
   ↓
6. Call /api/auth/refresh with refresh token
   ↓
7. Receive NEW access token + NEW refresh token
   ↓
8. Update stored tokens
   ↓
9. Retry original API call with new access token
```

---

## 📱 Implementation Examples

### React Native (TypeScript)

#### 1. **Secure Token Storage**
```typescript
import * as SecureStore from 'expo-secure-store';

// Store tokens
async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
}

// Retrieve tokens
async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('accessToken');
}

async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('refreshToken');
}

// Clear tokens (logout)
async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
```

#### 2. **Login Function**
```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch('https://accounting.siamoon.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store tokens securely
      await storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
      
      // Store user info (optional)
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}
```

#### 3. **Auto-Refresh Token Interceptor**
```typescript
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  let accessToken = await getAccessToken();

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired (401), refresh and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      accessToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed, redirect to login
      throw new Error('Session expired');
    }
  }

  return response;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('https://accounting.siamoon.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store new tokens
      await storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return false;
  }
}
```

#### 4. **Logout Function**
```typescript
async function logout() {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    // Call logout endpoint
    await fetch('https://accounting.siamoon.com/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    // Clear local tokens
    await clearTokens();
    
  } catch (error) {
    console.error('Logout error:', error);
    // Clear tokens even if API call fails
    await clearTokens();
  }
}
```

#### 5. **Check Authentication Status**
```typescript
async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  
  // If no tokens, not authenticated
  if (!accessToken || !refreshToken) {
    return false;
  }

  // Try to get current user
  try {
    const response = await makeAuthenticatedRequest(
      'https://accounting.siamoon.com/api/auth/me'
    );
    
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

### Flutter (Dart)

#### 1. **Secure Token Storage**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Store tokens
Future<void> storeTokens(String accessToken, String refreshToken) async {
  await storage.write(key: 'accessToken', value: accessToken);
  await storage.write(key: 'refreshToken', value: refreshToken);
}

// Retrieve tokens
Future<String?> getAccessToken() async {
  return await storage.read(key: 'accessToken');
}

Future<String?> getRefreshToken() async {
  return await storage.read(key: 'refreshToken');
}

// Clear tokens
Future<void> clearTokens() async {
  await storage.delete(key: 'accessToken');
  await storage.delete(key: 'refreshToken');
}
```

#### 2. **Login Function**
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> login(String email, String password) async {
  try {
    final response = await http.post(
      Uri.parse('https://accounting.siamoon.com/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      // Store tokens securely
      await storeTokens(
        data['tokens']['accessToken'],
        data['tokens']['refreshToken'],
      );
      
      return {'success': true, 'user': data['user']};
    } else {
      return {'success': false, 'error': data['error']};
    }
  } catch (error) {
    print('Login error: $error');
    return {'success': false, 'error': 'Network error'};
  }
}
```

---

### Swift (iOS Native)

#### 1. **Secure Token Storage**
```swift
import Security

func storeToken(_ token: String, key: String) {
    let data = token.data(using: .utf8)!
    
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: key,
        kSecValueData as String: data
    ]
    
    SecItemDelete(query as CFDictionary)
    SecItemAdd(query as CFDictionary, nil)
}

func getToken(key: String) -> String? {
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: key,
        kSecReturnData as String: true
    ]
    
    var result: AnyObject?
    SecItemCopyMatching(query as CFDictionary, &result)
    
    if let data = result as? Data {
        return String(data: data, encoding: .utf8)
    }
    return nil
}
```

#### 2. **Login Function**
```swift
func login(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
    let url = URL(string: "https://accounting.siamoon.com/api/auth/login")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: String] = ["email": email, "password": password]
    request.httpBody = try? JSONEncoder().encode(body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data, error == nil else {
            completion(.failure(error!))
            return
        }
        
        if let json = try? JSONDecoder().decode(LoginResponse.self, from: data),
           json.success {
            // Store tokens
            storeToken(json.tokens.accessToken, key: "accessToken")
            storeToken(json.tokens.refreshToken, key: "refreshToken")
            
            completion(.success(json.user))
        } else {
            completion(.failure(NSError(domain: "LoginError", code: 401)))
        }
    }.resume()
}
```

---

### Kotlin (Android Native)

#### 1. **Secure Token Storage**
```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun storeTokens(accessToken: String, refreshToken: String) {
        sharedPreferences.edit().apply {
            putString("accessToken", accessToken)
            putString("refreshToken", refreshToken)
            apply()
        }
    }

    fun getAccessToken(): String? = sharedPreferences.getString("accessToken", null)
    
    fun getRefreshToken(): String? = sharedPreferences.getString("refreshToken", null)
    
    fun clearTokens() {
        sharedPreferences.edit().clear().apply()
    }
}
```

#### 2. **Login Function**
```kotlin
import retrofit2.http.*

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body credentials: LoginRequest): LoginResponse
}

data class LoginRequest(val email: String, val password: String)

suspend fun login(email: String, password: String): Result<User> {
    return try {
        val response = authApi.login(LoginRequest(email, password))
        
        if (response.success) {
            tokenManager.storeTokens(
                response.tokens.accessToken,
                response.tokens.refreshToken
            )
            Result.success(response.user)
        } else {
            Result.failure(Exception(response.error))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

---

## 🔒 Security Requirements

### 1. **HTTPS Only**
- ✅ All API calls MUST use HTTPS in production
- ✅ Never send tokens over HTTP

### 2. **Secure Storage**
- ✅ iOS: Use Keychain
- ✅ Android: Use EncryptedSharedPreferences
- ✅ React Native: Use expo-secure-store or react-native-keychain
- ✅ Flutter: Use flutter_secure_storage
- ❌ NEVER use AsyncStorage, UserDefaults, or SharedPreferences (plain)

### 3. **Token Handling**
- ✅ Store tokens in secure storage
- ✅ Include access token in Authorization header
- ✅ Implement automatic token refresh
- ✅ Clear tokens on logout
- ❌ NEVER log tokens to console in production
- ❌ NEVER store tokens in plain text

### 4. **Password Validation**
Before sending to API, validate:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 🧪 Testing Credentials

### Test Account
- **Email**: `shaun@siamoon.com`
- **Password**: `Shaun231!`
- **User ID**: `8241429b-c546-4bbb-9236-a76847abdab3`

### Test Endpoints
- **Development**: `http://localhost:3000/api` (requires VPN/local network)
- **Production**: `https://accounting.siamoon.com/api`

---

## 🐛 Error Handling

### HTTP Status Codes
| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Show error message to user |
| 401 | Unauthorized | Try refresh token, then redirect to login |
| 409 | Conflict | Email already exists (registration) |
| 423 | Locked | Account locked, show message |
| 500 | Server Error | Show "Try again later" |

### Common Errors

**Invalid Credentials**
```json
{
  "error": "Invalid email or password"
}
```
**Action**: Show error message, allow retry

**Account Locked**
```json
{
  "error": "Account locked due to multiple failed login attempts. Try again later."
}
```
**Action**: Show message, disable login for 30 minutes

**Expired Token**
```json
{
  "error": "Invalid or expired token"
}
```
**Action**: Use refresh token to get new access token

**Email Already Exists**
```json
{
  "error": "Email already exists"
}
```
**Action**: Suggest login instead of registration

---

## 📊 User Flow Diagram

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check if        │
│ tokens exist?   │
└────┬───────┬────┘
     │       │
   YES       NO
     │       │
     │       ▼
     │  ┌─────────────┐
     │  │ Show Login  │
     │  │   Screen    │
     │  └──────┬──────┘
     │         │
     │         ▼
     │  ┌─────────────┐
     │  │ User enters │
     │  │ credentials │
     │  └──────┬──────┘
     │         │
     │         ▼
     │  ┌─────────────┐
     │  │ POST /login │
     │  └──────┬──────┘
     │         │
     ▼         ▼
┌─────────────────┐
│ Validate token  │
│ GET /auth/me    │
└────┬───────┬────┘
     │       │
   VALID  INVALID
     │       │
     │       ▼
     │  ┌─────────────┐
     │  │ Try refresh │
     │  │   token     │
     │  └──────┬──────┘
     │         │
     │    ┌────┴────┐
     │  SUCCESS  FAIL
     │    │        │
     ▼    ▼        ▼
┌─────────────────┐
│ Show Dashboard  │
└─────────────────┘
         OR
┌─────────────────┐
│  Show Login     │
└─────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Basic Authentication (Week 1)
- [ ] Set up secure token storage
- [ ] Implement login screen UI
- [ ] Implement login API call
- [ ] Store tokens on successful login
- [ ] Redirect to dashboard after login
- [ ] Test with provided credentials

### Phase 2: Token Management (Week 1-2)
- [ ] Implement token refresh logic
- [ ] Add Authorization header to all API calls
- [ ] Handle 401 errors with auto-refresh
- [ ] Implement logout functionality
- [ ] Clear tokens on logout

### Phase 3: User Experience (Week 2)
- [ ] Show loading indicators during login
- [ ] Display error messages from API
- [ ] Implement "Remember me" (optional)
- [ ] Add password visibility toggle
- [ ] Validate email format before API call
- [ ] Validate password strength before API call

### Phase 4: Session Persistence (Week 2-3)
- [ ] Check token validity on app launch
- [ ] Auto-login if valid tokens exist
- [ ] Redirect to login if no valid tokens
- [ ] Handle app backgrounding/foregrounding
- [ ] Implement session timeout (7 days)

### Phase 5: Optional Features (Week 3+)
- [ ] Implement registration screen
- [ ] Add forgot password flow (when backend ready)
- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Add "Sign in with Google" (when backend ready)
- [ ] Add offline mode detection

---

## 📚 API Documentation Links

- **Full API Docs**: `docs/AUTHENTICATION_SETUP.md` (in web repo)
- **Postman Collection**: (To be provided)
- **API Testing**: Use Postman or cURL with examples above

---

## 🤝 Support & Contact

### Questions?
- **Backend Team**: Shaun Ducker (shaun@siamoon.com)
- **API Issues**: Check server logs or contact backend team
- **Documentation**: See `AUTH_SYSTEM_COMPLETE.md` in web repo

### Need Help?
1. Check this document first
2. Test with cURL/Postman to isolate issue
3. Provide error logs and request/response data
4. Contact backend team with specific questions

---

## 🚀 Timeline

- **Week 1**: Implement basic login/logout
- **Week 2**: Add token refresh and session management
- **Week 3**: Polish UI/UX and error handling
- **Week 4**: Testing and bug fixes

**Target Launch**: 4 weeks from today

---

## 📝 Notes

1. **Firebase UID**: The API creates a Firebase user on registration. The `firebaseUid` field links web and mobile accounts.

2. **Token Rotation**: Each time you refresh a token, you get a NEW refresh token. The old one is revoked.

3. **Account Locking**: After 5 failed login attempts, the account locks for 30 minutes.

4. **Cross-Platform**: The same user account works on both web and mobile. The `firebaseUid` keeps them synced.

5. **IP Tracking**: The API logs login IP addresses for security. This is automatic.

---

**Document Version**: 1.0  
**Last Updated**: November 12, 2025  
**Status**: Ready for Implementation

---

## ✅ Summary

You have everything you need to implement mobile authentication:
- ✅ REST API endpoints
- ✅ Request/response examples
- ✅ Code samples (React Native, Flutter, Swift, Kotlin)
- ✅ Security guidelines
- ✅ Error handling
- ✅ Test credentials
- ✅ Implementation timeline

**Next Steps**:
1. Review this document
2. Set up secure token storage
3. Implement login screen
4. Test with provided credentials
5. Report any issues to backend team

Good luck! 🚀
