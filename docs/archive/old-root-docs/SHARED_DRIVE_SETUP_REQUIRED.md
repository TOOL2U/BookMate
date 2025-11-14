# Shared Drive Setup - Action Required

## Current Status

❌ Service account **does not have access** to any Shared Drive yet.

According to the PM's instructions, a Shared Drive was created under siamoon.com with:
- New template ID: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
- Service account should have access: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`

However, when we query the Drive API, the service account cannot see any Shared Drives.

## What the PM Needs to Do

### Step 1: Find the Shared Drive

1. Go to: https://drive.google.com
2. Click "Shared drives" in the left sidebar
3. Find the Shared Drive containing the template spreadsheet
4. Click on it

### Step 2: Add Service Account as Member

1. Click the ⚙️ (settings icon) or right-click → "Manage members"
2. Click "+ Add members"
3. Enter: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
4. Set role to: **Manager** (or **Content Manager** at minimum)
5. **Uncheck** "Notify people" (it's a service account, not a person)
6. Click "Send" or "Add"

### Step 3: Get the Shared Drive ID

**Option A: From URL**
1. While viewing the Shared Drive in https://drive.google.com
2. Look at the URL: `https://drive.google.com/drive/folders/XXXXXXXXXX`
3. The `XXXXXXXXXX` part is the Shared Drive ID

**Option B: Run this script**
After adding the service account as member, run:
```bash
node list-shared-drives.mjs
```

This will output the Shared Drive ID to add to `.env.local`

### Step 4: Add to Environment Variables

Add this line to `.env.local`:
```
BOOKMATE_SHARED_DRIVE_ID=<THE_SHARED_DRIVE_ID_FROM_STEP_3>
```

Also add to Vercel production environment:
```bash
vercel env add BOOKMATE_SHARED_DRIVE_ID production
# When prompted, paste the Shared Drive ID
```

### Step 5: Verify Template Location

Make sure the template spreadsheet is INSIDE the Shared Drive:
1. Template ID: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
2. Open it: https://docs.google.com/spreadsheets/d/1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU/edit
3. Verify it shows "Shared drive: [Drive Name]" under the filename
4. If not, move it into the Shared Drive

## Why This Is Important

Shared Drives solve two problems:
1. **Storage quota**: Files in Shared Drives don't count against individual user quotas
2. **Ownership**: Shared Drive owns the files, not individual users (prevents cross-org ownership issues)

When the service account copies the template, the copy will also be in the Shared Drive, using the organization's storage (not the service account's 0 GB quota).

## After Setup is Complete

Once the PM has:
- ✅ Added service account to Shared Drive as Manager
- ✅ Confirmed template is in the Shared Drive  
- ✅ Provided the Shared Drive ID

We can test with:
```bash
node list-shared-drives.mjs  # Should show the Shared Drive
node test-template-copy.mjs  # Should successfully copy the template
```

Then test user registration:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

The spreadsheet should be created automatically! 🎉
