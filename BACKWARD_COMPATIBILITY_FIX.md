# Backward Compatibility Fix Complete

**Date:** November 13, 2025  
**Issue:** Settings page and category APIs failing with "No authorization token provided"  
**Root Cause:** Authentication was added recently, breaking existing functionality that relied on default `GOOGLE_SHEET_ID`

## Problem

After adding authentication system, the following APIs required JWT tokens:
- `/api/balance`
- `/api/categories/expenses`
- `/api/categories/properties`
- `/api/categories/payments`
- `/api/categories/revenues`
- `/api/categories/sync`

This broke the Settings page for existing users who were using the original account without authentication.

## Solution

Updated all affected API routes to use the new `getSpreadsheetId()` helper instead of `getUserSpreadsheetId()`.

### Changes Made

#### 1. Created `getSpreadsheetId()` helper in `/lib/middleware/auth.ts`

```typescript
/**
 * Get spreadsheet ID with backward compatibility
 * - First tries to get from authenticated user
 * - Falls back to default spreadsheet if no auth or user has no spreadsheet
 */
export async function getSpreadsheetId(request: NextRequest): Promise<string> {
  try {
    // Try to get user's spreadsheet (requires auth token)
    const spreadsheetId = await getUserSpreadsheetId(request);
    console.log(`📊 Using user's spreadsheet: ${spreadsheetId}`);
    return spreadsheetId;
  } catch (error: any) {
    // If no valid token or user doesn't have spreadsheet, use default
    if (DEFAULT_SHEET_ID) {
      console.log(`📊 Using default spreadsheet (no user auth or spreadsheet): ${DEFAULT_SHEET_ID}`);
      return DEFAULT_SHEET_ID;
    } else {
      throw new Error('No spreadsheet available. User has no spreadsheet and no default configured.');
    }
  }
}
```

#### 2. Updated API Routes

**Balance API** (`/app/api/balance/route.ts`):
- Changed import from `getUserSpreadsheetId` to `getSpreadsheetId`
- Updated function call: `await getSpreadsheetId(req)`

**Category APIs** (all in `/app/api/categories/*/route.ts`):
- `/api/categories/expenses` ✅
- `/api/categories/properties` ✅
- `/api/categories/payments` ✅
- `/api/categories/revenues` ✅
- `/api/categories/sync` ✅

## Testing Results

### Without Authentication (Default Spreadsheet)
```bash
GET /api/categories/expenses
Response: 35 expense categories from default spreadsheet
Log: 📊 Using default spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

GET /api/categories/properties
Response: 5 properties from default spreadsheet
Log: 📊 Using default spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

GET /api/categories/payments
Response: 6 payment types from default spreadsheet
Log: 📊 Using default spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

GET /api/categories/revenues
Response: 4 revenue categories from default spreadsheet
Log: 📊 Using default spreadsheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
```

### With Authentication (User Spreadsheet)
```bash
GET /api/categories/expenses (with Bearer token)
Response: 39 operations from user's spreadsheet
Log: 📊 Using user's spreadsheet: 186I3aw_AV2iuNt9UeSUluYEAwpjWN1jG0NnwWU7qDKQ
```

## Benefits

1. ✅ **Backward Compatible**: Existing users without auth can still use Settings page
2. ✅ **Forward Compatible**: New users with auth use their personal spreadsheets
3. ✅ **Graceful Degradation**: If user has no spreadsheet, falls back to default
4. ✅ **No Breaking Changes**: Original account continues to work as before

## Deployment Checklist

- [x] Update Balance API
- [x] Update all Category APIs
- [x] Test without authentication (original account)
- [x] Test with authentication (new users)
- [x] Verify Settings page works
- [ ] Deploy to production
- [ ] Add same env vars to Vercel:
  - `GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
  - `BOOKMATE_SHARED_DRIVE_ID=0ACHIGfT01vYxUk9PVA`

## Files Modified

- `/lib/middleware/auth.ts` - Added `getSpreadsheetId()` helper
- `/app/api/balance/route.ts` - Updated to use `getSpreadsheetId()`
- `/app/api/categories/expenses/route.ts` - Updated to use `getSpreadsheetId()`
- `/app/api/categories/properties/route.ts` - Updated to use `getSpreadsheetId()`
- `/app/api/categories/payments/route.ts` - Updated to use `getSpreadsheetId()`
- `/app/api/categories/revenues/route.ts` - Updated to use `getSpreadsheetId()`
- `/app/api/categories/sync/route.ts` - Updated to use `getSpreadsheetId()`

---

**Status:** ✅ COMPLETE  
**Ready for Production:** YES
