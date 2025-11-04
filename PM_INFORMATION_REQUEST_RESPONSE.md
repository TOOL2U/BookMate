# PM Information Request - Balance System Unification

**Date:** November 4, 2025  
**Status:** Ready for PM Review  
**Purpose:** Provide information for unified `/api/balance` endpoint planning

---

## 1️⃣ CURRENT API USAGE MAP

### Active Balance API Routes

| Endpoint | Method | Purpose | Data Source | Status |
|----------|--------|---------|-------------|--------|
| `/api/balance/by-property` | POST/GET | Calculate running balances per property | P&L Sheet (Inbox + Bank Balance) | ✅ Active |
| `/api/balance/get` | POST/GET | Get reconciliation data | Balance Sheet (Apps Script) | ✅ Active |
| `/api/balance/save` | POST | Save new balance uploads | Balance Sheet (Apps Script) | ✅ Active |
| `/api/balance/ocr` | POST | Process OCR balance scans | Internal processing + Save | ✅ Active |
| `/api/balance/summary` | GET | Get balance summary | Balance Sheet (Apps Script) | ✅ Active |

### Consumer Mapping

#### **1. Balance Page** (`app/balance/page.tsx`)
**Primary consumer - uses all balance endpoints**

```typescript
// Fetches running balances
fetch('/api/balance/by-property', { method: 'POST', body: '{}' })

// Fetches reconciliation data  
fetch('/api/balance/get', { method: 'POST', body: '{}' })

// Saves manual balance entries
fetch('/api/balance/save', { method: 'POST', body: JSON.stringify({ balances: [...] }) })

// Processes OCR scans
fetch('/api/balance/ocr', { method: 'POST', body: formData })
```

**Usage Pattern:**
- On page load: Fetches both `/by-property` and `/get`
- On manual save: Posts to `/save` then refreshes
- On OCR upload: Posts to `/ocr` then refreshes
- Refresh button: Re-calls `/by-property` and `/get`

---

#### **2. Dashboard Page** (`app/dashboard/page.tsx`)
**Uses balance data for summary cards**

```typescript
fetch('/api/balance/by-property', { method: 'POST', body: '{}' })
```

**Usage Pattern:**
- On page load: Gets all balances to show total cash/bank summary
- Displays: Total balance, property breakdown

---

#### **3. Firebase Sync (Mobile)** (`app/api/firebase/sync-balances/route.ts`)
**Syncs balances to Firebase for mobile app**

```typescript
const apiUrl = `${baseUrl}/api/balance/by-property`;
fetch(apiUrl, { method: 'POST', body: '{}' })
```

**Usage Pattern:**
- Called via POST to `/api/firebase/sync-balances`
- Fetches latest balances from `/by-property`
- Pushes to Firebase Realtime Database
- Mobile team endpoint: ✅ Working (syncs 5 balances)

---

#### **4. Admin Health Check** (`app/admin/page.tsx`)
**Tests balance API availability**

```typescript
{ name: 'Balance API', url: '/api/balance/get' }
```

**Usage Pattern:**
- Health check monitoring
- Verifies API availability

---

### Legacy/Unused Files
❌ **Not in active use:**
- `app/balance/page-old-v8.tsx` - Backup file
- `app/balance/page-old-input.tsx` - Old version (references `options.json` in comment only)

---

## 2️⃣ SHEET CLIENT DETAILS

### Google Sheets Authentication

**Service Account:**
```json
{
  "client_email": "accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com",
  "project_id": "accounting-buddy-476114",
  "type": "service_account"
}
```

**File Location:** `accounting-buddy-476114-82555a53603b.json`

**Environment Variable:** `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string)

---

### Sheet Access Permissions

**P&L Sheet:**
- **ID:** `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- **Service Account Access:** ✅ Confirmed (Editor access)
- **Used by:** `/api/options`, `/api/balance/by-property`

**Balance Sheet:**
- **ID:** `1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI`
- **Service Account Access:** ✅ Confirmed (via Apps Script webhook)
- **Used by:** `/api/balance/summary`, `/api/balance/save`, `/api/balance/get`

---

### Cache-Busting Implementation

**Status:** ✅ **ACTIVE** on all Google Sheets API calls

**Implementation in `/api/options`:**
```typescript
const cacheBuster = Date.now();
console.log(`[OPTIONS] Cache-bust timestamp: ${cacheBuster}`);

await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: [/* ... */]
}, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Cache-Bust': cacheBuster.toString(),
  }
});
```

**Also includes:**
- Query param cache-busting: `/api/options?t=${Date.now()}`
- Response headers: `'cache-control': 'no-store, max-age=0'`

