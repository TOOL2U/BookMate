# Service Account Configuration Check

## Current Status
❌ Spreadsheet auto-provisioning is FAILING in production
✅ User registration works (user created in database)
❌ Spreadsheet ID remains `null` after registration

## Root Cause Analysis

The `provisionUserSpreadsheetAuto()` function is failing silently. Possible causes:

### 1. GOOGLE_SERVICE_ACCOUNT_KEY Format Issue
The service account key in Vercel might be:
- Not properly formatted as JSON
- Missing required fields
- Not properly escaped

**Required Format:**
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 2. Master Template Not Shared
Template ID: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`

**The template MUST be shared with the service account email:**
- Get service account email from the JSON key's `client_email` field
- Share the template spreadsheet with that email
- Give "Viewer" or "Editor" permission

### 3. Shared Drive Configuration
The `BOOKMATE_SHARED_DRIVE_ID` is set to: `0ACHIGfT01vYxUk9PVA`

**Verify:**
- Service account has access to this shared drive
- Service account can create files in this drive

## Immediate Action Required

1. **Verify Service Account Email:**
   ```bash
   # Extract email from local service account key
   cat client_secret_*.json | jq -r '.client_email'
   ```

2. **Check Template Access:**
   - Open: https://docs.google.com/spreadsheets/d/1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU/edit
   - Click "Share"
   - Verify service account email has access

3. **Re-add Environment Variable:**
   If the key format is wrong in Vercel, remove and re-add it:
   ```bash
   vercel env rm GOOGLE_SERVICE_ACCOUNT_KEY production
   vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production < client_secret_*.json
   ```

4. **Enable Logging:**
   Add console.log statements are already in the code, but errors are being caught and swallowed.
   Need to check Vercel function logs after next registration attempt.

## Testing Steps

After fixing:
1. Register a new test user
2. Check if `spreadsheetId` is populated
3. Verify spreadsheet exists in Google Drive
4. Verify user can access it
5. Test all APIs with the new user

