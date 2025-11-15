# Multi-Tenant Spreadsheet Configuration

## Overview
BookMate now supports **multi-tenant spreadsheet architecture** where:
- ✅ **shaun@siamoon.com** (admin) uses the **original spreadsheet**
- ✅ **All other users** get their **own auto-provisioned spreadsheets**

## Original Spreadsheet
- **ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- **URL**: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit
- **Owner**: shaun@siamoon.com
- **Purpose**: Admin/production data

## Template Spreadsheet
- **ID**: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
- **Location**: Shared Drive (ID: `0ACHIGfT01vYxUk9PVA`)
- **Purpose**: Template copied for new users

---

## How It Works

### 1. **User Registration**
When a new user registers:
```typescript
// lib/auth/service.ts - registerUser()
1. User account is created in database
2. Spreadsheet is auto-provisioned using service account
3. Template is copied from Shared Drive
4. New spreadsheet is shared with user as WRITER
5. User's database record is updated with spreadsheet ID
```

### 2. **Admin Account (shaun@siamoon.com)**
Special handling for admin account:
```typescript
// lib/middleware/auth.ts - getUserSpreadsheetId()
if (user.email === 'shaun@siamoon.com') {
  // Always use original spreadsheet
  return '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
}
```

### 3. **API Routes**
All API routes use the same pattern:
```typescript
import { getSpreadsheetId } from '@/lib/middleware/auth';

const spreadsheetId = await getSpreadsheetId(request);
console.log('📊 Using spreadsheet:', spreadsheetId);

// Pass to Apps Script
const response = await fetch(SHEETS_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'getPnL',
    secret: SECRET,
    spreadsheetId: spreadsheetId, // User's personal spreadsheet
  }),
});
```

### 4. **Apps Script (V9.1)**
Apps Script accepts `spreadsheetId` parameter:
```javascript
// doPost(e)
const payload = JSON.parse(e.postData.contents);
const spreadsheetId = payload.spreadsheetId || DEFAULT_SPREADSHEET_ID;

// Open the specific spreadsheet
CURRENT_SPREADSHEET_ID = spreadsheetId;
CURRENT_SPREADSHEET = SpreadsheetApp.openById(spreadsheetId);
```

---

## Configuration Files

### Environment Variables (.env.local)
```bash
# Original spreadsheet (admin only)
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# Apps Script (multi-tenant enabled)
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbz.../exec
SHEETS_PNL_URL=https://script.google.com/macros/s/AKfycbz.../exec
SHEETS_BALANCES_GET_URL=https://script.google.com/macros/s/AKfycbz.../exec
SHEETS_BALANCES_APPEND_URL=https://script.google.com/macros/s/AKfycbz.../exec

# Service account for auto-provisioning
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Shared Drive for user spreadsheets
BOOKMATE_SHARED_DRIVE_ID=0ACHIGfT01vYxUk9PVA
```

### Code Files
- **`lib/middleware/auth.ts`** - Contains admin spreadsheet logic
- **`lib/auth/service.ts`** - Auto-provisions spreadsheets on registration
- **`lib/services/spreadsheet-provisioning.ts`** - Copies template spreadsheet
- **`scripts/assign-original-spreadsheet.ts`** - Manual script to assign original spreadsheet

---

## Setup Instructions

### Option 1: Automatic (Recommended)
The system automatically handles the admin account:
1. When `shaun@siamoon.com` makes any API request
2. The middleware detects the admin email
3. Automatically assigns the original spreadsheet
4. Updates the database

**No manual action needed!** ✅

### Option 2: Manual Script
Run the script to explicitly assign the original spreadsheet:

```bash
# Navigate to project directory
cd /Users/shaunducker/Desktop/BookMate-webapp

# Run the assignment script
npx tsx scripts/assign-original-spreadsheet.ts
```

**Expected output:**
```
🔍 Looking for user: shaun@siamoon.com
✅ Found user: shaun@siamoon.com
   Current spreadsheet ID: [current or none]

✅ SUCCESS! Updated user spreadsheet:
   Email: shaun@siamoon.com
   Spreadsheet ID: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
   Spreadsheet URL: https://docs.google.com/spreadsheets/d/...

📋 All users in database:
   1. shaun@siamoon.com
      Spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8 ⭐ (ORIGINAL)
   2. testuser@example.com
      Spreadsheet: 1ABC123... (auto-generated)
```

