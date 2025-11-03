# 🔍 P&L Data Flow Diagnosis

**Date:** November 3, 2025  
**Status:** ⚠️ Issues Identified  

---

## 🎯 User-Reported Issues

1. **Overhead section displaying only 11 categories** (should show all 29)
2. **Property/Person section showing all ฿0 amounts** (incorrect - should show ฿1,065)
3. **GOP amount incorrect** (expenses and property/person calculated together)

---

## 📊 Current Data Flow Analysis

### ✅ Working: `/api/pnl/live` Endpoint

**Test Result:**
```bash
curl http://localhost:3000/api/pnl/live
```

**Returns Correct Data:**
- ✅ All 29 overhead categories present
- ✅ Property data correct: 
  - "Shaun Ducker - Personal": ฿590 (Nov)
  - "Family": ฿475 (Nov)
  - **Total Property: ฿1,065**
- ✅ Overhead total: ฿1,065
- ✅ Grand total: ฿3,195
- ✅ Formula-accurate from Lists sheet

### ❌ Broken: Breakdown Section

**Components Using OLD Endpoints:**

1. **`PnLExpenseBreakdown.tsx`** - Uses separate API calls:
   - `/api/pnl/overhead-expenses` (Apps Script webhook)
   - `/api/pnl/property-person` (Apps Script webhook)

2. **Problem:** These endpoints call Apps Script which may:
   - Not be deployed with latest changes
   - Use different calculation logic
   - Return incomplete data

---

## 🔎 Detailed Investigation

### Test 1: Overhead Expenses Endpoint

```bash
curl "http://localhost:3000/api/pnl/overhead-expenses?period=month"
```

**Expected:** 29 categories with Nov totals  
**Actual:** Unknown (Apps Script dependent)  
**Issue:** Apps Script may not be deployed

### Test 2: Property/Person Endpoint

```bash
curl "http://localhost:3000/api/pnl/property-person?period=month"
```

**Expected:** 7 properties with Nov totals  
**Actual:** All zeros reported by user  
**Issue:** Apps Script calculation error or deployment issue

### Test 3: Detailed P&L Table

**Component:** `PnLDetailedTable.tsx`  
**Unknown:** What endpoint does this use?  
**Need to check:** If it's also using Apps Script or /api/pnl/live

---

## 🛠️ Root Cause Analysis

### Issue #1: Dual Data Sources

```
┌─────────────────────────────────────────┐
│         P&L Page (page.tsx)             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ KPI Cards                         │ │
│  │ Source: /api/pnl/live ✅          │ │
│  │ Status: Working correctly         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Expense Breakdown                 │ │
│  │ Source: Apps Script webhooks ❌   │ │
│  │ - /api/pnl/overhead-expenses      │ │
│  │ - /api/pnl/property-person        │ │
│  │ Status: Showing wrong data        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Detailed P&L Table                │ │
│  │ Source: Unknown ❓                │ │
│  │ Status: Need to check             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Issue #2: Apps Script Deployment Gap

**Files Modified But Not Deployed:**
- `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js` - Updated to read Data!B2:B (29 categories)
- User has not deployed to Google Apps Script yet
- Old version still running with hardcoded categories

### Issue #3: Data Inconsistency

| Component | Data Source | Status |
|-----------|-------------|--------|
| KPI Cards | /api/pnl/live | ✅ Correct |
| Expense Breakdown (Overhead) | Apps Script | ❌ Wrong (11 vs 29) |
| Expense Breakdown (Property) | Apps Script | ❌ Wrong (all zeros) |
| Detailed Table | Unknown | ❓ Need check |

---

## ✅ Solution Plan

### Solution 1: Use /api/pnl/live Data Throughout

Instead of calling Apps Script endpoints, **reuse the data from `/api/pnl/live`** that's already fetched by `page.tsx`.

**Benefits:**
- Single source of truth
- Consistent data across all components
- No Apps Script deployment dependency
- 5-minute cache applies to all sections
- Formula-accurate from Lists sheet

**Implementation:**
1. Modify `PnLExpenseBreakdown.tsx` to accept `liveData` as props
2. Transform `liveData.blocks.overhead` to `ExpenseItem[]` format
3. Transform `liveData.blocks.property` to `ExpenseItem[]` format
4. Remove API calls from component
5. Calculate percentages from totals

### Solution 2: Fix Apps Script Endpoints (Alternative)

**If we want to keep Apps Script:**
1. Deploy `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js` to Google Apps Script
2. Test endpoints after deployment
3. Verify 29 categories returned
4. Fix property/person calculation in Apps Script

**Downside:** Dual maintenance burden, potential inconsistencies

---

## 🎯 Recommended Approach: Solution 1

**Refactor `PnLExpenseBreakdown.tsx` to use `/api/pnl/live` data.**

### Current Structure (BROKEN):
```typescript
// PnLExpenseBreakdown.tsx
useEffect(() => {
  // ❌ Separate API calls
  fetchOverheadData();      // → /api/pnl/overhead-expenses
  fetchPropertyPersonData(); // → /api/pnl/property-person
}, [period]);
```

### New Structure (FIXED):
```typescript
// page.tsx passes down liveData
<PnLExpenseBreakdown
  period={period}
  liveData={liveData}  // ← Pass the data
  overheadsTotal={...}
  propertyPersonTotal={...}
