# Vercel Environment Variable Fix Required

## Issue
After rollback, the application is not showing data because `GOOGLE_SHEET_ID` environment variable is missing or incorrect in Vercel.

## Root Cause
The rolled-back code (commit `2422476`) uses `process.env.GOOGLE_SHEET_ID` to access the spreadsheet, but this variable may not be set in Vercel environment variables.

## Solution: Set GOOGLE_SHEET_ID in Vercel

### Method 1: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/tool2us-projects/bookmate/settings/environment-variables
2. Add or update the environment variable:
   - **Key**: `GOOGLE_SHEET_ID`
   - **Value**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
   - **Environments**: Production, Preview, Development (select all)
3. Click "Save"
4. Redeploy the application (or it will auto-redeploy)

### Method 2: Via Vercel CLI
```bash
# Set the environment variable
vercel env add GOOGLE_SHEET_ID

# When prompted:
# - Enter value: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
# - Select environments: Production, Preview, Development

# Redeploy
vercel --prod
```

## Required Environment Variables (After Rollback)

The rolled-back version needs these environment variables set in Vercel:

### Essential:
- ✅ `GOOGLE_SHEET_ID` = `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` = {your service account JSON}
- ✅ `SHEETS_PNL_URL` = {Google Apps Script URL for P&L}
- ✅ `SHEETS_WEBHOOK_SECRET` = {webhook secret}
- ✅ `DATABASE_URL` = {Supabase connection string with Transaction Pooler}

### Firebase (if using auth):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Optional:
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`

## Verify Environment Variables

After setting, verify with:
```bash
curl https://bookmate-webapp.vercel.app/api/admin/env-verify
```

## What This Fixes
- ❌ **Before**: Dashboard shows no data
- ❌ **Before**: P&L page shows no data  
- ❌ **Before**: API routes return "Missing GOOGLE_SHEET_ID" errors
- ✅ **After**: All pages load spreadsheet data correctly

## Current Deployment
- Deployment URL: https://bookmate-8scktf9wa-tool2us-projects.vercel.app
- Inspect: https://vercel.com/tool2us-projects/bookmate/HeTh9fQXLfk1io3ECefRS1tEHJxC

## Next Steps
1. Set `GOOGLE_SHEET_ID` in Vercel (see methods above)
2. Wait for automatic redeployment (or trigger manually)
3. Test dashboard and P&L pages
4. Verify data loads correctly

---

**Status**: ⚠️ Environment variable missing
**Action Required**: Set `GOOGLE_SHEET_ID` in Vercel dashboard
**Priority**: HIGH - Application won't work without this
