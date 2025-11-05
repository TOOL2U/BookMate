# ✅ FIXED: Overhead + Property/Person Calculation Issue

## Problem
Monthly expenses were INCORRECTLY calculated as:
```
expenses = overheads + propertyPersonExpense ❌ WRONG
```

This was happening in 3 components, showing inflated expense numbers.

---

## Files Fixed

### 1. ✅ components/pnl/PnLKpiRow.tsx
**Before:**
```tsx
const monthExpenses = (monthData?.overheads || 0) + (monthData?.propertyPersonExpense || 0);
const yearExpenses = (yearData?.overheads || 0) + (yearData?.propertyPersonExpense || 0);

subtitle="Overheads + Property/Person"
```

**After:**
```tsx
const monthExpenses = monthData?.overheads || 0;
const yearExpenses = yearData?.overheads || 0;

subtitle="Overhead Expenses Only"
```

**Impact:** KPI cards now show ONLY overhead expenses (correct)

---

### 2. ✅ components/pnl/PnLDetailedTable.tsx
**Before:**
```tsx
{ 
  category: 'Total Expenses', 
  monthValue: (monthData?.overheads || 0) + (monthData?.propertyPersonExpense || 0), 
  yearValue: (yearData?.overheads || 0) + (yearData?.propertyPersonExpense || 0), 
  type: 'expense' 
}
```

**After:**
```tsx
// Total Expenses row REMOVED - we don't add these together
// Shows Overheads and Property/Person as separate line items
```

**Impact:** Detailed table now shows overheads and property/person as separate items (correct)

---

### 3. ✅ components/pnl/PnLTrendChart.tsx
**Before:**
```tsx
expenses: monthData.overheads + monthData.propertyPersonExpense
expenses: Math.round((monthData.overheads + monthData.propertyPersonExpense) * variance)
```

**After:**
```tsx
expenses: monthData.overheads // Only overheads, NOT property/person
expenses: Math.round(monthData.overheads * variance) // Only overheads, NOT property/person
```

**Impact:** Trend chart now shows ONLY overhead expenses (correct)

---

## Current P&L Structure (CORRECT)

### Revenue Section
- Total Revenue: ฿0 (from API)

### Expenses Section (SEPARATE - NOT ADDED)
- **Overheads:** ฿41,532
- **Property/Person:** ฿41,532
- ~~Total Expenses~~ (removed - these are separate categories)

### Profitability
- GOP (Gross Operating Profit)
- EBITDA Margin

---

## API Data (Verified)
```json
{
  "month": {
    "revenue": 0,
    "overheads": 41532,          ← Overhead expenses ONLY
    "propertyPersonExpense": 41532, ← Property/Person ONLY
    "gop": -41532,
    "ebitdaMargin": 0
  }
}
```

---

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| **KPI Cards** | ฿83,064 (overhead+property) ❌ | ฿41,532 (overhead only) ✅ |
| **Detailed Table** | Total Expenses row ❌ | Separate line items ✅ |
| **Trend Chart** | Combined expenses ❌ | Overhead only ✅ |

---

## Verification

Visit http://localhost:3000/pnl and verify:
- ✅ Monthly Expenses KPI shows ฿41,532 (not ฿83,064)
- ✅ Subtitle says "Overhead Expenses Only"
- ✅ Detailed table shows Overheads and Property/Person as separate lines
- ✅ No "Total Expenses" row combining them
- ✅ Trend chart shows correct expense values

---

**Status:** ✅ FIXED - Overheads and Property/Person are now SEPARATE (not added together)
**Date:** November 5, 2025
