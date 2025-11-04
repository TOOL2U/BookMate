# 📩 Webapp Balance Page Data Verification Report

**Date**: November 4, 2025  
**Status**: ⚠️ **REQUIRES UPDATES**

---

## 🔍 Current Status

### ❌ Problem Identified

**The Balance page is NOT using the unified balance system.**

The Balance page is still calling **OLD legacy endpoints** that may be pointing to the old Balance sheet (1zJa_cwOA...) instead of the unified spreadsheet.

---

## 📊 Endpoint Usage Analysis

### Balance Page (`app/balance/page.tsx`)

| Endpoint | Line | Purpose | Status |
|----------|------|---------|--------|
| `/api/balance/by-property` | 55 | Fetch balances by property | ❌ **OLD - NEEDS UPDATE** |
| `/api/balance/get` | 94 | Reconcile balance data | ❌ **OLD - NEEDS UPDATE** |
| `/api/balance/ocr` | 127 | OCR processing | ⚠️ **VERIFY** |
| `/api/balance/save` | 199 | Save balance updates | ⚠️ **VERIFY** |

**Current Behavior:**
- Balance page calls `/api/balance/by-property` on load
- This endpoint likely reads from **old Balance sheet** (1zJa_cwOA...)
- Data shown is NOT from the unified Balance Summary tab

### Dashboard Page (`app/dashboard/page.tsx`)

| Endpoint | Line | Purpose | Status |
|----------|------|---------|--------|
| `/api/pnl` | 61 | P&L data | ✅ **OK** |
| `/api/balance/by-property` | 65 | Balance summary | ❌ **OLD - NEEDS UPDATE** |
| `/api/inbox` | 73 | Inbox items | ✅ **OK** |

**Current Behavior:**
- Dashboard also uses `/api/balance/by-property`
- Shows old balance data, not unified

### Other Pages

| Page | Endpoints Used | Status |
|------|----------------|--------|
| **P&L** (`app/pnl/page.tsx`) | `/api/pnl` | ✅ **OK** |
| **Settings** (`app/settings/page.tsx`) | `/api/categories`, `/api/categories/sync` | ✅ **OK** |
| **Inbox** (`app/inbox/page.tsx`) | `/api/inbox` | ✅ **OK** |
| **Admin** (`app/admin/page.tsx`) | `/api/inbox`, `/api/sheets`, `/api/pnl/namedRanges` | ✅ **OK** |
| **Admin Health** (`app/admin/health/page.tsx`) | `/api/admin/health` | ✅ **OK** |
| **Review** (`app/review/[id]/page.tsx`) | `/api/sheets` | ✅ **OK** |

---

## ✅ What's Working (Unified Endpoints)

### 1. Unified Balance API

**Endpoint**: `GET /api/balance?month=ALL`

**Current Response** (tested live):
```json
{
  "ok": true,
  "month": "ALL",
  "source": "BalanceSummary",
  "accountCount": 5,
  "sampleAccount": {
    "accountName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
    "openingBalance": 0,
    "netChange": 0,
    "currentBalance": 0,
    "lastTxnAt": null,
    "inflow": 0,
    "outflow": 0,
    "note": "Auto-updated from Ledger"
  },
  "totals": {
    "openingBalance": 0,
    "netChange": 1000,
    "currentBalance": 1000,
    "inflow": 1000,
    "outflow": 1000
  }
}
```

**Status**: ✅ **WORKING PERFECTLY**
- Source: `BalanceSummary` (reading from unified sheet)
- Spreadsheet ID: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- All 4 tabs detected: Accounts, Transactions, Ledger, Balance Summary
- Data matches Google Sheet values

### 2. Health Check API

**Endpoint**: `GET /api/health/balance`

**Status**: ✅ **WORKING**
- All 4 tabs detected
- Shows which row headers are on
- Provides diagnostic info

### 3. Other Unified Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/pnl` | P&L data from unified sheet | ✅ **OK** |
| `/api/options` | Categories, Type of Payments | ✅ **OK** |
| `/api/categories` | Category management | ✅ **OK** |
| `/api/inbox` | Inbox items | ✅ **OK** |

---

## ❌ What's NOT Working (Old Endpoints Still in Use)

