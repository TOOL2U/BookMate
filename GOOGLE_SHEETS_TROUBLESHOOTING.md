# Google Sheets Integration Troubleshooting Guide

**Date**: November 5, 2025  
**Status**: Diagnosing "Requested entity was not found" error in production

## Current Situation

- ✅ Local environment: Works (different error: "Unable to parse range" = has access)
- ❌ Production (Vercel): "Requested entity was not found" = authentication/permission issue

## PM's Root Cause Checklist

### ✅ 1. Node.js Runtime Configuration
**Status**: COMPLETED
- Added `export const runtime = 'nodejs';` to all Google Sheets routes:
  - `/api/balance/by-property/route.ts`
  - `/api/balance/route.ts`
  - `/api/categories/sync/route.ts`
  - `/api/health/balance/route.ts`
  - `/api/debug/sheet-tabs/route.ts`
  - `/api/debug/balance-summary/route.ts`
  - `/api/sheets-health/route.ts`
  - `/api/test-sheets/route.ts`

### ⚠️ 2. Private Key Formatting
**Status**: NEEDS VERIFICATION

**Issue**: When we added `GOOGLE_PRIVATE_KEY` via CLI, we used:
```bash
cat accounting-buddy-476114-82555a53603b.json | jq -r '.private_key' | vercel env add GOOGLE_PRIVATE_KEY production
```

**PM Guidance**: Private key MUST have real newlines, not `\n` escapes.

**Current Fix**: Added `.replace(/\\n/g, '\n')` to all routes as safety measure

**Next Step**: Manually verify in Vercel dashboard that the key has real line breaks

**To Fix**:
1. Go to Vercel → Project → Settings → Environment Variables
2. Find `GOOGLE_PRIVATE_KEY`
3. Edit and paste the key from `/tmp/private_key.txt` with REAL newlines (press Enter)
4. Save and redeploy

### ❓ 3. Service Account Sheet Sharing
**Status**: NEEDS VERIFICATION

**Service Account Email**: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`  
**Sheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

**To Verify**:
1. Open: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
2. Click "Share" button
3. Check if `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com` is listed
4. If not: Add with **Editor** permission
5. Redeploy after sharing

### ✅ 4. Google Cloud APIs Enabled
**Status**: COMPLETED
- ✅ Google Sheets API: Enabled
- ✅ Google Cloud Firestore API: Enabled
- ❓ Google Drive API: Unknown (may be needed)

**To Verify**:
1. Go to: https://console.cloud.google.com/apis/library?project=accounting-buddy-476114
2. Search for "Google Drive API"
3. If not enabled, click "Enable"

### ✅ 5. Environment Variables Present
**Status**: COMPLETED

All required variables are set in Vercel Production:
- ✅ `GOOGLE_CLIENT_EMAIL` = accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
- ✅ `GOOGLE_PRIVATE_KEY` = (encrypted - needs verification of format)
- ✅ `GOOGLE_SHEET_ID` = 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

## Diagnostic Endpoints

### 1. `/api/test-sheets` (PM's Recommended Route)
**Purpose**: Test basic Google Sheets authentication  
**Expected Outputs**:

| Response | Meaning | Fix |
|----------|---------|-----|
| `{ ok: true, title: "..." }` | ✅ Authentication works | Check `/api/balance` logic |
| `{ ok: false, error: "PERMISSION_DENIED" }` | Sheet not shared | Share Sheet with service account |
| `{ ok: false, error: "invalid_grant" }` | Private key format issue | Fix newlines in env var |
| `{ ok: false, error: "not found" }` | Wrong Sheet ID | Verify GOOGLE_SHEET_ID |

**Test**: `curl https://accounting-buddy-app.vercel.app/api/test-sheets`

### 2. `/api/sheets-health`
**Purpose**: Extended diagnostic with grid data check  
**Test**: `curl https://accounting-buddy-app.vercel.app/api/sheets-health`

### 3. `/api/debug/env-check`
**Purpose**: Verify environment variables are loaded  
**Test**: `curl https://accounting-buddy-app.vercel.app/api/debug/env-check`

## Testing Sequence

1. **Wait for deployment** (~2 minutes)
   ```bash
   vercel ls | head -n 5
   ```

2. **Test PM's diagnostic route**
   ```bash
   curl -s https://accounting-buddy-app.vercel.app/api/test-sheets | jq .
   ```

3. **Interpret results** based on table above

4. **If still failing**:
   - Verify Sheet sharing (most likely cause)
   - Verify private key newlines in Vercel dashboard
   - Enable Google Drive API if needed

## Next Actions (Priority Order)

1. ⏳ Wait for current deployment to complete
2. ⏳ Test `/api/test-sheets` endpoint
3. ⚠️ Based on error message, apply specific fix from PM's table
4. ⚠️ Most likely: Share Google Sheet with service account email
5. ⚠️ Possibly: Fix GOOGLE_PRIVATE_KEY newlines in Vercel dashboard

## Files Modified (Latest Deployment)

- `app/api/test-sheets/route.ts` - NEW: PM's diagnostic route
- `app/api/sheets-health/route.ts` - UPDATED: Added `.replace(/\\n/g, '\n')`
- `app/api/debug/env-check/route.ts` - NEW: Environment variable checker

**Commit**: a6543f5 - "Fix: Add replace for escaped newlines in GOOGLE_PRIVATE_KEY + PM's test-sheets diagnostic route"
