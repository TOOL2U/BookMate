# Testing Service Account Permissions

## Issue
Service account still getting "permission denied" even after sharing template.

## Possible Causes

1. **Service Account not enabled in Google Cloud Console**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114
   - Check if service account is enabled
   - Verify it has Google Drive API and Sheets API enabled

2. **APIs not enabled for the project**
   - Go to: https://console.cloud.google.com/apis/library?project=accounting-buddy-476114
   - Enable: Google Sheets API
   - Enable: Google Drive API

3. **Service account credentials might be wrong**
   - Verify GOOGLE_SERVICE_ACCOUNT_KEY in .env.local

## Quick Test: Create Spreadsheet Without Template

Let's first test if the service account can create a simple spreadsheet at all (no template copying):

```typescript
// Test: Can service account create ANY spreadsheet?
const createResponse = await sheets.spreadsheets.create({
  requestBody: {
    properties: {
      title: 'Test - Service Account',
    },
  },
});
```

If this works, then the issue is specifically with copying from the template.
If this fails, then the service account itself has issues.

## Alternative: Use Service Account's Own Template

Instead of copying from an external template, we could:
1. Create one "master" template owned by the service account
2. Copy from that template (which it definitely has access to)
3. Share the copied version with users

## Next Steps

1. Enable APIs in Google Cloud Console
2. Test basic spreadsheet creation (no template)
3. If that works, create a master template owned by service account
4. Update code to use service account's template