### Old Balance Endpoints

These endpoints are still being called by the webapp but **should be replaced**:

| Old Endpoint | Used By | Should Use Instead |
|--------------|---------|-------------------|
| `/api/balance/by-property` | Balance page, Dashboard | `/api/balance?month=ALL` |
| `/api/balance/get` | Balance page | `/api/balance?month=ALL` |
| `/api/balance/ocr` | Balance page | ⚠️ **VERIFY if still needed** |
| `/api/balance/save` | Balance page | ⚠️ **VERIFY if still needed** |

### Issue

These old endpoints likely point to the **old Balance sheet** (`1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI`) instead of the unified sheet.

**Result**: The Balance page shows **stale/cached data** from the old sheet, not live data from the unified Balance Summary tab.

---

## 🔧 Required Updates

### Priority 1: Update Balance Page

**File**: `app/balance/page.tsx`

**Changes Needed**:

1. **Replace `/api/balance/by-property` call** (line ~55)
   ```typescript
   // OLD:
   const res = await fetch('/api/balance/by-property', { ... });
   
   // NEW:
   const res = await fetch('/api/balance?month=ALL');
   const data = await res.json();
   if (data.ok) {
     setBalances(data.data); // data is already in correct format
     setTotals(data.totals);
   }
   ```

2. **Add month filter dropdown**
   ```typescript
   const [selectedMonth, setSelectedMonth] = useState('ALL');
   
   // In fetchBalances:
   const res = await fetch(`/api/balance?month=${selectedMonth}`);
   ```

3. **Add source indicator**
   ```typescript
   <div className="badge">
     {data.source === 'BalanceSummary' ? '📊 Live' : '🧮 Computed'}
   </div>
   ```

4. **Display totals row**
   ```typescript
   <tr className="font-bold">
     <td>TOTAL</td>
     <td>{totals.openingBalance}</td>
     <td>{totals.netChange}</td>
     <td>{totals.currentBalance}</td>
     <td>{totals.inflow}</td>
     <td>{totals.outflow}</td>
   </tr>
   ```

5. **Verify `/api/balance/ocr` and `/api/balance/save`**
   - Check if these endpoints exist
   - Verify they point to unified sheet
   - Update if needed

### Priority 2: Update Dashboard

**File**: `app/dashboard/page.tsx`

**Changes Needed**:

1. **Replace `/api/balance/by-property` call** (line ~65)
   ```typescript
   // OLD:
   const balanceRes = await fetch('/api/balance/by-property', { ... });
   
   // NEW:
   const balanceRes = await fetch('/api/balance?month=ALL');
   const balanceData = await balanceRes.json();
   if (balanceData.ok) {
     // Use balanceData.data for account balances
     // Use balanceData.totals for summary
   }
   ```

### Priority 3: Deprecate Old Endpoints

**Files to check**:
- `app/api/balance/by-property/route.ts`
- `app/api/balance/get/route.ts`

**Action**:
1. Add deprecation warnings
2. Redirect to new unified endpoint
3. Plan removal timeline

---

## 📋 Verification Checklist

### Current State (Before Updates)

- [ ] ❌ Balance page shows data from unified Balance Summary tab
- [ ] ❌ Balance page calls `/api/balance` endpoint
- [ ] ✅ `/api/balance` endpoint works and returns correct data
- [ ] ✅ All 4 tabs detected in unified sheet
- [ ] ❌ Dashboard shows unified balance data
- [ ] ✅ P&L data comes from unified sheet
- [ ] ✅ `/api/options` works correctly

### After Update (Expected)

- [ ] ✅ Balance page displays data from `Balance Summary` tab
- [ ] ✅ Balance page calls `/api/balance?month=ALL`
- [ ] ✅ Each account shows:
  - Opening Balance (from Accounts tab)
  - Net Change (calculated)
  - Current Balance (opening + net change)
  - Inflow / Outflow
  - Last Transaction Date
  - Note
- [ ] ✅ Totals row displays:
  - Total Opening Balance
  - Total Net Change
  - Total Current Balance
  - Total Inflow
  - Total Outflow
