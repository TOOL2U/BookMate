# Creating Service Account in Google Workspace Organization

## ⚠️ Problem Identified
Your current service account is in project `accounting-buddy-476114` which is **NOT part of a Google Workspace organization**. Domain-wide delegation requires the service account to be in the same organization as your Google Workspace.

## ✅ Solution: Create Service Account in Your Workspace

### Step 1: Go to Google Cloud Console with Your Workspace Account

1. **Open**: https://console.cloud.google.com/
2. **Login**: Use `shaun@siamoon.com` (your Workspace admin account)
3. **Check Organization**: At the top of the page, you should see your organization (siamoon.com)

### Step 2: Create a New Project

1. Click the **project selector** at the top (shows current project name)
2. Click **"New Project"**
3. **Project Name**: `BookMate Production`
4. **Organization**: Make sure it shows your organization (siamoon.com)
5. **Location**: Select your organization
6. Click **"Create"**

### Step 3: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - ✅ **Google Sheets API**
   - ✅ **Google Drive API**

### Step 4: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. **Service account details**:
   - **Name**: `BookMate Spreadsheet Service`
   - **ID**: `bookmate-spreadsheet` (auto-generated)
   - **Description**: `Service account for creating and managing user spreadsheets`
4. Click **"Create and Continue"**
5. **Grant roles** (Optional - skip for now):
   - Click **"Continue"** without adding roles
6. **Grant users access** (Optional - skip for now):
   - Click **"Done"**

### Step 5: Create Service Account Key

1. Click on the newly created service account
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **JSON** format
5. Click **"Create"**
6. **Download the JSON file** - save it securely!

### Step 6: Enable Domain-Wide Delegation

1. Still on the service account details page
2. Scroll to **"Advanced settings"**
3. Under **"Domain-wide delegation"**:
   - Check **"Enable Google Workspace Domain-wide Delegation"**
   - **Product name**: `BookMate`
4. Click **"Save"**
5. **Copy the Client ID** (you'll need this for next step)

### Step 7: Authorize in Google Workspace Admin Console

1. Go to **Google Workspace Admin Console**: https://admin.google.com/
2. Login with `shaun@siamoon.com`
3. Navigate to: **Security** → **Access and data control** → **API Controls**
4. Scroll to **"Domain-wide delegation"**
5. Click **"Manage Domain-Wide Delegation"**
6. Click **"Add new"**
7. Enter:
   - **Client ID**: (paste the Client ID from Step 6)
   - **OAuth Scopes** (enter these exactly):
     ```
     https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/drive.file
     ```
   - **Client Name**: `BookMate Spreadsheet Service`
8. Click **"Authorize"**

### Step 8: Update BookMate Configuration

1. **Replace the credentials file**:
   ```bash
   # Backup old credentials
   mv config/google-credentials.json config/google-credentials.json.backup
   
   # Copy your new downloaded JSON file
   cp ~/Downloads/bookmate-production-*.json config/google-credentials.json
   ```

2. **Update environment variables** (if needed):
   The new service account details should be:
   - Project ID: `bookmate-production` (or whatever you named it)
   - Service Account Email: `bookmate-spreadsheet@bookmate-production.iam.gserviceaccount.com`

3. **Share the master template** with the new service account:
   ```bash
   npm run share-template
   # Or manually share the template spreadsheet with:
   # bookmate-spreadsheet@bookmate-production.iam.gserviceaccount.com
   ```

### Step 9: Test the Setup

```bash
# Delete test users
psql postgresql://localhost/bookmate_dev -c "DELETE FROM users WHERE email LIKE '%@bookmate.com';"

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@siamoon.com",
    "password": "TestUser123!",
    "name": "Test User"
  }' | jq '.user | {email, spreadsheetId, spreadsheetUrl}'
```

Expected output:
```json
{
  "email": "test.user@siamoon.com",
  "spreadsheetId": "1XYZ...",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1XYZ.../edit"
}
```

## 🔍 Why This Matters

**Before**: Service account in "No organisation" → Cannot use domain-wide delegation → Cannot create spreadsheets

**After**: Service account in your Workspace organization → Can use domain-wide delegation → Can create spreadsheets on behalf of users ✅

## 📝 Quick Checklist

- [ ] Create new project in your Workspace organization
- [ ] Enable Google Sheets API and Google Drive API
- [ ] Create service account in new project
- [ ] Download JSON key file
- [ ] Enable domain-wide delegation on service account
- [ ] Copy Client ID
- [ ] Authorize Client ID in Google Workspace Admin Console with scopes
- [ ] Replace credentials file in BookMate
- [ ] Share master template with new service account
- [ ] Test user registration

## ⏱️ Time Required
Approximately 15-20 minutes

## 🆘 Alternative: OAuth 2.0 Flow

If setting up a Workspace organization is not feasible, we can switch to OAuth 2.0 where:
- Each user authorizes BookMate to access their Google Drive
- Spreadsheets are created directly in user's Drive
- No domain-wide delegation needed
- Requires OAuth consent screen setup

Let me know if you'd like to explore this alternative!

---
**Current Account**: accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com (No organisation) ❌  
**Need**: Service account in siamoon.com organization ✅
