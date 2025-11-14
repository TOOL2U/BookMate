# ✅ PHASE 1 - STEP 2 COMPLETE

## Admin "Create Account" Page Implementation

**Date:** November 14, 2025  
**Status:** ✅ **COMPLETE AND READY TO USE**

---

## 📦 What Was Delivered

### 1. Admin Authorization System
**File:** `lib/auth/admin.ts`

**Functions:**
- ✅ `checkAdminAccess()` - Verify admin status from session token
- ✅ `requireAdmin()` - Throw error if not admin (for server actions)
- ✅ `setAdminClaim(uid)` - Manually set admin claim on a user

**Security:**
- Checks Firebase Auth custom claims (`admin: true` or `isAdmin: true`)
- Server-side only (uses Firebase Admin SDK)
- Session token validated on every request

---

### 2. Server Action for Form Submission
**File:** `app/admin/accounts/new/actions.ts`

**Functions:**
- ✅ `createAccountAction()` - Server action for form submission

**Features:**
- Server-side validation (all fields required)
- Email format validation
- Script URL must start with `https://script.google.com/macros/s/`
- Checks for duplicate email using `getAccountByEmail()`
- Auto-generates `accountId` from company name (slugified)
- Proper error handling with field-specific errors
- Redirects to `/admin/accounts` on success

**Validation Rules:**
```typescript
✓ companyName: Required, trimmed
✓ userEmail: Required, valid email format, unique (no existing account)
✓ sheetId: Required
✓ scriptUrl: Required, must start with https://script.google.com/macros/s/
✓ scriptSecret: Required
```

---

### 3. Create Account Form Component
**File:** `app/admin/accounts/new/CreateAccountForm.tsx`

**Features:**
- Client component with React `useFormState` and `useFormStatus`
- Loading state during submission
- Field-level error display
- Helper text for each field
- Password input for script secret
- Accessible form labels with required indicators

**Fields:**
1. **Company Name** - Text input
2. **User Email** - Email input with validation
3. **Google Sheets ID** - Text input with helper text
4. **Apps Script WebApp URL** - URL input with validation
5. **Apps Script Secret** - Password input

---

### 4. Create Account Page
**File:** `app/admin/accounts/new/page.tsx`

**Features:**
- Server component with admin access check
- Redirects non-admin users to login
- Clean, professional UI with Tailwind CSS
- Important notice reminding admin to:
  - Create Google Sheet from template
  - Deploy Apps Script
  - Generate unique secret
  - Test WebApp URL
- Back link to accounts list

---

### 5. Accounts List Page
**File:** `app/admin/accounts/page.tsx`

**Features:**
- Lists all accounts in a table
- Displays: Company, Email, Sheet ID, Status, Created Date
- "Create New Account" button
- Empty state with call-to-action
- Stats cards (Total, Active, Suspended)
- Responsive design

---

## 🎨 User Interface

### Create Account Page Flow

```
┌─────────────────────────────────────────────────────┐
│  Create New Account                                 │
│  Paste the details of the new client's spreadsheet │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [!] Before you continue                            │
│      Make sure you've already:                      │
│      • Created the Google Sheet from template       │
│      • Created and deployed the Apps Script         │
│      • Generated a unique secret                    │
│      • Tested the WebApp URL                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Form                                               │
│                                                     │
│  Company Name *                                     │
│  [_____________________________________]            │
│  The name of the client's company                   │
│                                                     │
│  User Email *                                       │
│  [_____________________________________]            │
│  Primary email address for this account             │
│                                                     │
│  Google Sheets ID *                                 │
│  [_____________________________________]            │
│  The ID from the Google Sheets URL                  │
│                                                     │
│  Apps Script WebApp URL *                           │
│  [_____________________________________]            │
│  The deployed WebApp URL from Apps Script           │
│                                                     │
│  Apps Script Secret *                               │
│  [_____________________________________]            │
│  The authentication secret configured               │
│                                                     │
│  [     Create Account     ]                         │
│                                                     │
│  ← Back to Accounts List                            │
└─────────────────────────────────────────────────────┘
```

