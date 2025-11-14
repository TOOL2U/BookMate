# Apps Script Update Required

## Issue
New users are seeing data from the default spreadsheet instead of their own auto-provisioned spreadsheet.

## Root Cause
The Google Apps Script endpoints are hardcoded to use a specific spreadsheet ID. They don't accept a `spreadsheetId` parameter from the API requests.

## Solution Implemented (API Side)
All API routes now pass the user's `spreadsheetId` in their requests to Apps Script:

### Updated Routes:
1. **`/app/api/pnl/route.ts`** - P&L data endpoint
2. **`/app/api/pnl/overhead-expenses/route.ts`** - Overhead expenses endpoint
3. **`/app/api/pnl/property-person/route.ts`** - Property/person data endpoint
4. **`/app/api/inbox/route.ts`** - Inbox GET and DELETE endpoints

All routes now:
- Import `getSpreadsheetId` from `@/lib/middleware/auth`
- Call `const spreadsheetId = await getSpreadsheetId(request)` to get the user's spreadsheet
- Include `spreadsheetId` in the JSON body sent to Apps Script

## Required Apps Script Changes

### Current Apps Script Structure
The Apps Script currently uses a hardcoded spreadsheet ID:
```javascript
const SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8'; // hardcoded
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
```

### Required Changes
Update each Apps Script function to:
1. Accept `spreadsheetId` from the request payload
2. Use the provided `spreadsheetId` if available, fall back to default if not

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const secret = data.secret;
    const spreadsheetId = data.spreadsheetId || '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8'; // Use provided or default
    
    // Verify secret
    if (secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: 'Invalid secret' });
    }
    
    // Open the specified spreadsheet
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    // Rest of the function...
    switch (action) {
      case 'getInbox':
        return getInbox(ss);
      case 'deleteEntry':
        return deleteEntry(ss, data.rowNumber);
      case 'getPnL':
        return getPnL(ss);
      case 'getOverheadExpensesDetails':
        return getOverheadExpensesDetails(ss, data.period);
      case 'getPropertyPersonDetails':
        return getPropertyPersonDetails(ss, data.period);
      default:
        return jsonResponse({ ok: false, error: 'Invalid action' });
    }
  } catch (error) {
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

// Update each function to accept the spreadsheet object as parameter
function getInbox(ss) {
  const sheet = ss.getSheetByName('Inbox');
  // ... rest of logic
}

function getPnL(ss) {
  const sheet = ss.getSheetByName('P&L');
  // ... rest of logic
}

// etc...
```

## Actions Affected
These Apps Script actions now receive `spreadsheetId`:
1. **`getInbox`** - Fetch inbox entries
2. **`deleteEntry`** - Delete an inbox entry
3. **`getPnL`** - Fetch P&L data
4. **`getOverheadExpensesDetails`** - Fetch overhead expenses
5. **`getPropertyPersonDetails`** - Fetch property/person data

## Testing After Update
1. Login as a new user (with auto-provisioned spreadsheet)
2. Navigate to Dashboard - should show data from user's spreadsheet
3. Navigate to P&L page - should show user's P&L data
4. Check Inbox - should show user's inbox entries
5. Verify all data is from the user's spreadsheet, not the default one

## Default Spreadsheet IDs
- **Default Spreadsheet**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8` (original account)
- **Template Spreadsheet**: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU` (in Shared Drive)
- **Shared Drive**: `0ACHIGfT01vYxUk9PVA` (BookMate folder)

## Related Files
- `/lib/middleware/auth.ts` - Contains `getSpreadsheetId()` helper
- `/lib/auth/service.ts` - Handles user registration and spreadsheet auto-provisioning
- `/lib/services/spreadsheet-provisioning.ts` - Creates new user spreadsheets
