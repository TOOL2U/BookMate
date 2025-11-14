# ❌ Login Issue - shaun@siamoon.com Account Not Found

## Problem
**Error**: "Invalid username and password"  
**Cause**: The `shaun@siamoon.com` account does not exist in the database yet.

## Current Database Users
```
1. bookmate.test1@gmail.com
2. bookmate.test2@gmail.com
3. bookmate.test3@gmail.com
4. bookmate.test4@gmail.com
5. bookmate.test5@gmail.com
6. autotest@example.com
7. finaltest@example.com
8. workingtest@example.com
9. test@gmail.com
```

❌ `shaun@siamoon.com` is **NOT** in the database

---

## Solution

### Option 1: Quick Script (Recommended)
Run this command to create the admin account:

```bash
cd /Users/shaunducker/Desktop/BookMate-webapp
npx tsx scripts/create-admin-quick.ts YOUR_PASSWORD
```

**Example:**
```bash
npx tsx scripts/create-admin-quick.ts SecurePassword123
```

**What it does:**
- ✅ Creates `shaun@siamoon.com` account
- ✅ Sets as **admin** role
- ✅ Assigns **original spreadsheet**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- ✅ Creates Firebase user (optional)
- ✅ Sets status to **active**
- ✅ Email pre-verified

**Result:**
```
✅ SUCCESS! Admin account created
─────────────────────────────────────────────────
Email: shaun@siamoon.com
Name: Shaun Ducker
Role: admin
Spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
─────────────────────────────────────────────────

🎉 Login at: http://localhost:3000/login
   Email: shaun@siamoon.com
   Password: (the one you provided)
```

---

### Option 2: Register Through UI
1. Go to http://localhost:3000/register
2. Fill in:
   - **Email**: `shaun@siamoon.com`
   - **Password**: (your choice)
   - **Name**: Shaun Ducker
3. Click "Create Account"
4. Login with the credentials

**Note:** After registration, you'll need to run the spreadsheet assignment script:
```bash
npx tsx scripts/assign-original-spreadsheet.ts
```

---

### Option 3: Interactive Script
```bash
npx tsx scripts/create-admin-account.ts
# (will prompt for password)
```

---

## After Creating Account

### 1. Verify Account Was Created
```bash
npx tsx scripts/check-user.ts
```

**Expected output:**
```
✅ User found!

User Details:
──────────────────────────────────────────────────
Email: shaun@siamoon.com
Name: Shaun Ducker
ID: [uuid]
Status: active
Role: admin
Provider: email
Email Verified: true
Has Password: ✅ Yes
Spreadsheet ID: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
──────────────────────────────────────────────────
```

### 2. Login
1. Go to http://localhost:3000/login
2. Enter:
   - **Email**: `shaun@siamoon.com`
   - **Password**: (the one you set)
3. Click "Sign In"

### 3. Verify Spreadsheet
1. Navigate to http://localhost:3000/account
2. Check that **Spreadsheet ID** shows: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8` ⭐
3. Click "Open in Google Sheets" to verify it's the original

---

## Files Created

- ✅ `scripts/check-user.ts` - Check if user exists
- ✅ `scripts/create-admin-quick.ts` - Quick admin account creation
- ✅ `scripts/create-admin-account.ts` - Interactive admin account creation

---

## Quick Commands

### Create Admin Account
```bash
npx tsx scripts/create-admin-quick.ts YOUR_PASSWORD
```

### Check If Account Exists
```bash
npx tsx scripts/check-user.ts
```

### View Database (GUI)
```bash
npx prisma studio
```

### Assign Original Spreadsheet (if needed)
```bash
npx tsx scripts/assign-original-spreadsheet.ts
```

---

## Summary

**Current Status**: ❌ Account does not exist  
**Required Action**: Create the account using one of the methods above  
**Recommended**: Use Option 1 (Quick Script)  

**Command:**
```bash
npx tsx scripts/create-admin-quick.ts YourPassword123
```

Then login at http://localhost:3000/login with:
- Email: `shaun@siamoon.com`
- Password: `YourPassword123`

🎉 **Ready to go!**