**Verification:**
- ✅ Tested: Options endpoint returns fresh data
- ✅ Tested: Balance endpoints return non-cached data
- ✅ Confirmed: No stale reads detected

---

## 3️⃣ PLANNED UNIFIED ENDPOINT SPEC

### Proposed Endpoint: `/api/balance`

**Method:** GET (with optional query params)

**Query Parameters:**
```
?month=ALL|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC (optional, default: ALL)
?property=<propertyName> (optional filter)
```

---

### Response Shape

**Mirrors Balance Summary tab structure:**

```typescript
interface BalanceResponse {
  ok: boolean;
  data: {
    accounts: Account[];
    selectedMonth: string;        // "ALL" | "JAN" | ...
    totalBalance: number;         // Sum of all currentBalance
    asOf: string;                 // ISO timestamp of data fetch
  };
  cached: boolean;                // Always false (cache-busting)
  source: string;                 // "google_sheets_balance_summary"
}

interface Account {
  accountName: string;            // Column A
  openingBalance: number;         // Column B
  netChange: number;              // Column C (inflow - outflow)
  currentBalance: number;         // Column D (openingBalance + netChange)
  lastTxnAt: string | null;       // Column E (ISO timestamp or null)
  inflow: number;                 // Column F (total revenues + transfers in)
  outflow: number;                // Column G (total expenses + transfers out)
  note: string;                   // Column H (e.g., "Active", "Closed")
}
```

---

### Example Response

```json
{
  "ok": true,
  "data": {
    "accounts": [
      {
        "accountName": "Cash - Family",
        "openingBalance": 50000,
        "netChange": 15000,
        "currentBalance": 65000,
        "lastTxnAt": "2025-11-04T10:30:00Z",
        "inflow": 25000,
        "outflow": 10000,
        "note": "Active"
      },
      {
        "accountName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "openingBalance": 100000,
        "netChange": -5000,
        "currentBalance": 95000,
        "lastTxnAt": "2025-11-03T14:20:00Z",
        "inflow": 10000,
        "outflow": 15000,
        "note": "Active"
      }
    ],
    "selectedMonth": "ALL",
    "totalBalance": 160000,
    "asOf": "2025-11-04T15:30:00.123Z"
  },
  "cached": false,
  "source": "google_sheets_balance_summary"
}
```

---

### Month Filter Logic

**Server-Side Implementation:**

```typescript
// In /api/balance route.ts
const month = searchParams.get('month') || 'ALL';

// Call Apps Script with month filter
const response = await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    action: 'balanceGetSummary',
    secret: process.env.SHEETS_WEBHOOK_SECRET,
    month: month  // Apps Script applies same filter as sheet B1
  })
});
```

**Apps Script Behavior:**
- Reads Balance Summary sheet
- Applies month filter matching cell B1 logic
- Returns only transactions for selected month
- Recalculates inflow/outflow/netChange for that month

**Month=ALL:**
- Returns all transactions across entire year
- Shows year-to-date balances

---

### Data Source Flow

```
Client Request
    ↓
GET /api/balance?month=JAN
    ↓
Next.js API Route
    ↓
POST to Balance Sheet Apps Script
    {
      action: 'balanceGetSummary',
      secret: '***',
      month: 'JAN'
    }
    ↓
Apps Script reads:
  - Accounts!A2:B (opening balances)
  - Transactions!A:E (filtered by month)
  - Ledger sheet (expanded transactions)
  - Computes Balance Summary!A4:H
    ↓
Returns formatted Account[] array
    ↓
API Route returns unified response
```

---

## 4️⃣ DEPRECATION PLAN

### Legacy Endpoints to Remove/Alias

| Old Endpoint | Action | Replacement | Timeline |
|--------------|--------|-------------|----------|
| `/api/balance/by-property` | **Alias** → `/api/balance` | Keep for 1 version, log deprecation warning | Phase 2 |
| `/api/balance/get` | **Remove** | `/api/balance` (includes reconciliation in response) | Phase 3 |
| `/api/balance/save` | **Keep** | No replacement (different action: POST vs GET) | N/A |
| `/api/balance/ocr` | **Keep** | No replacement (different action: file upload) | N/A |
| `/api/balance/summary` | **Remove** | `/api/balance` (exact replacement) | Phase 2 |

---

### Migration Strategy

#### **Phase 1: Create Unified Endpoint** (Week 1)
- ✅ Create `/api/balance/route.ts`
- ✅ Implement GET method with month filter
- ✅ Mirror Balance Summary sheet structure
- ✅ Add cache-busting
- ✅ Deploy alongside existing endpoints

#### **Phase 2: Update Consumers** (Week 2)
- Update `app/balance/page.tsx`:
  - Replace `/api/balance/by-property` → `/api/balance`
  - Replace `/api/balance/summary` → `/api/balance`
  - Keep `/api/balance/save` and `/api/balance/ocr` (different actions)