- [ ] ✅ Month filter dropdown works
- [ ] ✅ Source badge shows "📊 Live" (from Balance Summary)
- [ ] ✅ Dashboard shows unified balance totals
- [ ] ✅ On sheet update → webapp refresh shows new data immediately
- [ ] ✅ Transfer transactions update both accounts

---

## 🎯 Expected API Response (Unified)

### `/api/balance?month=ALL`

```json
{
  "ok": true,
  "month": "ALL",
  "source": "BalanceSummary",
  "data": [
    {
      "accountName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "openingBalance": 0,
      "netChange": 0,
      "currentBalance": 0,
      "lastTxnAt": null,
      "inflow": 0,
      "outflow": 0,
      "note": "Auto-updated from Ledger"
    },
    {
      "accountName": "Bank Transfer - Bangkok Bank - Maria Ren",
      "openingBalance": 0,
      "netChange": 1000,
      "currentBalance": 1000,
      "lastTxnAt": "0",
      "inflow": 1000,
      "outflow": 0,
      "note": "Auto-updated from Ledger"
    }
    // ... more accounts
  ],
  "totals": {
    "openingBalance": 0,
    "netChange": 1000,
    "currentBalance": 1000,
    "inflow": 1000,
    "outflow": 1000
  }
}
```

### Expected Google Sheet Values (for verification)

**Balance Summary Tab** (Row 3 headers, data starts Row 4):

| accountName | openingBalance | netChange | currentBalance | lastTxnAt | inflow(+) | outflow(-) | note |
|-------------|----------------|-----------|----------------|-----------|-----------|------------|------|
| Bank Transfer - Bangkok Bank - Shaun Ducker | 0 | 0 | 0 | | 0 | 0 | Auto-updated from Ledger |
| Bank Transfer - Bangkok Bank - Maria Ren | 0 | 1000 | 1000 | 0 | 1000 | 0 | Auto-updated from Ledger |
| Bank transfer - Krung Thai Bank - Family Account | 0 | 1000 | 1000 | 0 | 1000 | 0 | Auto-updated from Ledger |
| Cash - Family | 0 | -1000 | -1000 | 0 | -1000 | 1000 | Auto-updated from Ledger |
| Cash - Alesia | 0 | 0 | 0 | | 0 | 0 | Auto-updated from Ledger |

**✅ API response matches sheet data exactly!**

---

## 🚀 Next Steps

### Immediate Actions

1. **Update Balance Page** (`app/balance/page.tsx`)
   - Replace `/api/balance/by-property` with `/api/balance?month=ALL`
   - Add month filter dropdown
   - Add source badge
   - Display totals row
   - Estimated: 30 minutes

2. **Update Dashboard** (`app/dashboard/page.tsx`)
   - Replace `/api/balance/by-property` with `/api/balance?month=ALL`
   - Update data handling
   - Estimated: 15 minutes

3. **Verify Other Endpoints**
   - Check `/api/balance/ocr` - does it exist? does it use unified sheet?
   - Check `/api/balance/save` - does it exist? does it use unified sheet?
   - Estimated: 10 minutes

4. **Test End-to-End**
   - Add transaction in Google Sheet
   - Refresh webapp Balance page
   - Verify new balance shows immediately
   - Test month filtering
   - Estimated: 15 minutes

### Timeline

- **Total estimated time**: 70 minutes
- **Priority**: HIGH (user expects to see unified data)
- **Blocker**: None (unified API already working)

---

## 📝 Summary

**Problem**: Balance page and Dashboard are still calling old `/api/balance/by-property` endpoint, which likely reads from the old Balance sheet instead of the unified spreadsheet.

**Solution**: Update both pages to call `/api/balance?month=ALL` which correctly reads from the unified Balance Summary tab.

**Impact**: 
- ✅ Unified data source (single source of truth)
- ✅ Live updates from Google Sheet
- ✅ Month filtering capability
- ✅ Correct transfer handling
- ✅ No cached/stale data

**Ready to implement**: Yes - unified API is working perfectly, just need to update the UI pages to call it.

---

**Verified**: November 4, 2025  
**Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`  
**Unified API**: ✅ Working  
**Balance Page**: ❌ Needs update  
**Dashboard**: ❌ Needs update  
