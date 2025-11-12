# OAuth 2.0 Setup for BookMate Multi-Tenant Spreadsheets

## 🎯 Overview

Instead of using service account keys (which are blocked by your organization policy), we'll use OAuth 2.0 where each user authorizes BookMate to create and manage spreadsheets on their behalf.

## ✅ Benefits
- No service account keys needed
- More secure (user explicitly authorizes)
- Follows Google's best practices
- Spreadsheets created directly in user's Drive
- Users retain full ownership and control

## 📋 Setup Steps

### Step 1: Configure OAuth Consent Screen

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one in your siamoon.com organization)
3. **Navigate to**: APIs & Services → OAuth consent screen
4. **Configure consent screen**:

   **User Type**:
   - Select **"Internal"** (only users in your siamoon.com organization can use it)
   - Click **"Create"**

   **App information**:
   - **App name**: `BookMate`
   - **User support email**: `shaun@siamoon.com`
   - **App logo**: (optional - upload BookMate logo if you have one)
   
   **App domain** (optional for now):
   - **Application home page**: `https://accounting.siamoon.com`
   - **Application privacy policy**: (can add later)
   - **Application terms of service**: (can add later)
   
   **Developer contact information**:
   - **Email addresses**: `shaun@siamoon.com`
   
   Click **"Save and Continue"**

   **Scopes**:
   - Click **"Add or Remove Scopes"**
   - Search and select:
     - ✅ `https://www.googleapis.com/auth/spreadsheets` - Create and edit spreadsheets
     - ✅ `https://www.googleapis.com/auth/drive.file` - Create and access files in Drive
   - Click **"Update"**
   - Click **"Save and Continue"**

   **Summary**:
   - Review and click **"Back to Dashboard"**

### Step 2: Create OAuth 2.0 Credentials

1. **Navigate to**: APIs & Services → Credentials
2. **Click**: "Create Credentials" → "OAuth client ID"
3. **Configure OAuth client**:
   - **Application type**: `Web application`
   - **Name**: `BookMate Web Application`
   
   **Authorized JavaScript origins**:
   - Add: `http://localhost:3000` (for development)
   - Add: `https://accounting.siamoon.com` (production - primary domain)
   - Add: `https://bookmate-git-main-tool2us-projects.vercel.app` (production - git main)
   - Add: `https://bookmate-ailztwj2a-tool2us-projects.vercel.app` (production - deployment preview)
   
   **Authorized redirect URIs**:
   - Add: `http://localhost:3000/api/auth/google/callback`
   - Add: `https://accounting.siamoon.com/api/auth/google/callback`
   - Add: `https://bookmate-git-main-tool2us-projects.vercel.app/api/auth/google/callback`
   - Add: `https://bookmate-ailztwj2a-tool2us-projects.vercel.app/api/auth/google/callback`
   
4. **Click**: "Create"
5. **Copy the credentials**:
   - Copy **Client ID**
   - Copy **Client Secret**
   - Save these securely!

### Step 3: Update Environment Variables

Add to `.env.local`:

```bash
# Google OAuth 2.0 Credentials
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Keep existing variables
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
# ... other existing vars ...
```

### Step 4: Install Required Packages

```bash
npm install google-auth-library
```

### Step 5: Implementation (I'll create the files)

I'll create:
1. OAuth callback handler
2. Token storage in database
3. Updated spreadsheet provisioning service
4. Google Drive authorization flow

---

## 🔄 How It Will Work

### First-Time User Registration:
```
1. User registers → Account created
2. Redirect to Google OAuth consent screen
3. User authorizes BookMate to access Drive
4. Google redirects back with authorization code
5. BookMate exchanges code for access + refresh tokens
6. Tokens stored in database (encrypted)
7. Spreadsheet created using user's authorization
8. User owns spreadsheet, BookMate has delegated access
```

### Subsequent Logins:
```
1. User logs in
2. BookMate uses stored refresh token
3. Gets new access token automatically
4. User's spreadsheet is accessible
5. No re-authorization needed (unless token revoked)
```

---

**Ready to proceed?** Reply "yes" and I'll create all the necessary code files!
