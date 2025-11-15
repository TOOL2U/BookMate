# Create New Service Account

## Problem
The service account `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com` doesn't exist or was deleted.

## Solution: Create a New Service Account

### Step 1: Create Service Account

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114

2. Click **"+ CREATE SERVICE ACCOUNT"** at the top

3. Fill in:
   - **Service account name**: `bookmate-spreadsheet-service`
   - **Service account ID**: `bookmate-spreadsheet-service` (auto-filled)
   - **Description**: `Service account for automatically creating user spreadsheets`

4. Click **"CREATE AND CONTINUE"**

5. **Grant this service account access to project**:
   - Select role: **"Editor"**
   - Click **"CONTINUE"**

6. **Grant users access** (optional):
   - Skip this step
   - Click **"DONE"**

### Step 2: Create Key for Service Account

1. In the service accounts list, find your new service account: `bookmate-spreadsheet-service@accounting-buddy-476114.iam.gserviceaccount.com`

2. Click on it (or click the 3 dots → **"Manage keys"**)

3. Click **"KEYS"** tab → **"ADD KEY"** → **"Create new key"**

4. Select **"JSON"** format

5. Click **"CREATE"**

6. A JSON file will download - **SAVE IT SAFELY**

### Step 3: Update .env.local

1. Open the downloaded JSON file

2. Copy the **entire contents** (it should be one long line of JSON)

3. In your `.env.local` file, replace the value of `GOOGLE_SERVICE_ACCOUNT_KEY` with this new JSON:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"accounting-buddy-476114",...}
```

**Important**: The entire JSON should be on one line, no line breaks!

### Step 4: Update Vercel Environment Variable

For production, also update Vercel:

```bash
vercel env rm GOOGLE_SERVICE_ACCOUNT_KEY production
echo 'PASTE_YOUR_NEW_JSON_HERE' | vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production
```

### Step 5: Share Template with New Service Account

1. Open template: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit

2. Click **"Share"**

3. Add the new email: `bookmate-spreadsheet-service@accounting-buddy-476114.iam.gserviceaccount.com`

4. Set permission: **Viewer**

5. Uncheck "Notify people"

6. Click **"Share"**

### Step 6: Test

```bash
node test-service-account.mjs
```

Should now work!

## Quick Reference

**New Service Account Email**: `bookmate-spreadsheet-service@accounting-buddy-476114.iam.gserviceaccount.com`

This will be generated after you create the service account in step 1.
