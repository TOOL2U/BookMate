# New User Spreadsheet Auto-Provisioning Issue

## Problem Summary
✅ **User Registration:** Working - users are created successfully in database  
❌ **Spreadsheet Creation:** FAILING - `spreadsheetId` remains `null` after registration  
❌ **API Access:** Blocked - all APIs return "No spreadsheet configured for this user"

## Test Results

### Registration Test
```bash
Email: testuser1763028446@example.com
Password: TestUser2025!
Status: ✅ User created in database
Spreadsheet ID: null (should be auto-created)
```

### API Test Results
- `/api/categories/properties`: ❌ "No spreadsheet configured for this user"
- `/api/categories/expenses`: ❌ "No spreadsheet configured for this user"  
- `/api/categories/revenues`: ❌ "No spreadsheet configured for this user"
- `/api/categories/payments`: ❌ "No spreadsheet configured for this user"
- `/api/inbox`: ❌ "Failed to fetch inbox data"

## Root Cause

The `provisionUserSpreadsheetAuto()` function is failing silently during registration. The code:

1. ✅ Creates user in database
2. ❌ Tries to auto-provision spreadsheet (FAILS)
3. ✅ Catches error and continues (silent failure)
4. ✅ Returns success response with `spreadsheetId: null`

**File:** `lib/auth/service.ts` (lines 120-147)

The provisioning function tries to:
1. Authenticate with Google using service account
2. Copy master template spreadsheet
3. Share copy with new user
4. Update database with spreadsheet ID

## Likely Issues

### 1. Service Account Configuration

**Service Account Email:** `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`

**Environment Variable:** `GOOGLE_SERVICE_ACCOUNT_KEY`
- ✅ Exists in Vercel (encrypted)
- ❓ Format may be incorrect
- ❓ May not match local `config/google-credentials.json`

### 2. Template Spreadsheet Access

**Master Template ID:** `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`  
**URL:** https://docs.google.com/spreadsheets/d/1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU/edit

**CRITICAL:** This template MUST be shared with:
```
accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
```

With at least "Viewer" permission (need "Editor" to copy).

### 3. Shared Drive Access

**Shared Drive ID:** `0ACHIGfT01vYxUk9PVA`

The service account needs:
- Access to the shared drive
- Permission to create files

## Action Plan

### Step 1: Verify Template Access ⚠️ **ACTION REQUIRED**
```bash
# 1. Open the master template
open "https://docs.google.com/spreadsheets/d/1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU/edit"

# 2. Click "Share" button
# 3. Add: accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
# 4. Give "Editor" permission
# 5. Click "Send"
```

### Step 2: Verify Vercel Environment Variable
```bash
# Check current value
vercel env pull .env.production.local

# If needed, update it
vercel env rm GOOGLE_SERVICE_ACCOUNT_KEY production
cat config/google-credentials.json | vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production
```

### Step 3: Redeploy
```bash
vercel --prod --yes
```

### Step 4: Test Again
```bash
# Register new user
./test-new-user-registration.sh

# Check if spreadsheet is created this time
# Expected: spreadsheetId should be populated
```

## Expected Behavior (After Fix)

### Registration Response Should Include:
```json
{
  "success": true,
  "user": {
    "email": "newuser@example.com",
    "spreadsheetId": "1ABC...XYZ",  // <-- Should NOT be null
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit",
    "spreadsheetCreatedAt": "2025-11-13T10:15:00.000Z"
  }
}
```

### APIs Should Work:
```json
{
  "ok": true,
  "data": {
    "properties": ["Default Property"],
    "count": 1
  }
}
```

## Debugging Tips

If still failing after the fix:

1. **Check Vercel Function Logs:**
   ```bash
   vercel logs https://accounting.siamoon.com
   ```

2. **Look for these errors:**
   - "GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required"
   - "Error provisioning spreadsheet"
   - "Failed to copy template"
   - Permission denied errors

3. **Test Locally:**
   ```bash
   # Set environment variable
   export GOOGLE_SERVICE_ACCOUNT_KEY=$(cat config/google-credentials.json)
   
   # Run local test
   npm run dev
   # Then register a user at http://localhost:3000
   ```

## Files Involved

- `/lib/auth/service.ts` - Registration logic with auto-provisioning
- `/lib/services/spreadsheet-provisioning.ts` - Spreadsheet creation logic
- `/lib/middleware/auth.ts` - Authentication middleware (blocks API access without spreadsheet)
- `config/google-credentials.json` - Local service account key

---

**Next Steps:** Share template with service account and redeploy.
