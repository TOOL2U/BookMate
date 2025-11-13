# Fix: Enable Google APIs for Service Account

## Problem
Service account cannot create spreadsheets because the Google Sheets API and Google Drive API are not enabled for the project `accounting-buddy-476114`.

## Solution: Enable Required APIs

### Step 1: Enable Google Sheets API
1. Open: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=accounting-buddy-476114
2. Click **"ENABLE"** button
3. Wait for confirmation

### Step 2: Enable Google Drive API
1. Open: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=accounting-buddy-476114
2. Click **"ENABLE"** button
3. Wait for confirmation

### Step 3: Verify Service Account Permissions
1. Open: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114
2. Find: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
3. Verify it's **Active** (not disabled)

### Step 4: Test Again
After enabling the APIs, run the test:

```bash
node test-service-account.mjs
```

You should see:
```
✅ Spreadsheet created successfully!
✅ Template accessible!
✅ Sheet copied successfully!
```

### Step 5: Test User Registration
Once the test passes, try registering a new user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

The spreadsheet should be automatically created!

## Quick Links

- **Enable Sheets API**: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=accounting-buddy-476114
- **Enable Drive API**: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=accounting-buddy-476114
- **Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114
- **API Dashboard**: https://console.cloud.google.com/apis/dashboard?project=accounting-buddy-476114

## Why This Is Needed

Service accounts need explicit API access. Even though the credentials are valid, the Google Cloud project must have the APIs enabled before the service account can use them.

This is a one-time setup - once enabled, all future users will get automatic spreadsheet creation!
