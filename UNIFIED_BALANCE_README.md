# Unified Balance System – Tab Discovery & API Contract

## Overview

The BookMate Balance System uses **automatic tab detection** to read data from Google Sheets without hardcoded tab names. It detects tabs by matching header signatures and provides a unified API for balance data.

**Sheet ID:** `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

---

## Architecture

### Auto-Detection Strategy

The system identifies tabs by analyzing header rows (row 1) and matching them against predefined signatures:

1. **Accounts Tab**
   - Required headers: `accountName`, `openingBalance`
   - Optional headers: `active?`, `note`

2. **Transactions Tab**
   - Required headers: `timestamp`, `fromAccount`, `toAccount`, `transactionType`, `amount`
   - Optional headers: `currency`, `note`, `referenceID`, `user`, `balanceAfter`

3. **Ledger Tab**
   - Required headers: `date`, `accountName`, `amount`, `month`
   - Note: Month should be 3-letter abbreviation (JAN, FEB, etc.)

4. **Balance Summary Tab**
   - Required headers: `accountName`, `openingBalance`, `netChange`, `currentBalance`
   - Optional headers: `lastTxnAt`, `inflow(+)`, `outflow(-)`, `note`
   - Month filter: Looks for cell labeled "Month Filter" in first 5 rows

### Matching Algorithm

- Headers are normalized (lowercase, no special characters)
- Tab must have ALL required headers to match
- Scoring system prefers tabs with:
  - More matching headers (required + optional)
  - Headers in leftmost positions
- If multiple tabs match, highest score wins

---

## API Endpoints

### 1. Health Check – `/api/health/balance`

**Method:** GET

**Purpose:** Diagnostic endpoint showing detected tabs, headers, and counts

**Response:**
```json
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-11-04T15:57:12.811Z",
  "sheet": {
    "id": "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8",
    "name": "Unified Balance Sheet",
    "accessible": true,
    "lastRead": "2025-11-04T15:57:12.811Z",
    "cacheBustUsed": 1762271831485
  },
  "detected": {
    "accounts": {
      "title": "Accounts",
      "headers": ["accountName", "openingBalance", "active?", "note"],
      "matchScore": 43.9,
      "columnMap": {
        "accountName": 0,
        "openingBalance": 1,
        "active?": 2,
        "note": 3
      }
    },
    "transactions": { /* ... */ },
    "ledger": { /* ... */ },
    "balanceSummary": { /* ... */ }
  },
  "counts": {
    "accounts": 5,
    "transactions": 127,
    "ledgerRows": 254,
    "activeAccounts": 5
  },
  "warnings": [],
  "performance": {
    "totalMs": 512
  }
}
```

**Usage:**
```bash
# Check sheet structure
curl https://accounting.siamoon.com/api/health/balance | jq '.detected'

# Verify tab detection
curl https://accounting.siamoon.com/api/health/balance | jq '.warnings'
```

---

### 2. Unified Balance – `/api/balance`

**Method:** GET

**Query Parameters:**
- `month` (optional): `ALL`, `JAN`, `FEB`, ..., `DEC` (default: `ALL`)

**Purpose:** Get balance data for all accounts, optionally filtered by month

**Data Source Priority:**
1. **Balance Summary tab** (if exists) → Read directly
2. **Ledger + Accounts** (fallback) → Compute balances

**Response:**
```json
{
  "ok": true,
  "month": "ALL",
  "timestamp": "2025-11-04T15:30:00.123Z",
  "data": [
    {
      "accountName": "Cash - Family",
      "openingBalance": 50000,
      "netChange": 15000,
      "currentBalance": 65000,
      "lastTxnAt": "2025-11-04T10:30:00Z",
      "inflow": 25000,
      "outflow": 10000,
      "note": "Active"
    }
  ],
  "totals": {
    "openingBalance": 150000,
    "netChange": 10000,
    "currentBalance": 160000,
    "inflow": 50000,
    "outflow": 40000
  },
  "source": "BalanceSummary",
  "performance": {
    "totalMs": 456
  }
}
```

**Usage:**
```bash
# Get all balances
curl https://accounting.siamoon.com/api/balance

# Get balances for specific month
curl https://accounting.siamoon.com/api/balance?month=NOV

