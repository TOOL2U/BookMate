# Service Account Setup for Automatic Spreadsheet Creation

## Problem
The service account needs permission to access the master template spreadsheet to copy it for new users.

## Service Account Email
```
accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
```

## Master Template Spreadsheet
```
ID: 1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8
URL: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit
```

## Fix Required

### Step 1: Share Template with Service Account
1. Open the master template: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit
2. Click "Share" button (top right)
3. Add this email: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
4. Set permission to: **Viewer** (read-only is enough)
5. Uncheck "Notify people" (it's a service account, not a person)
6. Click "Share"

### Step 2: Test Again
After sharing, test registration:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","name":"Test User"}' | jq
```

## How It Works

### OLD Flow (OAuth - Required Manual Approval) ❌
1. User registers
2. User clicks OAuth button
3. User approves Google Sheets access
4. Spreadsheet created using user's Google account
5. User owns the spreadsheet

### NEW Flow (Service Account - Automatic) ✅
1. User registers
2. **Spreadsheet automatically created** by service account
3. Spreadsheet **shared with user's email**
4. User receives email notification with link
5. Service account owns spreadsheet, user has write access

## Benefits of Service Account Approach

✅ **No OAuth popup** - Instant spreadsheet creation  
✅ **No user approval** - Fully automatic  
✅ **Works with any email** - User doesn't need Google account  
✅ **Consistent permissions** - All spreadsheets have same structure  
✅ **Centralized control** - You control all spreadsheets via service account

## Current Status

⏳ **Waiting for template sharing** - Share template with service account email above  
✅ **Code updated** - `registerUser()` now auto-creates spreadsheets  
✅ **Service account configured** - Credentials in `.env.local`

## After Fix

Once the template is shared with the service account:
- New user registration will automatically create spreadsheet
- User will receive email: "Your BookMate spreadsheet is ready!"
- User can click link and start using immediately
- No OAuth flow needed

## Testing After Fix

```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"Test123!","name":"New User"}'

# Check user profile (should have spreadsheetId populated)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" | jq '.user | {email, spreadsheetId, spreadsheetUrl}'
```

Expected output should show:
```json
{
  "email": "newuser@example.com",
  "spreadsheetId": "1ABC...XYZ",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit"
}
```