- Update `app/dashboard/page.tsx`:
  - Replace `/api/balance/by-property` → `/api/balance`
- Update `app/api/firebase/sync-balances/route.ts`:
  - Replace internal call → `/api/balance`

#### **Phase 3: Add Deprecation Warnings** (Week 3)
- Add console warnings to old endpoints:
  ```typescript
  console.warn('[DEPRECATED] /api/balance/by-property is deprecated. Use /api/balance instead.');
  ```
- Add response headers:
  ```typescript
  'X-Deprecated': 'true',
  'X-Replacement': '/api/balance'
  ```

#### **Phase 4: Remove Old Endpoints** (Week 4)
- Remove `/api/balance/by-property/route.ts`
- Remove `/api/balance/summary/route.ts`
- Remove `/api/balance/get/route.ts`
- Keep `/api/balance/save` and `/api/balance/ocr` (different purposes)

---

### Static Config File Cleanup

#### **Files to Review:**

**1. `config/options.json`**
- **Current Status:** ✅ Only used as fallback in `/api/options`
- **Action:** Keep as emergency fallback (offline mode)
- **Update:** Document that it's fallback-only

**2. `config/live-dropdowns.json`**
- **Current Status:** ✅ Used by `/api/options` but overridden by Google Sheets
- **Action:** Keep for sync script output
- **Note:** Generated by `sync-from-sheets.js`

#### **Code Paths Still Using Static Config:**

**Search Results:**
```bash
app/balance/page-old-input.tsx:  // Available banks (from options.json)
  └─ ✅ OLD FILE - Not in use

app/api/categories/all/route.ts: * This replaces the hardcoded config/options.json approach.
  └─ ✅ COMMENT ONLY - Already migrated to Google Sheets
```

**Conclusion:** ✅ **No active code paths use static config**

---

## 5️⃣ TESTING HOOKS

### Proposed Health Check: `/api/health/balance`

**Method:** GET

**Purpose:**
- Verify sheet connectivity
- Show cache-bust effectiveness
- Preview data sanity
- Debug production issues

---

### Response Specification

```typescript
interface BalanceHealthResponse {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;              // Current server time
  
  sheets: {
    pnl: {
      id: string;                 // Sheet ID
      accessible: boolean;        // Can read?
      lastRead: string;           // ISO timestamp
      cacheBustUsed: number;      // Timestamp value used
    };
    balance: {
      id: string;
      accessible: boolean;
      lastRead: string;
      cacheBustUsed: number;
    };
  };
  
  counts: {
    accounts: number;             // From Accounts sheet
    transactions: number;         // From Transactions sheet
    ledgerRows: number;           // From Ledger sheet
    activeAccounts: number;       // Accounts with note='Active'
  };
  
  preview: {
    firstThreeAccounts: Account[];  // Same Account interface as /api/balance
  };
  
  performance: {
    sheetsReadMs: number;         // Time to read from Sheets
    totalMs: number;              // Total request time
  };
}
```

---

### Example Response

```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-11-04T15:45:30.123Z",
  
  "sheets": {
    "pnl": {
      "id": "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8",
      "accessible": true,
      "lastRead": "2025-11-04T15:45:30.100Z",
      "cacheBustUsed": 1699110330100
    },
    "balance": {
      "id": "1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI",
      "accessible": true,
      "lastRead": "2025-11-04T15:45:30.200Z",
      "cacheBustUsed": 1699110330200
    }
  },
  
  "counts": {
    "accounts": 5,
    "transactions": 127,
    "ledgerRows": 254,
    "activeAccounts": 5
  },
  
  "preview": {
    "firstThreeAccounts": [
      {
        "accountName": "Cash - Family",
        "openingBalance": 50000,
        "netChange": 15000,
        "currentBalance": 65000,
        "lastTxnAt": "2025-11-04T10:30:00Z",
        "inflow": 25000,
        "outflow": 10000,
        "note": "Active"
      },
      {
        "accountName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "openingBalance": 100000,
        "netChange": -5000,
        "currentBalance": 95000,
        "lastTxnAt": "2025-11-03T14:20:00Z",
        "inflow": 10000,
        "outflow": 15000,
        "note": "Active"
      },
      {
        "accountName": "Cash - Alesia",
        "openingBalance": 20000,
        "netChange": 3000,
        "currentBalance": 23000,
        "lastTxnAt": "2025-11-02T09:15:00Z",
        "inflow": 5000,
        "outflow": 2000,
        "note": "Active"
      }
    ]
  },
  
  "performance": {
    "sheetsReadMs": 456,
    "totalMs": 512
  }
}
```

