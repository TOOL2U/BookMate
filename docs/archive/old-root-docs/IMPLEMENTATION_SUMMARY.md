# Implementation Complete - New User Spreadsheet Creation

## ✅ What Has Been Implemented

### 1. Updated Spreadsheet Provisioning Service
**File**: `/lib/services/spreadsheet-provisioning.ts`

**Changes**:
- Updated `MASTER_TEMPLATE_ID` to new template: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
- Added `SHARED_DRIVE_ID` from environment variable: `BOOKMATE_SHARED_DRIVE_ID`
- Updated `provisionUserSpreadsheetAuto()` to:
  - Copy template INTO Shared Drive (using `parents: [SHARED_DRIVE_ID]`)
  - Use `supportsAllDrives: true` for all Drive API calls
  - Share copied spreadsheet with user as `writer` (not owner)
  - Proper error handling and logging

### 2. User Registration Flow
**File**: `/lib/auth/service.ts`

**Changes**:
- Automatically calls `provisionUserSpreadsheetAuto()` after user creation
- Stores `spreadsheetId`, `spreadsheetUrl`, and `spreadsheetCreatedAt` in database
- Handles errors gracefully (user registration succeeds even if spreadsheet creation fails)
- Logs all spreadsheet creation events

### 3. Database Integration
**Already implemented**:
- User model has fields: `spreadsheetId`, `spreadsheetUrl`, `spreadsheetCreatedAt`
- These are populated automatically on successful spreadsheet creation
- Can be used by P&L endpoints to fetch user-specific spreadsheets

## 🔐 Environment Variables Required

### Local Development (`.env.local`)
```bash
# Existing
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# NEW - Required
BOOKMATE_SHARED_DRIVE_ID=<SHARED_DRIVE_ID_HERE>
```

### Production (Vercel)
```bash
# Already set
GOOGLE_SERVICE_ACCOUNT_KEY=<service account JSON>

# NEW - Need to add
vercel env add BOOKMATE_SHARED_DRIVE_ID production
```

## ⚙️ How It Works

### User Signup Flow:
1. User registers via `/api/auth/register`
2. User record created in database
3. `provisionUserSpreadsheetAuto()` called automatically:
   - Service account authenticates with Google
   - Copies template from Shared Drive
   - New file created IN the same Shared Drive
   - File shared with user's email as writer
4. Database updated with `spreadsheetId` and `spreadsheetUrl`
5. User receives email with link to their personal spreadsheet

### Template Copy Process:
```typescript
// 1. Authenticate as service account
const auth = getServiceAccountAuth();
const drive = google.drive({ version: 'v3', auth });

// 2. Copy template INTO Shared Drive
const copyResponse = await drive.files.copy({
  fileId: TEMPLATE_ID,
  requestBody: {
    name: `BookMate P&L – ${userName}`,
    parents: [SHARED_DRIVE_ID], // Crucial!
  },
  supportsAllDrives: true,
});

// 3. Share with user as writer
await drive.permissions.create({
  fileId: newSpreadsheetId,
  requestBody: {
    type: 'user',
    role: 'writer',
    emailAddress: userEmail,
  },
  supportsAllDrives: true,
});
```

## 📋 What PM Needs to Complete

### Required Setup (Not Yet Done):

1. **Add service account to Shared Drive**:
   - Service account: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
   - Role: Manager or Content Manager
   - See: `SHARED_DRIVE_SETUP_REQUIRED.md`

2. **Provide Shared Drive ID**:
   - Can be found in Drive URL or by running `node list-shared-drives.mjs` after step 1
   - Add to `.env.local` as `BOOKMATE_SHARED_DRIVE_ID`
   - Add to Vercel environment variables

3. **Verify template location**:
   - Template ID: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
   - Must be INSIDE the Shared Drive
   - Service account must have access to it

## 🧪 Testing

### After PM completes setup:

```bash
# 1. Verify service account can see Shared Drive
node list-shared-drives.mjs

# 2. Test template copy
node test-template-copy.mjs

# 3. Test user registration with spreadsheet creation
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 4. Verify user has spreadsheetId
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## ✅ Acceptance Criteria (From PM)

- [x] Backend uses service account to copy template `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
- [x] Copied file created inside Shared Drive (using `BOOKMATE_SHARED_DRIVE_ID`)
- [x] New file named: `BookMate P&L – <UserName>`
- [x] After copying, file shared with user as `writer`
- [x] User NOT made owner (Google cross-org restriction respected)
- [x] `spreadsheetId` and `spreadsheetName` saved to DB
- [x] Error handling implemented with logging
- [ ] **BLOCKED**: PM must add service account to Shared Drive
- [ ] **BLOCKED**: PM must provide `BOOKMATE_SHARED_DRIVE_ID` env variable

## 📁 Files Modified

1. `/lib/services/spreadsheet-provisioning.ts` - Main implementation
2. `/lib/auth/service.ts` - Integrated into registration flow
3. Test scripts created:
   - `list-shared-drives.mjs` - Find Shared Drive ID
   - `test-template-copy.mjs` - Test copying
   - `test-service-account.mjs` - Test auth

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] PM completes Shared Drive setup
- [ ] `BOOKMATE_SHARED_DRIVE_ID` added to `.env.local`
- [ ] Test locally with new user registration
- [ ] Verify spreadsheet created and user has access
- [ ] Add `BOOKMATE_SHARED_DRIVE_ID` to Vercel production environment
- [ ] Deploy to production
- [ ] Test production registration
- [ ] Monitor logs for any errors

## 📞 Next Steps

**Immediate**: PM needs to complete Shared Drive setup (see `SHARED_DRIVE_SETUP_REQUIRED.md`)

**After PM setup**: Run tests to verify everything works

**Then**: Deploy to production with new environment variable

---

**Implementation Status**: ✅ Code Complete, ⏳ Awaiting PM Setup
