# Authentication System Setup Guide

## 📚 Overview

This guide covers the complete authentication system for BookMate, including user registration, login, session management, and Firebase integration.

## 🗄️ Database Schema

### User Model
Stores user account information with support for multiple authentication providers.

**Fields:**
- `id` - Unique user identifier (UUID)
- `firebaseUid` - Firebase Auth UID (for mobile app sync)
- `email` - User email address (unique)
- `emailVerified` - Email verification status
- `name` - User display name
- `avatarUrl` - Profile picture URL
- `phone` - Phone number
- `passwordHash` - Hashed password (bcrypt)
- `provider` - Auth provider (email, google, apple)
- `status` - Account status (active, suspended, deleted)
- `role` - User role (user, admin, owner)
- `workspaceId` - Associated workspace
- `organizationId` - Associated organization
- `lastLoginAt` - Last successful login timestamp
- `lastLoginIp` - Last login IP address
- `loginCount` - Total successful logins
- `failedLoginCount` - Failed login attempts
- `lockedUntil` - Account lock expiration
- `preferences` - User preferences (JSON)

### Session Model
Tracks active user sessions.

**Fields:**
- `id` - Session identifier
- `userId` - Associated user
- `token` - Session access token
- `deviceInfo` - Device details (JSON)
- `ipAddress` - Client IP
- `userAgent` - Client user agent
- `expiresAt` - Session expiration
- `lastActivityAt` - Last activity timestamp

### RefreshToken Model
Manages JWT refresh tokens.

**Fields:**
- `id` - Token identifier
- `userId` - Associated user
- `token` - Refresh token string
- `deviceId` - Unique device identifier
- `expiresAt` - Token expiration (7 days)
- `revoked` - Token revocation status
- `revokedAt` - Revocation timestamp

### AuditLog Model
Tracks all authentication events for security.

**Fields:**
- `id` - Log entry identifier
- `userId` - User who performed action
- `action` - Action type (login, logout, register, etc.)
- `resource` - Resource type
- `resourceId` - Resource identifier
- `ipAddress` - Client IP
- `userAgent` - Client user agent
- `metadata` - Additional context (JSON)
- `success` - Operation result
- `errorMessage` - Error details if failed

## 🔐 Security Features

### Password Security
- **Minimum Length**: 8 characters
- **Required**: Uppercase, lowercase, number, special character
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Server-side strength validation

### Account Protection
- **Failed Attempts**: Lock after 5 failed logins
- **Lock Duration**: 30 minutes
- **Auto-unlock**: Automatic after lock period

### Token Management
- **Access Token**: 15 minutes expiry (JWT)
- **Refresh Token**: 7 days expiry
- **Token Rotation**: New refresh token on each refresh
- **Revocation**: Immediate logout revokes all tokens

### Session Security
- **IP Tracking**: Monitor login locations
- **Device Tracking**: Identify unique devices
- **Activity Tracking**: Update last activity
- **Session Cleanup**: Auto-delete expired sessions

## 🚀 API Endpoints

### 1. Register User
**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "status": "active"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### 2. Login User
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**: Same as register

### 3. Refresh Token
**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**: Same as register (new tokens)

### 4. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body** (optional):
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Get Current User
**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "workspaceId": "workspace-uuid"
  }
}
```

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 2. Generate Database Migration
```bash
npx prisma migrate dev --name add_authentication
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Set Environment Variables
Add to `.env`:
```bash
# JWT Secret (already exists)
JWT_SECRET="xPNlmf2GxxyW+21nNqV5TWZZS+pJ0EZZvddpQHaMFGU="

# Firebase Admin (already exists)
FIREBASE_ADMIN_PROJECT_ID="bookmate-bfd43"
FIREBASE_ADMIN_CLIENT_EMAIL="your-client-email"
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"
```

### 5. Test Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Get user profile
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📱 Frontend Integration

### Using with React/Next.js

```typescript
// utils/auth.ts
export const auth = {
  async register(email: string, password: string, name?: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    // Store tokens
    if (data.success) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
    }
    
    return data;
  },

  async logout() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async getCurrentUser() {
    const accessToken = localStorage.getItem('accessToken');
    
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return res.json();
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
    }
    
    return data;
  },
};
```

## 🔄 Migration from Current System

### Current Login System
The existing login page uses simple localStorage-based authentication:
```typescript
// Current system in app/login/page.tsx
const validCredentials = {
  username: 'Shaun',
  password: '1234'
};
```

### Migration Steps

1. **Keep Existing Login** (temporarily)
   - Current login still works
   - New database-backed auth runs in parallel

2. **Update Login Page** (next step)
   - Replace hardcoded credentials
   - Use new API endpoints
   - Add "Create Account" option

3. **Data Migration** (if needed)
   - Create account for existing user: Shaun
   - Import from Firebase if users exist there

## 📊 Database Migrations

The authentication system requires running a migration:

```bash
npx prisma migrate dev --name add_authentication
```

This will create:
- `users` table
- `sessions` table
- `refresh_tokens` table
- `audit_logs` table

## 🧪 Testing Checklist

- [ ] Register new user
- [ ] Login with email/password
- [ ] Refresh access token
- [ ] Logout user
- [ ] Get current user profile
- [ ] Test failed login (5 times - should lock)
- [ ] Test password strength validation
- [ ] Test Firebase user creation
- [ ] Test audit log creation
- [ ] Test session tracking

## 🚀 Next Steps

1. **Update Login Page**
   - Replace localStorage auth with API calls
   - Add registration form
   - Add "Forgot Password" link

2. **Add Password Reset**
   - Create reset token system
   - Send reset emails via SendGrid
   - Create reset password page

3. **Add Email Verification**
   - Send verification emails
   - Create verification endpoint
   - Update email verification status

4. **Add Social Login** (Optional)
   - Google OAuth
   - Apple Sign In
   - Firebase Auth integration

5. **Add 2FA** (Optional)
   - TOTP (Google Authenticator)
   - SMS verification
   - Backup codes

## 📝 Notes

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens are signed with the JWT_SECRET
- Refresh tokens are rotated on each refresh
- Sessions are tracked for security monitoring
- Failed login attempts trigger account locks
- All authentication events are logged in audit_logs

---

**Created**: November 12, 2025  
**Status**: ✅ Ready for Migration
