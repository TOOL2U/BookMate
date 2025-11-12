# Fix OAuth "Access Blocked" Error - Add Test Users

## Problem
```
Access blocked: Accounting Buddy has not completed the Google verification process
Error 403: access_denied
```

## Solution: Add Test Users to OAuth Consent Screen

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select project: **accounting-buddy-476114**

### Step 2: Navigate to OAuth Consent Screen

1. In left menu, click **APIs & Services** → **OAuth consent screen**
   - Or direct link: https://console.cloud.google.com/apis/credentials/consent
2. You should see "Accounting Buddy" OAuth consent screen

### Step 3: Add Test Users

1. Scroll down to **Test users** section
2. Click **+ ADD USERS** button
3. Add these email addresses (one per line):
   ```
   shaunducker1@gmail.com
   testuser@example.com
   ```
   (Add any Google accounts you want to test with)
4. Click **SAVE**

### Step 4: Verify Test Users Added

You should see your email(s) listed under "Test users":
```
✅ shaunducker1@gmail.com
✅ testuser@example.com
```

### Step 5: Try OAuth Again

1. Go back to: http://localhost:3001/register
2. Register with a new account
3. When redirected to Google OAuth, select **shaunducker1@gmail.com** (or another test user)
4. Should work now! ✅

---

## Alternative: Publish the App (Not Recommended for Testing)

If you want anyone to be able to use it:

1. In OAuth consent screen
2. Click **PUBLISH APP**
3. Confirm publishing

**Warning**: This makes your app public. For testing, just add test users instead.

---

## Current OAuth Configuration

**Project**: accounting-buddy-476114
**App Name**: Accounting Buddy
**Status**: Testing (restricted to test users)
**Scopes**:
- Google Sheets: Create, read, update spreadsheets
- Google Drive: See and download files

---

## Testing with Multiple Accounts

You can add multiple test users:
```
shaunducker1@gmail.com       (Primary - for OAuth authorization)
testuser1@gmail.com          (If you have this Google account)
testuser2@gmail.com          (If you have this Google account)
your.other.email@gmail.com   (Any other Google accounts you own)
```

**Important**: Test users must be **actual Google accounts**. You can't use fake emails.

---

## Quick Fix Steps

1. ✅ Go to: https://console.cloud.google.com/apis/credentials/consent?project=accounting-buddy-476114
2. ✅ Scroll to "Test users"
3. ✅ Click "+ ADD USERS"
4. ✅ Add: shaunducker1@gmail.com
5. ✅ Click "SAVE"
6. ✅ Try registration again

---

## After Adding Test Users

The registration flow will work:
```
Register → OAuth (select test user) → Authorize → Spreadsheet created ✅
```

**Ready to add yourself as a test user?** 🚀
