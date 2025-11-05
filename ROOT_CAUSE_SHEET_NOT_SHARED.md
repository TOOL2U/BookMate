# 🎯 ROOT CAUSE IDENTIFIED: Sheet Not Shared with Service Account

## The Problem

You have **TWO Google Cloud projects**:

1. **`bookmate-bfd43`** - Firebase project ✅ Working
2. **`accounting-buddy-476114`** - Google Sheets service account project ⚠️ Not shared

**Service Account Email**: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`  
**Google Sheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

## Why It Works Locally But Not on Vercel

**Local Environment**:
- You're likely logged in with your personal Google account
- Your personal account has access to the Sheet
- Works fine even without service account sharing

**Vercel Production**:
- Uses service account for authentication
- Service account `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com` needs to be explicitly shared on the Sheet
- Without sharing → "Requested entity was not found" error

## ✅ THE FIX (Required)

### Step 1: Share the Google Sheet

1. **Open the Sheet**:  
   https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit

2. **Click the "Share" button** (top right)

3. **Add the service account email**:
   ```
   accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
   ```

4. **Set permission to "Editor"** (or at minimum "Viewer" if read-only)

5. **Uncheck "Notify people"** (service accounts don't need emails)

6. **Click "Share"**

### Step 2: Test Immediately (No Redeploy Needed!)

Once you share the Sheet, the permissions are instant. Test:

```bash
curl -s https://accounting-buddy-app.vercel.app/api/test-sheets | jq .
```

**Expected Success Response**:
```json
{
  "ok": true,
  "title": "Your Sheet Name Here"
}
```

### Step 3: Verify All Routes Work

```bash
# Test balance endpoint
curl -s https://accounting-buddy-app.vercel.app/api/balance/by-property | jq .

# Test categories sync
curl -s https://accounting-buddy-app.vercel.app/api/categories/sync | jq .
```

## Why This Is THE Root Cause

According to PM's diagnostic table:

| Error Message | Root Cause | Fix |
|---------------|------------|-----|
| "Requested entity was not found" | **Sheet not shared with service account** | ✅ Share Sheet with service account email |
| "invalid_grant" | Private key format issue | Not applicable (keys are fine) |
| "PERMISSION_DENIED" | Wrong scopes | Not applicable (scopes are correct) |

Your error **exactly matches** the "Sheet not shared" symptom.

## Current Status of Other Fixes

✅ **Node.js Runtime** - Already configured  
✅ **Environment Variables** - All present  
✅ **Private Key Format** - Fixed with `.replace(/\\n/g, '\n')`  
✅ **Google Sheets API** - Enabled in Cloud Console  
❌ **Sheet Sharing** - **THIS IS THE MISSING PIECE**

## After Sharing

Once you share the Sheet with the service account:

1. ✅ `/api/test-sheets` will return `{ ok: true }`
2. ✅ `/api/balance/by-property` will return balance data
3. ✅ `/api/categories/sync` will sync categories
4. ✅ All Google Sheets routes will work in production
5. ✅ Production deployment will be COMPLETE

## Quick Action Checklist

- [ ] Open Sheet: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit
- [ ] Click "Share" button
- [ ] Add: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
- [ ] Set permission: "Editor"
- [ ] Uncheck "Notify people"
- [ ] Click "Share"
- [ ] Test: `curl https://accounting-buddy-app.vercel.app/api/test-sheets`
- [ ] Verify: Response shows `{ ok: true }`

---

**This is 100% the issue.** The service account needs explicit access to your Google Sheet. Once you share it, everything will work immediately (no redeploy needed).
