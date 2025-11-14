# Service Account Storage Quota Issue - SOLVED

## Problem
Service accounts have **0 GB storage quota** by default. They can't create new Drive files because they have no storage allocation.

## The Solution: Copy files owned by a REAL user

Instead of the service account creating/owning the files, we need to:

1. **Have the template owned by a real Google Workspace user** (e.g., your personal account)
2. **Service account copies it but specifies ownership transfer** OR
3. **Use a Shared Drive** where storage isn't counted against individual accounts

## Quick Fix: Transfer Template Ownership

### Step 1: Transfer template ownership to your personal Google account

1. Open: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit

2. Click Share → Advanced

3. Find the service account (`accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`)

4. **Change its role from Owner to Editor**

5. Add your personal email (`shaunducker1@gmail.com`) as Owner

6. Save

### Step 2: Update the code to copy AS the user (not service account)

When copying, we'll specify that the NEW file should be owned by a designated Drive folder or user account.

## Better Solution: Use Shared Drive (Team Drive)

### Create a Shared Drive:
1. Go to: https://drive.google.com
2. Click "Shared drives" in left sidebar  
3. Click "+ New"
4. Name it: "BookMate User Spreadsheets"
5. Add service account as Manager

### Update code to use Shared Drive:
```javascript
const copyResponse = await drive.files.copy({
  fileId: TEMPLATE_ID,
  requestBody: {
    name: `BookMate P&L 2025 – ${userName}`,
    parents: [SHARED_DRIVE_ID], // Files stored in Shared Drive
  },
  supportsAllDrives: true,
});
```

## Immediate Workaround: Make YOU the owner

Since the template is currently owned by the service account (which has no storage), let's:

1. **Transfer ownership to your Google Workspace account**
2. **Keep service account as Editor** (so it can still copy)
3. **Copied files will be owned by YOU** (using your storage quota)
4. **Service account can manage/share them**

This is actually the BEST approach because:
- ✅ Uses your Google Workspace storage (unlimited with Business plan)
- ✅ You maintain control/ownership
- ✅ Service account can still automate everything
- ✅ No storage quota issues

### Implementation:

1. Go to template sharing settings
2. Make `shaunducker1@gmail.com` the Owner
3. Make service account an Editor
4. Test the copy again - it should work!

The service account can copy files it has Edit access to, and the copies will inherit ownership based on Drive's rules.
