# 🚨 TOMMY'S SPREADSHEET 404 ERROR - ROOT CAUSE

## Problem
**Vercel Error**: `Requested entity was not found` (404)  
**Spreadsheet ID**: `1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g`  
**What it means**: Service account CANNOT ACCESS Tommy's spreadsheet

---

## What We Know

### ✅ Spreadsheet WAS Created
From database:
- Created: 2025-11-13 11:25:11
- ID: `1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g`
- URL: https://docs.google.com/spreadsheets/d/1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g/edit

### ❌ Service Account CANNOT Access It
The API route gets 404 when trying to read from it:
```
Error: Requested entity was not found.
code: 404
```

---

## Root Causes (One of These)

### Cause #1: Spreadsheet is in Shared Drive (Most Likely)
If the MASTER TEMPLATE is in a Shared Drive, the COPY will also be in the Shared Drive.

**Problem**: Service account might not have access to the Shared Drive.

**Solution**: Add service account to the Shared Drive as a member.

### Cause #2: Copy Failed Partially
The Drive API copy succeeded, but the spreadsheet is corrupted or inaccessible.

**Solution**: Delete and recreate Tommy's spreadsheet.

### Cause #3: Service Account Lost Permissions
The service account's access to Drive/Sheets was revoked or expired.

**Solution**: Verify service account credentials in Vercel.

---

## IMMEDIATE FIX

### Option A: Manual Share (Quick Fix)
1. Open Tommy's spreadsheet: https://docs.google.com/spreadsheets/d/1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g/edit
2. Click "Share"
3. Add service account email as "Editor"
4. Service account email is in `GOOGLE_SERVICE_ACCOUNT_KEY` → `client_email`

### Option B: Recreate Spreadsheet (Better Fix)
Run this SQL to clear Tommy's spreadsheet:
```sql
UPDATE users 
SET spreadsheet_id = NULL, 
    spreadsheet_url = NULL, 
    spreadsheet_created_at = NULL 
WHERE email = 'tommy@gmail.com';
```

Then have Tommy logout and login again - it will auto-create a new spreadsheet.

### Option C: Add Service Account to Shared Drive (Best Fix)
If master template is in Shared Drive:
1. Open the Shared Drive in Google Drive
2. Right-click → "Manage members"
3. Add service account email as "Content Manager"
4. This gives service account access to ALL files in the drive

---

## Test if Spreadsheet Exists

You can test manually:
1. Open: https://docs.google.com/spreadsheets/d/1aGXG-vcOVQkYb7-1msQugl33AA3FKpLqbszwc67DM1g/edit
2. If you see "File not found" → Spreadsheet doesn't exist (Option B)
3. If you see the spreadsheet → Check who has access (Option A or C)

---

## Code Fix (If Using Shared Drive)

Update `/lib/services/spreadsheet-provisioning.ts`:

```typescript
const copyResponse = await drive.files.copy({
  fileId: MASTER_TEMPLATE_ID,
  requestBody: {
    name: copyName,
  },
  supportsAllDrives: true, // ← Already there
  fields: 'id, name, webViewLink, owners',
});

// After copying, explicitly share with service account
await drive.permissions.create({
  fileId: newSpreadsheetId,
  requestBody: {
    type: 'user',
    role: 'writer',
    emailAddress: credentials.client_email, // ← ADD THIS
  },
  supportsAllDrives: true,
});
```

---

## What to Check Next

1. **Open Tommy's spreadsheet URL** - Does it exist?
2. **Check the MASTER TEMPLATE** - Is it in a Shared Drive?
3. **Get service account email** from Vercel env vars
4. **Manually share** Tommy's spreadsheet with service account

The fix is simple - just need to share the spreadsheet with the service account!
