# Service Account Permission Issue - Root Cause Analysis

## Current Situation

✅ Service Account EXISTS: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
✅ IAM Role: **Editor** (granted)
✅ APIs Enabled: Google Sheets API, Google Drive API  
✅ Authentication: **SUCCESSFUL** (can get auth tokens)
❌ Creating Spreadsheets: **PERMISSION DENIED** (403 Forbidden)

## Root Cause

The service account has **project-level** IAM permissions (Editor role), but Google Sheets/Drive APIs require **API-level** service account enablement.

This is a chicken-and-egg problem:
- Service account can authenticate
- Service account has Editor IAM role
- But Google prevents service accounts from creating Drive resources unless they're enabled for **Domain-Wide Delegation** OR the credentials were created with the right permissions

## Why Your Existing Usage Works

You mentioned the service account works for "BookMate P&L 2025". This works because:
1. The spreadsheet already exists
2. The service account only READS it (readonly scope)
3. Reading requires less permission than creating

See `/app/api/balance/route.ts` - it uses:
```typescript
scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
```

## Solutions (Pick One)

### Solution 1: Enable Domain-Wide Delegation (RECOMMENDED)

This allows the service account to act on behalf of users.

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114

2. Click on: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`

3. Click "SHOW ADVANCED SETTINGS" or "EDIT"

4. Enable **"Enable Google Workspace Domain-wide Delegation"**

5. Save

6. Test again: `node test-service-account.mjs`

### Solution 2: Create a NEW Service Account with Proper Setup

The current service account might have been created without the right configuration.

1. **Delete** the old service account key (not the account itself)

2. **Create a new key**:
   - Go to service account details
   - Keys tab → Add Key → Create new key → JSON
   - Download it

3. **Replace** `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env.local` with the new JSON

4. **Share the master template** with the service account email

5. **Test**: `node test-service-account.mjs`

### Solution 3: Use a Different Google Cloud Project

The project `accounting-buddy-476114` might have restrictions.

1. Create a new Google Cloud Project
2. Enable Sheets & Drive APIs  
3. Create a service account with Editor role
4. Download key as JSON
5. Update env variables
6. Share template with new service account

### Solution 4: Switch to OAuth Flow (Fallback)

If service account doesn't work, use the existing OAuth credentials:
- Let users authorize once with OAuth
- Store their tokens
- Use their tokens to create spreadsheets
- This is what the current code already supports!

The OAuth flow is in `/app/api/auth/google/authorize` and `/app/api/auth/google/callback`

## Quick Test: Does OAuth Work?

You have OAuth credentials configured in .env.local (not shown here for security).

Test registration with OAuth callback working:
1. Register a user
2. Visit the OAuth URL from the response
3. Authorize with your Google account  
4. Spreadsheet will be created using YOUR permissions
5. This works but requires manual approval

## Recommended Next Step

**Try Solution 1 first** (Enable Domain-Wide Delegation):
- Fastest fix
- No code changes needed
- Uses existing service account

If that doesn't work in 5 minutes, **fall back to OAuth** (it already works, just requires user approval).

## Alternative: Hybrid Approach

Keep OAuth for spreadsheet creation (it works!), but:
1. After user authorizes once, store their refresh token
2. Use service account for READING spreadsheets
3. Use user's OAuth token for CREATING/WRITING spreadsheets

This way:
- Users authorize once (seamless after that)
- Service account handles all reads (fast, no rate limits)
- User tokens handle writes (with their permission)
