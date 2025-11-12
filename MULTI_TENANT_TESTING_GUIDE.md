# Multi-Tenant System - Live Testing Guide

## 🧪 Step-by-Step Testing Instructions

### Prerequisites
✅ Dev server running: `npm run dev`
✅ PostgreSQL running
✅ OAuth credentials configured in `.env.local`

---

## Test 1: Create New User & Verify Spreadsheet Creation

### Step 1: Register a New User

1. **Open browser**: http://localhost:3000/register

2. **Fill in registration form**:
   ```
   Name: Test User
   Email: testuser@example.com
   Password: Test123456!
   Confirm Password: Test123456!
   ```

3. **Click "Register"**
   - You should be redirected to Google OAuth consent screen
   - URL will look like: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...`

### Step 2: Authorize Google Sheets Access

1. **On Google OAuth screen**:
   - Select your Google account (e.g., shaunducker1@gmail.com)
   - Review permissions requested:
     - "See, edit, create, and delete all your Google Sheets spreadsheets"
     - "See and download all your Google Drive files"
   - Click **"Allow"** or **"Continue"**

2. **Wait for redirect**:
   - OAuth callback processes the authorization
   - System creates your spreadsheet automatically
   - You'll be redirected to dashboard: http://localhost:3000/dashboard

### Step 3: Verify Spreadsheet Creation

#### Option A: Check in Database
```bash
# Run this command in terminal:
psql -d bookmate_dev -c "SELECT email, spreadsheet_id, spreadsheet_url, created_at FROM users WHERE email = 'testuser@example.com';"
```

Expected output:
```
        email          |           spreadsheet_id           |                    spreadsheet_url                    |        created_at         
-----------------------+-----------------------------------+-------------------------------------------------------+---------------------------
 testuser@example.com  | 1ABC123DEF456...                  | https://docs.google.com/spreadsheets/d/1ABC123...     | 2025-11-12 19:00:00+07
```

#### Option B: Check in Browser DevTools
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Type:
   ```javascript
   localStorage.getItem('userId')
   ```
4. Copy the userId, then run in terminal:
   ```bash
   psql -d bookmate_dev -c "SELECT email, spreadsheet_url FROM users WHERE id = 'PASTE_USER_ID_HERE';"
   ```

#### Option C: Open the Spreadsheet Directly

1. **From database query** (Option A above), copy the `spreadsheet_url`
2. **Paste in browser** to open the spreadsheet
3. **Verify**:
   - ✅ Spreadsheet title: "BookMate - Test User"
   - ✅ Has all tabs: Inbox, Data, P&L, Balance Summary, etc.
   - ✅ All formulas present (from master template)
   - ✅ NO data (fresh copy)
   - ✅ You are the owner (check Share settings)

### Step 4: Test Dashboard Access

1. **Dashboard should load**: http://localhost:3000/dashboard
2. **Check for**:
   - Balance cards showing ฿0.00 (no data yet)
   - P&L showing ฿0.00
   - Empty inbox table
   - No errors in DevTools Console

### Step 5: Add Test Data

1. **Go to Inbox page**: http://localhost:3000/inbox
2. **Add a transaction**:
   ```
   Date: Today
   Property: [Select from dropdown - should be from master template]
   Type of Operation: [Select revenue category]
   Type of Payment: Cash
   Detail: Test transaction
   Credit: 1000
   ```
3. **Click "Add Transaction"**

### Step 6: Verify Data in Spreadsheet

1. **Open your spreadsheet** (from Step 3)
2. **Go to "Inbox" tab**
3. **Verify**:
   - ✅ Your transaction appears in the sheet
   - ✅ Row has all the data you entered
   - ✅ Formulas are working (if any calculations)

---

## Test 2: Verify Data Isolation

### Step 1: Login as Different User

1. **Logout**: Click logout button or go to http://localhost:3000/logout
2. **Login as original user**: http://localhost:3000/login
   ```
   Email: shaun@siamoon.com
   Password: [your password]
   ```

### Step 2: Check Dashboard

1. **Dashboard loads**: http://localhost:3000/dashboard
2. **Verify**:
   - ✅ Original data is still there
   - ✅ NEW user's transaction is NOT visible
   - ✅ Different spreadsheet is being used

### Step 3: Verify Spreadsheet IDs are Different

```bash
# Check both users:
psql -d bookmate_dev -c "SELECT email, spreadsheet_id FROM users WHERE email IN ('shaun@siamoon.com', 'testuser@example.com');"
```

Expected:
```
        email          |                spreadsheet_id                