/>

// PnLExpenseBreakdown.tsx
function PnLExpenseBreakdown({ period, liveData, ... }) {
  // ✅ Transform data locally
  const overheadItems = useMemo(() => {
    if (!liveData) return [];
    const monthIndex = period === 'month' ? new Date().getMonth() : null;
    const total = period === 'month' 
      ? liveData.totals.overhead.monthly[monthIndex]
      : liveData.totals.overhead.yearTotal;
    
    return liveData.blocks.overhead
      .map(cat => ({
        name: cat.name,
        expense: period === 'month' ? cat.monthly[monthIndex] : cat.yearTotal,
        percentage: total > 0 ? (expense / total) * 100 : 0
      }))
      .filter(item => item.expense > 0)
      .sort((a, b) => b.expense - a.expense);
  }, [liveData, period]);
}
```

---

## 🔍 Additional Checks Needed

### Check 1: PnLDetailedTable Component

**File:** `components/pnl/PnLDetailedTable.tsx`  
**Questions:**
- What data source does it use?
- Is it showing correct GOP calculation?
- Does it separate overhead vs property/person?

### Check 2: Balance Page

**User Request:**
> "check the balance page to make sure its also collecting the correct data for each bank and when expenses are input with that selected bank it deducts the amount from the bank"

**Files to Check:**
- `app/balance/page.tsx` or `app/balance-new/page.tsx`
- Related API endpoints
- Data flow from Lists sheet

### Check 3: Tracking Logic

**User Request:**
> "check the tracking logic to make sure that is correct"

**Need to identify:**
- What is "tracking logic"?
- Where is it implemented?
- What should it track?

---

## 📋 Implementation Checklist

- [ ] Read `PnLDetailedTable.tsx` to understand data source
- [ ] Read balance page to understand bank balance logic
- [ ] Identify tracking logic location
- [ ] Refactor `PnLExpenseBreakdown.tsx` to use liveData props
- [ ] Test overhead section shows all 29 categories
- [ ] Test property/person section shows correct amounts
- [ ] Verify GOP calculation separates overhead and property
- [ ] Test balance page bank deductions
- [ ] Test tracking logic functionality
- [ ] Create comprehensive test report

---

## 🎯 Next Actions

1. **Immediate:** Read remaining components to understand full data flow
2. **Fix:** Refactor PnLExpenseBreakdown to use liveData
3. **Verify:** Test balance page and tracking logic
4. **Document:** Create complete system audit report

---

**Priority:** 🔴 HIGH - Core P&L functionality broken  
**Estimated Time:** 2-3 hours for full audit and fixes
