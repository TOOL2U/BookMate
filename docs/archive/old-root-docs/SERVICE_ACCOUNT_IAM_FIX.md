# Service Account IAM Permissions Issue

## Observation
The APIs are enabled but showing high error rates:
- Google Sheets API: 14% errors
- Google Drive API: 70% errors

This suggests the service account exists but lacks proper IAM permissions.

## Solution: Grant Service Account Permissions

### Option 1: Grant Editor Role (Quick Fix)

1. Go to IAM page: https://console.cloud.google.com/iam-admin/iam?project=accounting-buddy-476114

2. Click **"GRANT ACCESS"** button

3. Add principal:
   ```
   accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
   ```

4. Select role: **"Editor"** (or at minimum "Service Account Token Creator")

5. Click **"SAVE"**

### Option 2: Use a Different Service Account Key

The service account might be disabled or the key might be revoked. Let's create a new key:

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114

2. Find: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`

3. Click on it → Go to **"KEYS"** tab

4. Click **"ADD KEY"** → **"Create new key"**

5. Select **"JSON"** format

6. Download the key file

7. Copy the entire JSON content and replace `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env.local`

### Option 3: Check if Domain-Wide Delegation is Needed

For Google Workspace (if your users have @yourdomain.com emails), you might need domain-wide delegation:

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114

2. Click on the service account

3. Click **"SHOW DOMAIN-WIDE DELEGATION"**

4. Enable **"Enable Google Workspace Domain-wide Delegation"**

5. Note the Client ID

6. In Google Workspace Admin: https://admin.google.com/ac/owl/domainwidedelegation

7. Add the Client ID with scopes:
   ```
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/drive
   ```

## Quick Check: Service Account Status

Run this to verify the service account email in your env:

```bash
grep "client_email" .env.local
```

Should show:
```
"client_email":"accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com"
```

## Most Likely Issue

Based on the 70% error rate, the service account probably doesn't have the **"Service Account Token Creator"** or **"Editor"** role in the IAM settings.

Go here first: https://console.cloud.google.com/iam-admin/iam?project=accounting-buddy-476114

Look for your service account in the list. If it's not there, click "GRANT ACCESS" and add it with Editor role.
