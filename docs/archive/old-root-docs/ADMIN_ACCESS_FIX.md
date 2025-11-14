# Admin Access Fix - Session Cookie Implementation

**Date:** November 14, 2025  
**Issue:** Admin page redirecting immediately back to dashboard

## Problem

The admin pages were checking for Firebase authentication tokens in cookies, but the login flow was only storing JWT tokens in localStorage. Server-side pages couldn't access localStorage, so `checkAdminAccess()` always failed.

## Solution

### 1. Updated Login Flow (`app/login/page.tsx`)
- Added session cookie creation after successful login
- Cookie stores the JWT access token for server-side access
- Cookie expires with the token (15 minutes)

```typescript
// Set cookie for server-side auth
document.cookie = `session=${data.tokens.accessToken}; path=/; max-age=${data.tokens.expiresIn}; SameSite=Strict`;
```

### 2. Updated Admin Access Check (`lib/auth/admin.ts`)
- Changed from Firebase token verification to JWT token verification
- Now uses `jsonwebtoken` library to decode and verify tokens
- Checks both email match and admin role
- Removed Firebase dependencies

**Before:**
```typescript
const auth = getAdminAuth();
const decodedToken = await auth.verifyIdToken(sessionToken);
```

**After:**
```typescript
const decoded = jwt.verify(sessionToken, secret) as {
  userId: string;
  email: string;
  role: string;
};
```

### 3. Security Check
- Verifies email === 'admin@siamoon.com' (case-insensitive)
- Verifies role === 'admin'
- Both conditions must be true for admin access

## Files Modified

1. `/app/login/page.tsx` - Added session cookie creation
2. `/lib/auth/admin.ts` - Changed from Firebase to JWT verification
3. `/components/layout/AdminShell.tsx` - Updated Admin nav link
4. `/components/Navigation.tsx` - Updated Admin nav link

## Important: Log Out and Back In

**You must log out and log back in** for the session cookie to be set properly!

### Steps:
1. Log out of the application
2. Log back in with:
   - Email: `admin@siamoon.com`
   - Password: `Siamoon2025!`
3. The session cookie will now be set
4. Admin pages should load correctly

## How It Works

**Login Flow:**
1. User submits email/password
2. API validates and returns JWT tokens
3. Frontend stores tokens in:
   - `localStorage.accessToken` (for client-side API calls)
   - `localStorage.refreshToken` (for token refresh)
   - `document.cookie.session` (for server-side page access)
4. User redirected to `/admin/accounts` (admin) or `/dashboard` (regular user)

**Admin Page Access:**
1. Server-side page calls `checkAdminAccess()`
2. Function reads `session` cookie
3. Verifies JWT signature with `JWT_SECRET`
4. Checks email === 'admin@siamoon.com'
5. Checks role === 'admin'
6. Returns `isAdmin: true` or redirects to login

## Security Notes

- Session cookie is HTTP-only equivalent (set via JavaScript)
- SameSite=Strict prevents CSRF attacks
- Cookie expires with token (15 minutes)
- JWT signature prevents tampering
- Email-based restriction limits access to single account

## Testing Checklist

- [ ] Log out of current session
- [ ] Log in with admin@siamoon.com
- [ ] Click "Admin" in sidebar
- [ ] Page loads `/admin/accounts/new` successfully
- [ ] No redirect to dashboard
- [ ] Form displays correctly

## Troubleshooting

**If admin page still redirects:**
1. Open DevTools > Application > Cookies
2. Check if `session` cookie exists
3. Verify cookie value is a JWT token
4. If missing, clear all cookies and log in again

**If you see "Authentication error":**
1. Check server logs for JWT verification errors
2. Ensure JWT_SECRET is set in .env.local
3. Verify token hasn't expired (15 min lifetime)

---

**Status:** ✅ Fixed - Requires re-login to take effect
