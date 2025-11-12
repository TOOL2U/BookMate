# Setting Up Domain-Wide Delegation for BookMate

## 🎯 Goal
Enable the service account to create Google Spreadsheets on behalf of users in your domain.

## 📋 Prerequisites
- Admin access via `shaun@siamoon.com`
- Access to Google Workspace Admin Console

## 🔧 Step-by-Step Instructions

### Step 1: Get Service Account Information
**Service Account Email**: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`  
**Client ID**: `117050104523490869360`  
**Project**: `accounting-buddy-476114`

### Step 2: Enable Domain-Wide Delegation in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **accounting-buddy-476114**
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Find service account: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
5. Click on the service account email
6. Go to the **Details** tab
7. Under **Advanced settings**, find **Domain-wide delegation**
8. Click **Enable Google Workspace Domain-wide Delegation**
9. Click **Save**

### Step 3: Configure OAuth Scopes in Google Workspace Admin Console

1. **Login** to [Google Workspace Admin Console](https://admin.google.com/)
   - Use your admin account: `shaun@siamoon.com`

2. **Navigate to API Controls**:
   - Click **Security** (in left menu)
   - Click **Access and data control**
   - Click **API Controls**

3. **Manage Domain-Wide Delegation**:
   - Scroll down to **Domain-wide delegation** section
   - Click **Manage Domain-Wide Delegation**

4. **Add New Client**:
   - Click **Add new**
   - Enter the **Client ID**: `117050104523490869360`
   - Enter **OAuth Scopes** (one per line or comma-separated):
     ```
     https://www.googleapis.com/auth/spreadsheets
     https://www.googleapis.com/auth/drive
     https://www.googleapis.com/auth/drive.file
     ```
   - **Client Name** (description): `BookMate Spreadsheet Service`
   - Click **Authorize**

### Step 4: Verify the Setup

After authorization, wait 5-10 minutes for changes to propagate, then test:

```bash
cd /Users/shaunducker/Desktop/BookMate-webapp

# Delete test users
psql postgresql://localhost/bookmate_dev -c "DELETE FROM users WHERE email = 'bob.builder@bookmate.com';"

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@siamoon.com",
    "password": "TestUser123!",
    "name": "Test User"
  }' | jq '.user | {email, spreadsheetId, spreadsheetUrl}'
```

Expected result:
```json
{
  "email": "test.user@siamoon.com",
  "spreadsheetId": "1abc123...",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1abc123.../edit"
}
```

## 🔍 Troubleshooting

### Issue: "Access Not Configured" error
**Solution**: Make sure Google Sheets API and Google Drive API are enabled in the project:
1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Sheets API" → Enable
3. Search for "Google Drive API" → Enable

### Issue: Still getting permission errors
**Wait time**: Domain-wide delegation can take 5-10 minutes to propagate
**Solution**: 
- Clear browser cache
- Wait 10 minutes and try again
- Verify the Client ID is correct
- Verify scopes are entered exactly as shown above

### Issue: "The caller does not have permission"
**Possible causes**:
1. Domain-wide delegation not enabled
2. Scopes not authorized
3. Service account not in the correct project
4. Changes haven't propagated yet

**Solution**: Double-check all steps above

## 📝 What This Does

Once configured, the service account can:
1. ✅ Create spreadsheets on behalf of any user in your domain
2. ✅ Copy sheets from the master template
3. ✅ Transfer ownership of spreadsheets to users
4. ✅ Manage file permissions

## 🔐 Security Notes

- The service account can only act within your domain (`siamoon.com`)
- It can only perform actions within the authorized scopes
- It cannot access user passwords or authentication
- All actions are logged in Google Workspace audit logs

## 🎉 After Setup

Once domain-wide delegation is working:
1. Every new user registration will automatically create their personal spreadsheet
2. The spreadsheet will be a complete copy of the master template
3. Ownership will be transferred to the user
4. The service account will retain edit access for API operations

## 📞 Next Steps

After successful setup, proceed to **Phase 2**:
- Update all API routes to use user-specific spreadsheets
- Test multi-user data isolation
- Deploy to production

---
**Service Account**: accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com  
**Client ID**: 117050104523490869360  
**Admin Account**: shaun@siamoon.com