---

## Verification

### 1. Check User Spreadsheets (Admin API)
```bash
# Requires admin authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/users/spreadsheets
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalUsers": 2,
    "usersWithSpreadsheets": 2,
    "usersWithoutSpreadsheets": 0,
    "usingOriginalSpreadsheet": 1,
    "originalSpreadsheetId": "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
  },
  "users": [
    {
      "email": "shaun@siamoon.com",
      "spreadsheetId": "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8",
      "isUsingOriginalSpreadsheet": true
    },
    {
      "email": "testuser@example.com",
      "spreadsheetId": "1ABC123...",
      "isUsingOriginalSpreadsheet": false
    }
  ],
  "originalSpreadsheetUsers": ["shaun@siamoon.com"]
}
```

### 2. Check Account Page
1. Login as `shaun@siamoon.com`
2. Navigate to http://localhost:3000/account
3. Verify **Spreadsheet ID** shows: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
4. Click "Open in Google Sheets" to verify it's the original

### 3. Test Multi-Tenant Isolation
1. **Register new user**: `test@example.com`
2. **Check terminal logs**: Should show auto-provisioning
3. **Login as test user**: Navigate to /account
4. **Verify different spreadsheet ID**: Should NOT be the original
5. **Check dashboard**: Should show empty data (not shaun's data)

---

## Database Schema

```sql
-- users table (relevant fields)
CREATE TABLE "users" (
  "id"                   UUID PRIMARY KEY,
  "email"                VARCHAR(255) UNIQUE NOT NULL,
  "spreadsheet_id"       VARCHAR(255) UNIQUE,  -- User's personal spreadsheet
  "spreadsheet_url"      VARCHAR(512),
  "spreadsheet_created_at" TIMESTAMP,
  ...
);
```

**Important:** 
- `spreadsheet_id` is **UNIQUE** (one spreadsheet per user)
- Only `shaun@siamoon.com` can have `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

---

## Troubleshooting

### Problem: New users see shaun's data
**Cause**: Not passing `spreadsheetId` to Apps Script

**Fix**:
1. Check API route passes `spreadsheetId`:
   ```typescript
   const spreadsheetId = await getSpreadsheetId(request);
   body: JSON.stringify({ spreadsheetId })
   ```
2. Verify Apps Script uses it:
   ```javascript
   const spreadsheetId = payload.spreadsheetId;
   const sheet = SpreadsheetApp.openById(spreadsheetId);
   ```

### Problem: Admin sees wrong spreadsheet
**Cause**: Database has wrong spreadsheet ID for admin

**Fix**: Run the assignment script:
```bash
npx tsx scripts/assign-original-spreadsheet.ts
```

### Problem: User registration fails
**Cause**: Service account can't access Shared Drive

**Fix**:
1. Verify `BOOKMATE_SHARED_DRIVE_ID` in .env.local
2. Check service account has access to Shared Drive
3. Verify template spreadsheet exists: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`

---

## Production Deployment

Before deploying to Vercel:

1. ✅ **Verify local setup**: Run assignment script
2. ✅ **Test multi-tenant**: Register test user, verify isolation
3. ✅ **Set Vercel env vars**: Copy all from .env.local
4. ✅ **Deploy**: `vercel --prod`
5. ✅ **Test production**: Login as admin, verify original spreadsheet

---

## Summary

| User | Spreadsheet | Behavior |
|------|-------------|----------|
| **shaun@siamoon.com** | `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8` | Always uses original (auto-assigned) |
| **All others** | Auto-generated copy | Each user gets their own spreadsheet |

**Key Features:**
- ⭐ Admin account hardcoded to use original spreadsheet
- 🔒 Complete data isolation between users
- 🚀 Automatic spreadsheet provisioning on registration
- 📊 Multi-tenant Apps Script support
- 🛡️ Service account manages all spreadsheets

**Status**: ✅ **READY FOR PRODUCTION**
