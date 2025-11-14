# Phase 2-3: Connection Test - Quick Reference

## Visual Guide

### Account Detail Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Account Details                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Account Information - Read Only]                      │
│   Account ID: acc_abc123                               │
│   Created: Jan 1, 2025                                 │
│   Status: Active                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Edit Account Form]                                    │
│   Company Name: [___________]                          │
│   User Email:   [___________]                          │
│   Sheet ID:     [___________]                          │
│   Script URL:   [___________]                          │
│   Script Secret:[___________]                          │
│                                                         │
│   [Cancel]  [Save Changes]                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⚡ Connection Test                                      │
│                                                         │
│ Verify the Apps Script endpoint is reachable and       │
│ configured correctly                                    │
│                                                         │
│                          [Test Connection] ← NEW!      │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ ✓ Connection Successful                          │  │
│ │ Connection successful! Apps Script accepted      │  │
│ │ the test transaction.                            │  │
│ │ Tested at Jan 1, 2025, 2:35 PM                   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ What this test does:                                   │
│ • Sends a test transaction to the Apps Script         │
│ • Verifies the script URL is reachable                │
│ • Confirms the script secret is correct               │
│ • Checks that the Apps Script is properly deployed    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Apps Script Template Generator]                       │
│ ...                                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Test Button States

### 1. Default State
```
┌──────────────────────┐
│  Test Connection     │
└──────────────────────┘
```

### 2. Testing State
```
┌──────────────────────┐
│  ⟳ Testing...        │ (spinner animation)
└──────────────────────┘
```

### 3. Success Result
```
┌─────────────────────────────────────────────────┐
│ ✓ Connection Successful                        │
│ Connection successful! Apps Script accepted    │
│ the test transaction.                          │
│ Tested at Jan 1, 2025, 2:35 PM                 │
└─────────────────────────────────────────────────┘
```

### 4. Error Result
```
┌─────────────────────────────────────────────────┐
│ ✗ Connection Failed                            │
│ Unauthorized - Script secret may be incorrect  │
│ Tested at Jan 1, 2025, 2:35 PM                 │
└─────────────────────────────────────────────────┘
```

## Common Error Messages

| Error Type | Message | Likely Cause |
|------------|---------|--------------|
| **Unauthorized** | "Unauthorized - Script secret may be incorrect" | scriptSecret doesn't match Apps Script EXPECTED_SECRET |
| **Timeout** | "Connection timeout (Apps Script did not respond within 10 seconds)" | Apps Script not deployed or URL unreachable |
| **Network Error** | "Network error: getaddrinfo ENOTFOUND" | Invalid scriptUrl or DNS issue |
| **HTTP 404** | "HTTP 404: Not Found" | Apps Script not deployed at that URL |
| **HTTP 500** | "HTTP 500: Internal Server Error" | Apps Script code error |
| **Invalid JSON** | "Apps Script returned invalid JSON" | Apps Script not returning proper response |

## Test Flow Diagram

```
Admin clicks "Test Connection"
         ↓
Button shows "Testing..."
         ↓
Server action called
         ↓
Fetch account from Firestore
         ↓
Validate scriptUrl & scriptSecret
         ↓
Construct test payload
         ↓
POST to Apps Script
         ├─→ Network Error → Show error alert
         ├─→ Timeout → Show timeout alert
         ├─→ HTTP Error → Show HTTP error alert
         ├─→ Invalid JSON → Show JSON error alert
         └─→ Success
                ↓
         Parse response body
                ↓
         Check success field
                ├─→ false → Show script error alert
                └─→ true → Show success alert
                         ↓
                   Update Firestore
                         ↓
                   Return to client
```

## Apps Script Test Mode Handling

```javascript
function doPost(e) {
  // ... parse payload ...
  
  // Check secret
  if (incomingSecret !== EXPECTED_SECRET) {
    return createErrorResponse('Unauthorized');
  }
  
  // ✨ NEW: Handle test mode
  if (payload.testMode === true) {
    Logger.log('→ Test mode detected - returning success');
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Test successful' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... normal request handling ...
}
```

## API Reference

### Server Action

```typescript
testConnectionAction(accountId: string): Promise<{
  ok: boolean;
  status?: number;
  body?: any;
  errorMessage?: string;
  timestamp: string;
}>
```

### Test Payload

```typescript
{
  secret: string;           // Account's scriptSecret
  testMode: true;          // Signals test mode
  date: string;            // YYYY-MM-DD format
  description: string;     // "BookMate connection test"
  amount: number;          // 0
  category: string;        // "TEST"
  source: string;          // "admin_connection_test"
}
```

### Apps Script Response (Success)

```json
{
  "success": true,
  "message": "Test successful"
}
```

### Apps Script Response (Error)

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Firestore Updates

After each test, these fields are updated:

```typescript
{
  lastConnectionTestAt: "2025-01-01T14:35:22.123Z",
  lastConnectionTestStatus: "success" | "error",
  lastConnectionTestMessage: "Connection successful" | "Error message"
}
```

## Usage Examples

### Example 1: First Time Testing

```
1. Admin creates new account
2. Enters scriptUrl and scriptSecret
3. Saves account
4. Clicks "Test Connection"
5. Sees: "No connection tests have been run yet"
6. Test runs, success appears
7. Refreshes page
8. Sees: "Last Test: Success at [timestamp]"
```

### Example 2: Fixing Configuration

```
1. Admin sees "Last Test: Failed - Unauthorized"
2. Edits scriptSecret field
3. Sees warning: "Script Secret Changed!"
4. Copies new Apps Script code
5. Updates Apps Script deployment
6. Clicks "Test Connection"
7. Sees: "Connection Successful"
8. Clicks "Save Changes" to persist
```

### Example 3: Troubleshooting

```
1. Test fails with "Timeout"
2. Admin checks scriptUrl in browser
3. Gets 404 error
4. Realizes Apps Script not deployed
5. Deploys Apps Script
6. Updates scriptUrl
7. Tests again
8. Success!
```

## Admin Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. Create/Edit Account                         │
│    - Enter company name, email, sheet ID       │
│    - Enter script URL and secret               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Test Connection                             │
│    - Click "Test Connection" button            │
│    - Wait for result                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Fix Issues (if any)                         │
│    - Update URL/secret if unauthorized         │
│    - Deploy Apps Script if 404                 │
│    - Check network if timeout                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Retest Until Success                        │
│    - Test again after fixes                    │
│    - Repeat until green checkmark              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. Save Changes                                │
│    - Click "Save Changes" button               │
│    - Account ready for use                     │
└─────────────────────────────────────────────────┘
```

## Quick Troubleshooting

| See This | Check This | Fix This |
|----------|------------|----------|
| "Script URL is not configured" | scriptUrl field | Add valid URL |
| "Script Secret is not configured" | scriptSecret field | Add secret (min 10 chars) |
| "Unauthorized" | EXPECTED_SECRET in Apps Script | Update to match or vice versa |
| "Timeout" | Apps Script deployment | Deploy as web app |
| "Network error" | scriptUrl validity | Copy correct URL from deployment |
| "Invalid JSON" | Apps Script code | Check for syntax errors |
| "HTTP 404" | Deployment status | Redeploy Apps Script |

---

**Quick Start:**
1. Navigate to `/admin/accounts/[id]`
2. Scroll to "Connection Test" section
3. Click "Test Connection"
4. See result instantly
5. Fix issues if needed
6. Test again

**That's it!** 🎉