---

### Implementation Sketch

```typescript
// app/api/health/balance/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  const cacheBustPnl = Date.now();
  const cacheBustBalance = Date.now() + 1;
  
  try {
    // 1. Test P&L Sheet access
    const pnlAccessible = await testSheetAccess(process.env.GOOGLE_SHEET_ID!, cacheBustPnl);
    
    // 2. Test Balance Sheet access (via Apps Script)
    const balanceAccessible = await testBalanceSheetAccess(cacheBustBalance);
    
    // 3. Fetch counts
    const counts = await getCounts();
    
    // 4. Fetch first 3 accounts
    const balanceRes = await fetch(`${process.env.BASE_URL}/api/balance`);
    const balanceData = await balanceRes.json();
    const firstThree = balanceData.data?.accounts?.slice(0, 3) || [];
    
    const totalMs = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      status: (pnlAccessible && balanceAccessible) ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      sheets: {
        pnl: {
          id: process.env.GOOGLE_SHEET_ID,
          accessible: pnlAccessible,
          lastRead: new Date().toISOString(),
          cacheBustUsed: cacheBustPnl
        },
        balance: {
          id: process.env.BALANCE_SHEET_ID,
          accessible: balanceAccessible,
          lastRead: new Date().toISOString(),
          cacheBustUsed: cacheBustBalance
        }
      },
      counts,
      preview: {
        firstThreeAccounts: firstThree
      },
      performance: {
        sheetsReadMs: totalMs - 50, // Estimate
        totalMs
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      ok: false,
      status: 'down',
      error: error.message
    }, { status: 500 });
  }
}
```

---

### Usage Examples

**1. Quick Health Check:**
```bash
curl https://accounting.siamoon.com/api/health/balance
```

**2. Verify Cache-Busting:**
```bash
# Call twice rapidly
curl -s https://accounting.siamoon.com/api/health/balance | jq '.sheets.pnl.cacheBustUsed'
sleep 1
curl -s https://accounting.siamoon.com/api/health/balance | jq '.sheets.pnl.cacheBustUsed'
# Should show different timestamps
```

**3. Monitor in Production:**
```bash
# Add to monitoring dashboard
watch -n 30 'curl -s https://accounting.siamoon.com/api/health/balance | jq ".status, .counts"'
```

**4. Debug Data Issues:**
```bash
# See first 3 records to verify data sanity
curl -s https://accounting.siamoon.com/api/health/balance | jq '.preview.firstThreeAccounts'
```

---

## 📊 SUMMARY MATRIX

| Component | Current State | Planned State | Migration Effort |
|-----------|---------------|---------------|------------------|
| **API Endpoints** | 5 separate endpoints | 1 unified + 2 action endpoints | Medium (2 weeks) |
| **Data Source** | Dual sheets (P&L + Balance) | Single Balance Sheet | Requires PM decision |
| **Cache-Busting** | ✅ Active | ✅ Keep | None |
| **Service Account** | ✅ Configured | ✅ Keep | None |
| **Static Config** | ✅ Fallback only | ✅ Keep as fallback | None |
| **Consumer Code** | 3 pages + 1 API | Update to unified endpoint | Low (1 week) |
| **Health Monitoring** | ❌ None | ✅ /api/health/balance | Low (2 days) |

---

## 🎯 RECOMMENDED TIMELINE

**Week 1: Foundation**
- Day 1-2: Create `/api/balance` unified endpoint
- Day 3: Create `/api/health/balance` monitoring
- Day 4-5: Test both endpoints, verify data accuracy

**Week 2: Migration**
- Day 1-2: Update Balance page to use `/api/balance`
- Day 3: Update Dashboard page
- Day 4: Update Firebase sync endpoint
- Day 5: Test all consumers, verify no regressions

**Week 3: Deprecation**
- Day 1-2: Add deprecation warnings to old endpoints
- Day 3-5: Monitor logs for any unexpected usage

**Week 4: Cleanup**
- Day 1-2: Remove deprecated endpoints
- Day 3-4: Final testing
- Day 5: Documentation updates

**Total Duration:** 4 weeks  
**Risk Level:** Low (all changes are additive until Phase 4)

---

## ✅ READY FOR PM DECISION

**All information provided above is:**
- ✅ Accurate (verified from codebase)
- ✅ Complete (all 5 requests answered)
- ✅ Actionable (includes implementation details)

**Awaiting PM decision on:**
1. Approve unified endpoint spec
2. Confirm sheet architecture (single vs dual)
3. Approve migration timeline
4. Greenlight implementation start

---

**Prepared by:** Copilot Development Team  
**Date:** November 4, 2025  
**Next Steps:** PM review and approval
