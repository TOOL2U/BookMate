# Setting Up a New Client Account - Step by Step

## Problem You're Experiencing

When a new user (like maria@siamoon.com) logs in, you see these errors:
```
❌ Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Why this happens:** The Apps Script URL in the account configuration is either:
- Not deployed yet
- Deployed with wrong permissions
- Pointing to the wrong URL

## Solution: Complete Setup Checklist

### Step 1: Create User Account ✅ (DONE)
- User signed up successfully
- Account created in admin panel at `/admin/accounts`

### Step 2: Create Google Sheet for Client
1. Go to Google Sheets
2. Create a new spreadsheet from your BookMate template
3. Name it: `[Company Name] - BookMate`
4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Step 3: Deploy Apps Script for This Client

1. **Open the Google Sheet** you just created
2. **Extensions → Apps Script**
3. **Delete all existing code** in the editor
4. **Get the template code:**
   - Go to your admin account page: `/admin/accounts/[accountId]`
   - Click "View Apps Script Template"
   - Copy the entire code (it will have the client's secret already embedded)
5. **Paste the code** into Apps Script editor
6. **Save** (💾 Save button or Cmd/Ctrl+S)
7. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Click the gear icon ⚙️ → Select "Web app"
   - Fill in:
     - **Description:** "BookMate V9.0 - [Company Name]"
     - **Execute as:** "Me" (your email)
     - **Who has access:** "Anyone" ⚠️ **IMPORTANT!**
   - Click "Deploy"
   - **Authorize** the script (click "Authorize access")
   - Select your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"
8. **Copy the Web App URL** (looks like):
   ```
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
   ```

### Step 4: Update Account Configuration

1. Go to admin panel: `/admin/accounts`
2. Find the client account (e.g., "Alesia House Company Ltd")
3. Click "Manage"
4. Update these fields:
   - **Sheet ID:** Paste the Sheet ID from Step 2
   - **Apps Script URL:** Paste the Web App URL from Step 3
   - **Webhook Secret:** (should already be filled - don't change)
5. Click "Save Changes"

### Step 5: Test the Setup

1. Log out of admin account
2. Log in as the new user (e.g., maria@siamoon.com)
3. You should now see data loading without errors!

## Common Issues

### Issue: "Apps Script not properly deployed"
**Solution:** Make sure you selected "Anyone" for "Who has access" in Step 3.7

### Issue: "Permission denied"
**Solution:** The Apps Script needs to be authorized. Re-do Step 3.7 and make sure to complete the authorization flow.

### Issue: "Invalid sheet ID"
**Solution:** Double-check the Sheet ID - it should be the long string between `/d/` and `/edit` in the Google Sheets URL

### Issue: "Secret mismatch"
**Solution:** Make sure you copied the Apps Script template from the admin panel, which has the correct secret embedded.

## For Maria's Account (Current Issue)

**Company:** Alesia House Company Ltd  
**User:** maria@siamoon.com

**Next Steps:**
1. ✅ Create Google Sheet for Alesia House
2. ⏳ Deploy Apps Script to that sheet
3. ⏳ Copy the Web App URL
4. ⏳ Update maria's account with Sheet ID and Apps Script URL in admin panel

Once you complete steps 2-4, maria@siamoon.com will be able to see her data!

## Quick Reference: Where to Find Everything

- **Admin Panel:** http://localhost:3000/admin/accounts
- **Create Account:** http://localhost:3000/admin/accounts/new
- **View Account:** http://localhost:3000/admin/accounts/[accountId]
- **Apps Script Template:** Shown on account detail page
- **Google Sheets:** https://sheets.google.com

## Security Notes

- Each client has their own unique webhook secret
- The secret is embedded in their Apps Script template
- Never share secrets between clients
- Apps Script must be deployed with "Anyone" access (this is safe because the secret validates requests)