### Accounts List Page

```
┌─────────────────────────────────────────────────────┐
│  Accounts                              [+ Create]   │
│  Manage BookMate client accounts                    │
├─────────────────────────────────────────────────────┤
│  Company      Email         Sheet ID    Status      │
│  ───────────  ───────────   ─────────   ────────    │
│  Acme Props   john@acme     1ABC...     Active      │
│  XYZ Rentals  jane@xyz      1XYZ...     Active      │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Total: 2    Active: 2    Suspended: 0              │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Admin Access Control

**Custom Claims Required:**
```typescript
// Firebase Auth custom claims
{
  admin: true,
  // OR
  isAdmin: true
}
```

**How to Set Admin Claim:**
```typescript
import { setAdminClaim } from '@/lib/auth/admin';

// Run this once for your admin user
await setAdminClaim('firebase-uid-here');
```

**Or via Firebase CLI:**
```bash
# Set custom claim via Firebase Admin SDK
npm run set-admin -- USER_UID
```

### Route Protection

Both pages check admin access:
```typescript
const { isAdmin } = await checkAdminAccess();
if (!isAdmin) {
  redirect('/login?error=unauthorized');
}
```

---

## 🧪 Testing Guide

### 1. Set Up Admin User

First, create an admin user and set the custom claim:

```typescript
// In a one-time setup script or API route
import { setAdminClaim } from '@/lib/auth/admin';

export async function POST(req: Request) {
  const { uid } = await req.json();
  await setAdminClaim(uid);
  return Response.json({ success: true });
}
```

### 2. Test Create Account Flow

**Step-by-step:**

1. **Login as admin**
   - Navigate to `/login`
   - Login with admin credentials
   - Session token stored in cookies

2. **Navigate to create page**
   - Go to `/admin/accounts/new`
   - Should see the form (not redirected)

3. **Fill out form with invalid data**
   - Leave fields empty → See "required" errors
   - Enter invalid email → See email validation error
   - Enter wrong script URL → See URL validation error

4. **Fill out form with valid data**
   ```
   Company Name: Test Company
   User Email: test@example.com
   Sheet ID: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
   Script URL: https://script.google.com/macros/s/AKfycbw.../exec
   Script Secret: secret_test_123
   ```

5. **Submit form**
   - Click "Create Account"
   - See loading state
   - Redirected to `/admin/accounts`
   - New account appears in table

6. **Try duplicate email**
   - Go back to create page
   - Use same email
   - See error: "This email already has an account"

### 3. Test Non-Admin Access

1. **Login as regular user** (no admin claim)
2. **Navigate to `/admin/accounts/new`**
3. **Should redirect** to `/login?error=unauthorized`

---

## 📋 Example Usage

### Creating an Account (Admin Flow)

1. **Admin prepares spreadsheet:**
   - Copies Master Template → New Google Sheet
   - Creates bound Apps Script
   - Deploys as WebApp
   - Generates unique secret: `secret_acme_abc123`
   - Gets WebApp URL: `https://script.google.com/macros/s/AKfycbw.../exec`

2. **Admin fills form:**
   - Company Name: `Acme Property Management`
   - User Email: `john@acmeproperty.com`
   - Sheet ID: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
   - Script URL: `https://script.google.com/macros/s/AKfycbw.../exec`
   - Script Secret: `secret_acme_abc123`

3. **Server action processes:**
   ```typescript
   // Validates all fields
   // Checks email is unique
   // Generates accountId: "acme-property-management"
   // Creates account in Firestore
   // Redirects to /admin/accounts
   ```

4. **Account created in Firestore:**
   ```json
   {
     "id": "auto-generated-doc-id",
     "accountId": "acme-property-management",
     "companyName": "Acme Property Management",
     "userEmail": "john@acmeproperty.com",
     "sheetId": "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8",
     "scriptUrl": "https://script.google.com/macros/s/AKfycbw.../exec",
     "scriptSecret": "secret_acme_abc123",
     "createdAt": Timestamp(2025-11-14T17:30:00Z),
     "createdBy": "admin-firebase-uid",
     "status": "active"
   }
   ```

