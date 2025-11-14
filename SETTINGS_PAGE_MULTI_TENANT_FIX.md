# Settings Page Multi-Tenant Data Isolation Fix

## Issue
Maria (@siamoon.com) was seeing Shaun's data in the Settings page Property Management section when logged into her account.

## Root Cause
The category management endpoints were using `process.env.GOOGLE_SHEET_ID` (a global environment variable pointing to Shaun's sheet) instead of the user-specific `account.sheetId` from Firestore.

## Files Fixed

### 1. `/app/api/categories/properties/route.ts` ✅
- **Changes:**
  - Added import: `getAccountFromSession, NoAccountError, NotAuthenticatedError`
  - GET handler: Added account session retrieval with authentication check
  - GET handler: Changed `process.env.GOOGLE_SHEET_ID` → `account.sheetId`
  - POST handler: Added account session retrieval with authentication check
  - POST handler: Changed to use `account.sheetId`
  - Added logging: `[PROPERTIES] Using/Updating properties for: ${account.companyName}`

### 2. `/app/api/categories/expenses/route.ts` ✅
- **Changes:**
  - Added import: `getAccountFromSession, NoAccountError, NotAuthenticatedError`
  - GET handler: Added account session retrieval with authentication check
  - GET handler: Changed `process.env.GOOGLE_SHEET_ID` → `account.sheetId`
  - POST handler: Added account session retrieval with authentication check
  - POST handler: Changed to use `account.sheetId`
  - Added logging: `[EXPENSES] Using/Updating expenses for: ${account.companyName}`

### 3. `/app/api/categories/revenues/route.ts` ✅
- **Changes:**
  - Added import: `getAccountFromSession, NoAccountError, NotAuthenticatedError`
  - Removed global constant: `GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!`
  - GET handler: Added account session retrieval with authentication check
  - GET handler: Changed to use `account.sheetId` (local variable)
  - POST handler: Added account session retrieval with authentication check
  - POST handler: Changed all `GOOGLE_SHEET_ID` references to `spreadsheetId` (account.sheetId)
  - Added logging: `[REVENUES] Using/Updating revenues for: ${account.companyName}`

### 4. `/app/api/categories/payments/route.ts` ✅
- **Changes:**
  - Added import: `getAccountFromSession, NoAccountError, NotAuthenticatedError`
  - GET handler: Added account session retrieval with authentication check
  - GET handler: Changed `process.env.GOOGLE_SHEET_ID` → `account.sheetId`
  - POST handler: Added account session retrieval with authentication check
  - POST handler: Changed to use `account.sheetId`
  - Added logging: `[PAYMENTS] Using/Updating payments for: ${account.companyName}`
  - Removed duplicate error check

## Pattern Applied

Each endpoint now follows this pattern:

```typescript
// 1. Import account helper at top of file
import { getAccountFromSession, NoAccountError, NotAuthenticatedError } from '@/lib/api/account-helper';

// 2. In each handler function (GET, POST):
async function handler(request: NextRequest) {
  try {
    // Get account-specific configuration
    const account = await getAccountFromSession();
    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[ENDPOINT] Using sheet for: ${account.companyName}`);
    
    // Use account.sheetId instead of process.env.GOOGLE_SHEET_ID
    const spreadsheetId = account.sheetId;
    
    if (!spreadsheetId) {
      throw new Error('Sheet ID not configured for this account');
    }
    
    // Continue with Google Sheets API calls using spreadsheetId...
  } catch (error) {
    // Error handling...
  }
}
```

## Result
✅ **All Settings page category endpoints now use account-specific data**

Each user will now see and manage only their own:
- Properties (Data!C2:C)
- Expenses (Data!B2:B)
- Revenues (Data!A2:A)
- Payment Types (Data!D2:D)

## Testing Checklist
When logged in as maria@siamoon.com:
- [ ] Settings > Property Management shows empty or Maria's properties (not Shaun's)
- [ ] Adding a property saves to Maria's sheet
- [ ] Expense categories show Maria's data
- [ ] Revenue items show Maria's data
- [ ] Payment types show Maria's data

When logged in as shaun@siamoon.com:
- [ ] Settings page shows Shaun's existing data
- [ ] All categories remain functional

## Related Files
- `/lib/api/account-helper.ts` - Contains `getAccountFromSession()` function
- Firestore `accounts` collection - Stores `sheetId` per account
- `/app/api/pnl/property-person/route.ts` - Previously fixed (uses account.scriptUrl)
- `/app/api/pnl/overhead-expenses/route.ts` - Previously fixed (uses account.scriptUrl)

## Date Fixed
January 2025

## Next Steps
Consider creating a middleware or wrapper function to DRY up the account session retrieval pattern, as it's now used across multiple endpoints.
