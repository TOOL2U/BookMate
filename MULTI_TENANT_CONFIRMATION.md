# Multi-Tenant Spreadsheet System - Configuration Confirmed ✅

## Current User Configuration

### Existing User: `shaun@siamoon.com`
- **Status**: ✅ Already configured with original spreadsheet
- **Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- **Spreadsheet URL**: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit
- **Behavior**: This user will continue using the **ORIGINAL** spreadsheet
- **Data**: All existing data remains untouched ✅

### New Users (Future Registrations)
- **Template Used**: Master Template Spreadsheet
- **Template ID**: `1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8`
- **Template URL**: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit
- **Behavior**: Each new user gets a **COPY** of the master template
- **Data Isolation**: Complete - each user has their own spreadsheet ✅

---

## How It Works

### For Existing User (`shaun@siamoon.com`)
```
1. User logs in with: shaun@siamoon.com
2. JWT token includes userId: 8241429b-c546-4bbb-9236-a76847abdab3
3. Database lookup finds spreadsheetId: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
4. API calls use THIS spreadsheet (original data)
5. ✅ Nothing changed - user sees their existing data
```

### For New Users
```
1. User registers (e.g., john@example.com)
2. Registration redirects to OAuth flow
3. User authorizes Google Sheets access
4. System creates NEW spreadsheet by copying master template:
   - Creates blank spreadsheet: "BookMate - John Doe"
   - Copies all sheets from master template (1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8)
   - Removes default Sheet1
5. New spreadsheet ID stored in database
6. User lands on dashboard with EMPTY spreadsheet (template structure only)
7. ✅ Complete data isolation from other users
```

---

## Database State

### Users Without Spreadsheets (Need OAuth)
- `shaun@bookmate.com` - No spreadsheet ❌
- `test2@bookmate.com` - No spreadsheet ❌
- `bob.builder@bookmate.com` - No spreadsheet ❌

**Action Required**: These users need to:
1. Logout (if logged in)
2. Login again
3. Complete OAuth authorization
4. Spreadsheet will be auto-provisioned from master template

### Users With Spreadsheets (Ready to Use)
- `shaun@siamoon.com` - Using original spreadsheet ✅

---

## API Behavior

### Before Phase 2 (Single-Tenant)
```typescript
// ALL users shared ONE spreadsheet
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
// = "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
```

### After Phase 2 (Multi-Tenant)
```typescript
// Each user gets THEIR spreadsheet
const spreadsheetId = await getUserSpreadsheetId(request);

// For shaun@siamoon.com:
// = "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8" (original)

// For new user john@example.com:
// = "1ABC123xyz..." (new copy of master template)
```

---

## Master Template Structure

The master template (`1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8`) contains:
- All sheet tabs (Inbox, Data, P&L, Balance Summary, etc.)
- All formulas and formatting
- **NO user data** - just structure

When a new user registers:
1. System creates a copy of this template
2. New spreadsheet lives in user's Google Drive
3. User owns the spreadsheet (can share, edit, delete)
4. BookMate app accesses it using user's OAuth tokens

---

## Security & Access

### Original Spreadsheet (shaun@siamoon.com)
- Owner: shaunducker1@gmail.com
- Access: Via service account OR OAuth tokens
- Used by: Only shaun@siamoon.com user

### New User Spreadsheets
- Owner: The user who registered (e.g., john@example.com)
- Access: Via user's OAuth tokens ONLY
- Used by: Only that specific user
- Privacy: Complete isolation - no user can see another's data

---

## Environment Variables

```bash
# Master template (for new users)
MASTER_SPREADSHEET_ID=1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8

# Legacy/fallback (kept for backward compatibility)
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# OAuth credentials (for user authorization)
GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
```

---

## Summary

✅ **Existing user (`shaun@siamoon.com`)**: Uses original spreadsheet - NO CHANGES
✅ **New users**: Get copy of master template - COMPLETE ISOLATION
✅ **Data safety**: Original data untouched, new users start fresh
✅ **Multi-tenant**: Each user has their own spreadsheet
✅ **OAuth flow**: Seamless authorization and auto-provisioning

**No existing functionality broken - system enhanced for scalability!**