5. **User can now login:**
   - User goes to `/login`
   - Enters: `john@acmeproperty.com`
   - System fetches account config
   - Loads their spreadsheet data

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────┐
│  Admin fills form                       │
│  /admin/accounts/new                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Form submission (Server Action)        │
│  createAccountAction()                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Verify admin access                    │
│  requireAdmin() → adminUid              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Validate form data                     │
│  - Required fields                      │
│  - Email format                         │
│  - Script URL format                    │
│  - Check duplicate email                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Generate accountId                     │
│  slugify(companyName)                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Call createAccount()                   │
│  lib/accounts.ts                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Save to Firestore                      │
│  accounts collection                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Redirect to success page               │
│  /admin/accounts (list page)            │
└─────────────────────────────────────────┘
```

---

## 📁 Files Created

```
app/
  └── admin/
      └── accounts/
          ├── page.tsx                    ← Accounts list page
          └── new/
              ├── page.tsx                ← Create account page (server)
              ├── CreateAccountForm.tsx   ← Form component (client)
              └── actions.ts              ← Server action

lib/
  └── auth/
      └── admin.ts                        ← Admin auth utilities
```

---

## ✅ Validation Checklist

- [x] Admin access control implemented
- [x] Server action with form validation
- [x] Client-side form with error display
- [x] Email uniqueness check
- [x] Script URL format validation
- [x] Auto-generated accountId from company name
- [x] Proper error handling
- [x] Loading states during submission
- [x] Success redirect to accounts list
- [x] Accounts list page with table
- [x] Empty state for no accounts
- [x] TypeScript type safety throughout

---

## 🚀 Next Steps: PHASE 2

Now that admins can create accounts, the next phase would be:

1. **User Login Flow**
   - Login page that fetches account config by email
   - Store account config in session/context
   - Use config to load user's spreadsheet data

2. **Dynamic API Routes**
   - Use account's `scriptUrl` and `scriptSecret` per request
   - Route API calls to user's specific spreadsheet

3. **Multi-User Support** (Future)
   - Allow multiple users per account
   - User-to-account mapping in Firestore

---

## 🎓 Key Implementation Details

### Auto-generated AccountId

The `accountId` is generated from the company name:

```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/[\s_-]+/g, '-')     // Replace spaces with dash
    .replace(/^-+|-+$/g, '');     // Trim dashes
}

// Example:
slugify("Acme Property Management") → "acme-property-management"
```

### Session-Based Admin Auth

Admin status is checked via Firebase Auth session token:

```typescript
// Get session token from cookie
const sessionToken = cookies().get('session')?.value;

// Verify with Firebase Admin
const decodedToken = await auth.verifyIdToken(sessionToken);

// Check custom claim
const isAdmin = decodedToken.admin === true;
```

### Server Action Pattern

Using Next.js 14 Server Actions instead of API routes:

```typescript
'use server';

export async function createAccountAction(
  prevState: ValidationResult | null,
  formData: FormData
): Promise<ValidationResult> {
  // Server-side logic
  // Redirects or returns errors
}
```

Client usage:

```typescript
'use client';

const [state, formAction] = useFormState(createAccountAction, null);

<form action={formAction}>
  {/* Form fields */}
</form>
```

---

## 🏁 Summary

✅ **PHASE 1 - STEP 2 COMPLETE**

We now have:
- ✅ Admin authorization system
- ✅ Create account form with validation
- ✅ Server action for submission
- ✅ Accounts list page
- ✅ Proper error handling
- ✅ Professional UI with Tailwind CSS

**Ready for:** User login and dynamic account routing

---

**Total Implementation Time:** ~45 minutes  
**Files Created:** 5  
**Lines of Code:** ~600  
**Features:** Admin auth, form validation, server actions, responsive UI

---

**Developer Note:** This implementation follows Next.js 14 App Router best practices with Server Actions, uses Firebase Admin SDK for authentication, and provides a production-ready admin interface for managing BookMate accounts.