-----------------------+----------------------------------------------
 shaun@siamoon.com     | 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8  (original)
 testuser@example.com  | 1XYZ789ABC123...                              (new copy)
```

✅ **Success**: Different spreadsheet IDs = Complete isolation!

---

## Test 3: Verify Master Template is Clean

1. **Open master template**:
   https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit

2. **Verify**:
   - ✅ Has all sheet tabs
   - ✅ Has all formulas
   - ✅ Has NO user transaction data
   - ✅ Clean and ready for next user

---

## Test 4: Multiple New Users

Repeat Test 1 with different emails:
- `user2@example.com`
- `user3@example.com`

Each should get their own spreadsheet copy!

---

## Checking Spreadsheet Ownership in Google Drive

### Method 1: Via Google Drive
1. Go to https://drive.google.com
2. Login with the Google account you used for OAuth (e.g., shaunducker1@gmail.com)
3. Search for "BookMate"
4. You should see:
   - "BookMate - Test User" (owned by you, shared with test user)
   - "BookMate - User 2" (if you created more)
   - etc.

### Method 2: Via Spreadsheet URL
1. Open the spreadsheet URL from database
2. Click **Share** button (top right)
3. Verify ownership:
   - Owner should be the Google account that authorized OAuth
   - The user has edit access via OAuth tokens

---

## Troubleshooting

### Issue: "No authorization token provided" Error

**Solution**: 
```javascript
// Check in DevTools Console:
localStorage.getItem('accessToken')
```

If null, logout and login again.

### Issue: OAuth Redirect Fails

**Check**:
1. OAuth redirect URI configured: http://localhost:3000/api/auth/google/callback
2. Google Cloud Console > Credentials > OAuth 2.0 Client IDs
3. Authorized redirect URIs includes localhost:3000

### Issue: Spreadsheet Not Created

**Check server logs**:
```bash
tail -f dev-server.log | grep -i "spreadsheet\|oauth"
```

Look for errors during provisioning.

### Issue: Can't See New Spreadsheet in Google Drive

**Reason**: Spreadsheet is created IN THE USER'S DRIVE, not yours.

**Solution**: The user who registered owns the spreadsheet. To see it:
1. Login to Google Drive with the same Google account used for OAuth
2. Look in "My Drive" or search "BookMate"

---

## Quick Test Commands

```bash
# See all users and their spreadsheets
psql -d bookmate_dev -c "SELECT email, spreadsheet_id IS NOT NULL as has_sheet, created_at FROM users ORDER BY created_at DESC;"

# See users without spreadsheets (need OAuth)
psql -d bookmate_dev -c "SELECT email, created_at FROM users WHERE spreadsheet_id IS NULL;"

# Get spreadsheet URL for specific user
psql -d bookmate_dev -c "SELECT spreadsheet_url FROM users WHERE email = 'testuser@example.com';"

# Count total users vs users with spreadsheets
psql -d bookmate_dev -c "SELECT 
  COUNT(*) as total_users,
  COUNT(spreadsheet_id) as users_with_sheets,
  COUNT(*) - COUNT(spreadsheet_id) as users_without_sheets
FROM users;"
```

---

## Expected Flow Summary

```
1. User registers
   ↓
2. Redirect to Google OAuth
   ↓
3. User authorizes access
   ↓
4. OAuth callback receives code
   ↓
5. Exchange code for access/refresh tokens
   ↓
6. Store tokens in database
   ↓
7. Provision spreadsheet (copy master template)
   ↓
8. Store spreadsheet ID & URL in database
   ↓
9. Redirect to dashboard
   ↓
10. Dashboard loads with user's personal spreadsheet ✅
```

---

## Success Indicators

✅ User registered successfully
✅ OAuth authorization completed
✅ Spreadsheet created (check database)
✅ Spreadsheet URL accessible
✅ Dashboard loads without errors
✅ Can add transaction to inbox
✅ Transaction appears in spreadsheet
✅ Different users see different data
✅ Original user's data untouched

---

## Next Steps After Testing

Once testing is successful:
1. Deploy to production
2. Update OAuth redirect URIs for production domain
3. Create user onboarding guide
4. Monitor spreadsheet provisioning logs
5. Set up error notifications for failed provisions

**Happy Testing! 🚀**