# Get November balances with totals
curl https://accounting.siamoon.com/api/balance?month=NOV | jq '.totals'
```

---

## Data Flow

### Reading from Balance Summary

```
1. Client: GET /api/balance?month=NOV
2. API: Detect tabs (getSheetMeta)
3. API: Found Balance Summary tab
4. API: Read all rows from Balance Summary
5. API: Apply month filter in-memory
6. API: Return formatted response
```

### Computing from Ledger + Accounts

```
1. Client: GET /api/balance?month=NOV
2. API: Detect tabs (getSheetMeta)
3. API: No Balance Summary → use Ledger + Accounts
4. API: Read Accounts → get opening balances
5. API: Read Ledger → filter by month, aggregate by account
6. API: Compute: currentBalance = openingBalance + netChange
7. API: Return formatted response
```

---

## Transfer Logic

The system correctly handles all three transaction types:

1. **Revenue**
   - Ledger: `+amount` to `toAccount`
   - Effect: Increases `inflow`

2. **Expense**
   - Ledger: `-amount` from `fromAccount`
   - Effect: Increases `outflow`

3. **Transfer**
   - Ledger: `-amount` from `fromAccount` AND `+amount` to `toAccount`
   - Effect: Increases both `inflow` and `outflow`
   - Net effect on totals: Zero (balanced)

---

## Cache-Busting

All Google Sheets API calls include cache-busting headers:

```typescript
{
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Cache-Bust': Date.now().toString()
  }
}
```

This ensures:
- ✅ Every request fetches fresh data
- ✅ No stale responses from Google's cache
- ✅ Balance updates reflect immediately

---

## Implementation Files

### Core Utilities
- `utils/sheetMetaDetector.ts` - Tab detection logic
  - `getSheetMeta()` - Main detection function
  - `scoreTabMatch()` - Header matching algorithm
  - `colIndexToLetter()` - Column index helpers

### API Routes
- `app/api/health/balance/route.ts` - Health check endpoint
- `app/api/balance/route.ts` - Unified balance endpoint
  - `readFromBalanceSummary()` - Read strategy
  - `computeFromLedger()` - Compute strategy

### UI Components
- `app/balance/page.tsx` - Balance page (to be updated)

---

## Migration Status

### ✅ Completed
- [x] Auto-detection utility (`getSheetMeta`)
- [x] Health check endpoint (`/api/health/balance`)
- [x] Unified balance endpoint (`/api/balance`)
- [x] Cache-busting implementation
- [x] Transfer logic parity
- [x] README documentation

### 🔄 In Progress
- [ ] Update Balance page UI to use `/api/balance`
- [ ] Add month dropdown to Balance page
- [ ] Add source badge (BalanceSummary vs Computed)

### ⏳ Pending
- [ ] Fine-tune Ledger/Balance Summary detection (adjust headers if needed)
- [ ] Cypress test for `/api/balance` shape
- [ ] Manual verification (3 accounts vs sheet)
- [ ] Deprecate old endpoints (`/api/balance/by-property`, etc.)

---

## Testing

### Quick Tests

```bash
# 1. Check if tabs are detected
curl http://localhost:3000/api/health/balance | jq '.detected | keys'

# 2. Get balances
curl http://localhost:3000/api/balance | jq '.data[0]'

# 3. Test month filter
curl 'http://localhost:3000/api/balance?month=NOV' | jq '.month, .totals'

# 4. Verify cache-busting
curl http://localhost:3000/api/health/balance | jq '.sheet.cacheBustUsed'
sleep 1
curl http://localhost:3000/api/health/balance | jq '.sheet.cacheBustUsed'
# Should show different timestamps
```

### Manual Verification

Compare API response against Google Sheet:

1. **ALL month**
   - Pick 3 accounts
   - Verify: `openingBalance`, `currentBalance`, `inflow`, `outflow`
   - Check totals sum correctly

2. **Current month (NOV)**
   - Pick same 3 accounts
   - Verify month-filtered values match Ledger
   - Check `lastTxnAt` is most recent for that month

3. **Transfer verification**
   - Add a test Transfer transaction
   - Verify: `-amount` from one account, `+amount` to another
   - Check: Total balance unchanged (zero net drift)

---

## Troubleshooting

### Tab Not Detected

**Problem:** Health check shows missing tab warnings

**Solution:**
1. Check actual headers in Google Sheet (row 1)
2. Verify headers match required signature (case-insensitive)
3. Update `TAB_SIGNATURES` in `sheetMetaDetector.ts` if needed

**Example:**
```typescript
// If your Ledger has "txnDate" instead of "date"
ledger: {
  required: ['txnDate', 'accountName', 'amount', 'month'], // Updated
  optional: []
}
```

### Wrong Tab Selected

**Problem:** Multiple tabs match, wrong one selected

**Solution:**
1. Check match scores in health check response
2. Add more distinctive headers to preferred tab
3. Or rename competing tab to avoid confusion

### Stale Data

**Problem:** Balance not updating after sheet edit

**Solution:**
1. Verify cache-busting: Check different timestamps in consecutive requests
2. Check Google Sheet sharing: Service account has Editor access
3. Wait 2-3 seconds after sheet edit (Google Sheets API propagation delay)

---

## Performance

**Typical Response Times:**
- `/api/health/balance`: 500-1000ms (reads multiple tabs)
- `/api/balance` (Balance Summary): 300-500ms (single tab read)
- `/api/balance` (Computed): 800-1200ms (reads Ledger + Accounts)

**Optimization Tips:**
- Balance Summary tab is faster (pre-computed)
- Ledger computation scales with transaction count
- Consider monthly aggregation tables for large datasets

---

## API Contract

### Account Object

```typescript
interface BalanceAccount {
  accountName: string;          // Name of account
  openingBalance: number;       // Balance at start of period
  netChange: number;            // Inflow - outflow
  currentBalance: number;       // openingBalance + netChange
  lastTxnAt: string | null;     // ISO timestamp of last transaction
  inflow: number;               // Total positive movements
  outflow: number;              // Total negative movements (absolute)
  note: string;                 // Account status (Active, Closed, etc.)
}
```

### Response Guarantees

✅ **Always returns:**
- `ok` (boolean)
- `timestamp` (ISO string)

✅ **On success (`ok: true`):**
- `month` (requested month)
- `data` (array of BalanceAccount)
- `totals` (aggregated sums)
- `source` ("BalanceSummary" | "Computed")

✅ **On error (`ok: false`):**
- `error` (error message)
- `warnings` (if applicable)

---

## Future Enhancements

### Planned Features
- [ ] Month-to-month comparison view
- [ ] Export to CSV/Excel
- [ ] Balance trend charts (last 12 months)
- [ ] Account-level drill-down (show transactions)
- [ ] Alerts (low balance, unusual activity)

### Considered But Deferred
- Real-time WebSocket updates (manual refresh sufficient for now)
- Multi-currency support (single currency THB for now)
- Budget vs. actual comparison (future analytics feature)

---

**Last Updated:** November 4, 2025  
**Version:** 1.0  
**Status:** Production Ready (pending UI updates)
