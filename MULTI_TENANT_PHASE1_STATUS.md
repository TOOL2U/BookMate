# Multi-Tenant Spreadsheet System - Phase 1 Status

## ✅ Completed

### 1. Database Schema
- ✅ Added `spreadsheetId`, `spreadsheetUrl`, `spreadsheetCreatedAt` fields to User model
- ✅ Created migration: `20251112094556_add_user_spreadsheet`
- ✅ Applied migration successfully
- ✅ Added unique index on `spreadsheetId`
- ✅ Linked Shaun's account to original spreadsheet:
  - ID: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
  - URL: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit

### 2. Google Service Account Setup
- ✅ Created `config/google-credentials.json` from environment variables
- ✅ Service account: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
- ✅ Granted service account access to master template spreadsheet
- ✅ Master template shared: `1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8`

### 3. Code Implementation
- ✅ Created `lib/services/spreadsheet-provisioning.ts`
  - `provisionUserSpreadsheet()` - Create user spreadsheet from template
  - `deleteUserSpreadsheet()` - Delete user spreadsheet (admin only)
  - Uses sheet-by-sheet copying to avoid Drive quota issues
- ✅ Created `lib/middleware/auth.ts`
  - `getCurrentUser()` - Extract and validate user from JWT
  - `getUserSpreadsheetId()` - Get user's spreadsheet ID
  - `isAdmin()` - Check admin permissions
- ✅ Updated `app/api/auth/register/route.ts`
  - Integrated spreadsheet provisioning into registration flow
  - Graceful fallback if provisioning fails (user account still created)

### 4. Helper Scripts
- ✅ `scripts/share-master-template.ts` - Grant service account access to template
- ✅ `scripts/cleanup-service-account-drive.js` - Clean up service account storage
- ✅ `scripts/test-template-access.js` - Test service account permissions

## ⚠️ Current Blocker

### Google API Permissions Error
**Error**: "The caller does not have permission"

**Issue**: Service account cannot create new spreadsheets. This occurs when:
1. Google Workspace domain restrictions prevent service account operations
2. Service account needs domain-wide delegation
3. OAuth scopes are insufficient

**Attempted Solutions**:
1. ✅ Created credentials file correctly
2. ✅ Granted service account access to master template
3. ✅ Changed from `drive.files.copy()` to `sheets.spreadsheets.create()` + sheet copying (to avoid quota issues)
4. ❌ Still getting permission errors on spreadsheet creation

**Next Steps**:
1. **Option A**: Enable domain-wide delegation for service account in Google Workspace Admin Console
   - Go to https://admin.google.com
   - Security → API Controls → Domain-wide Delegation
   - Add client ID with required scopes
   
2. **Option B**: Use OAuth 2.0 instead of service account
   - Each user authorizes the app to access their Drive
   - More secure, per-user permissions
   - Requires OAuth consent screen setup

3. **Option C**: Create spreadsheets in user's account using different service account
   - Set up a new service account with proper Workspace delegated authority
   - Or use a different Google Cloud project with appropriate permissions

## 📊 Test Results

### Successful Tests
- ✅ Service account can list files in its Drive
- ✅ Service account can read master template spreadsheet
- ✅ Service account has `canCopy: true` permission on template
- ✅ User registration creates database record
- ✅ Firebase user creation works
- ✅ JWT token generation works

### Failed Tests
- ❌ `drive.files.copy()` - "Drive storage quota exceeded" (even though only 0.21 MB used)
- ❌ `sheets.spreadsheets.create()` - "The caller does not have permission"

### Test Users Created
```
Email: shaun@siamoon.com
Spreadsheet ID: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8 ✅

Email: bob.builder@bookmate.com
Spreadsheet ID: null ❌
Status: Account created, spreadsheet provisioning failed
```

## 🔧 Technical Details

### Provisioning Flow (Current Implementation)
1. User registers → `POST /api/auth/register`
2. Create user in database (PostgreSQL)
3. Create user in Firebase Authentication
4. **Call `provisionUserSpreadsheet()`**:
   a. Create blank spreadsheet via Sheets API ← **FAILS HERE**
   b. Copy each sheet from master template
   c. Delete default "Sheet1"
   d. Transfer ownership to user
   e. Ensure service account retains access
5. Update user record with `spreadsheetId` and `spreadsheetUrl`
6. Return success with tokens

### Database Schema
```prisma
model User {
  // ... existing fields ...
  spreadsheetId        String?   @unique @map("spreadsheet_id")
  spreadsheetUrl       String?   @map("spreadsheet_url")
  spreadsheetCreatedAt DateTime? @map("spreadsheet_created_at")
  // ... existing fields ...
  @@index([spreadsheetId])
}
```

### Google API Scopes
```javascript
scopes: [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]
```

## 📝 Recommendations

### Immediate Action Required
**Set up domain-wide delegation** for the service account to allow it to create spreadsheets on behalf of users.

**Steps**:
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Find `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
3. Click "Enable Google Workspace Domain-wide Delegation"
4. Go to Google Workspace Admin Console → Security → API Controls
5. Add service account client ID with required scopes

### Alternative Approach (If delegation not possible)
Consider switching to **OAuth 2.0 user consent flow**:
- Each user authorizes BookMate to access their Google Drive
- Spreadsheets created directly in user's Drive (no service account needed)
- More aligned with Google's security best practices
- Requires OAuth consent screen approval

## 📂 Files Created/Modified

### New Files
- `config/google-credentials.json` (gitignored)
- `lib/services/spreadsheet-provisioning.ts`
- `lib/middleware/auth.ts`
- `scripts/share-master-template.ts`
- `scripts/cleanup-service-account-drive.js`
- `scripts/test-template-access.js`
- `scripts/delete-firebase-user.ts`
- `prisma/migrations/20251112094556_add_user_spreadsheet/`
- `MULTI_TENANT_SPREADSHEET_PLAN.md`
- `MULTI_TENANT_IMPLEMENTATION_PROGRESS.md`

### Modified Files
- `prisma/schema.prisma` - Added spreadsheet fields
- `app/api/auth/register/route.ts` - Integrated provisioning

## 🎯 Next Phase (Phase 2)

Once permissions are resolved and Phase 1 testing is complete:

1. **Update all API routes** to use `user.spreadsheetId`:
   - `app/api/pnl/**` - All P&L endpoints (~20 files)
   - `app/api/balance/**` - Balance endpoints (~10 files)
   - `app/api/categories/**` - Category management (~5 files)
   - `app/api/transfers/**` - Transfer operations (~5 files)
   - `app/api/debug/**` - Debug utilities (~7 files)

2. **Replace environment variable usage**:
   ```typescript
   // OLD
   const spreadsheetId = process.env.GOOGLE_SHEET_ID;
   
   // NEW
   const user = await getCurrentUser(request);
   const spreadsheetId = user.spreadsheetId;
   ```

3. **Add authentication middleware** to all protected routes

4. **Test multi-user data isolation**:
   - Create 2-3 test users
   - Verify each has unique spreadsheet
   - Verify API calls return correct user's data
   - Verify complete data isolation between users

## 📞 Contact
For questions or issues, contact Shaun (shaun@siamoon.com)

---
**Last Updated**: November 12, 2025
**Status**: Phase 1 - Blocked on Google API permissions
