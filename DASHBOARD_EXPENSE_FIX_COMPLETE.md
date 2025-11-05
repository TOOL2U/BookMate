# ✅ FIXED: Dashboard Page - Wrong Expense Data

## Problem
Dashboard page was showing INCORRECT expense data by adding:
```
monthExpenses = overheads + propertyPersonExpense ❌ WRONG
```

This inflated the expense numbers shown on the dashboard.

---

## Files Fixed

### 1. ✅ components/dashboard/DashboardKpiCards.tsx

**Before:**
```tsx
const monthExpenses = (pnlData?.month.overheads || 0) + (pnlData?.month.propertyPersonExpense || 0);
```

**After:**
```tsx
const monthExpenses = pnlData?.month.overheads || 0; // Only overheads, NOT property/person
```

**Impact:** "Monthly Expenses" KPI card now shows ONLY overhead expenses

---

### 2. ✅ components/dashboard/FinancialSummary.tsx

**Before:**
```tsx
{
  name: 'Expenses',
  Month: (pnlData?.month.overheads || 0) + (pnlData?.month.propertyPersonExpense || 0),
  Year: (pnlData?.year.overheads || 0) + (pnlData?.year.propertyPersonExpense || 0)
}
```

**After:**
```tsx
{
  name: 'Expenses',
  Month: pnlData?.month.overheads || 0, // Only overheads, NOT property/person
  Year: pnlData?.year.overheads || 0 // Only overheads, NOT property/person
}
```

**Impact:** Month vs Year comparison chart now shows ONLY overhead expenses

**Also removed:**
```tsx
const totalExpenses = monthOverheads + monthPropertyPerson; // This line removed
```

The pie chart still shows both categories separately (correct):
- Overheads slice
- Property/Person slice

---

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Monthly Expenses KPI** | ฿83,064 (41,532 + 41,532) ❌ | ฿41,532 (overhead only) ✅ |
| **Expenses Bar (Month)** | ฿83,064 ❌ | ฿41,532 ✅ |
| **Expenses Bar (Year)** | ฿83,064 ❌ | ฿41,532 ✅ |
| **Expense Pie Chart** | Unchanged (already correct) ✅ | Unchanged ✅ |

---

## Dashboard Structure (CORRECT)

### KPI Cards (Top Row)
1. Monthly Revenue: ฿0
2. **Monthly Expenses: ฿41,532** ← FIXED (overhead only)
3. Monthly GOP: -฿41,532
4. EBITDA Margin: 0%
5. Total Cash & Bank: (from balance API)
6. YTD GOP: -฿41,532

### Financial Summary Section
- **Month vs Year Chart:**
  - Revenue bar
  - **Expenses bar: ฿41,532** ← FIXED (overhead only)
  - GOP bar

- **Expense Breakdown Pie Chart:**
  - Overheads: ฿41,532 (separate slice)
  - Property/Person: ฿41,532 (separate slice)
  - (These are NOT added together) ✅

---

## All Pages Now Correct

| Page | Status |
|------|--------|
| ✅ Dashboard | Monthly Expenses shows overhead only |
| ✅ P&L | KPI, Table, Chart all show overhead only |
| ✅ Balance | N/A (no expense calculations) |
| ✅ Upload | N/A |
| ✅ Inbox | N/A |
| ✅ Review | N/A |

---

## Verification

Visit http://localhost:3000/dashboard and verify:
- ✅ "Monthly Expenses" KPI card shows ฿41,532 (not ฿83,064)
- ✅ "Month vs Year" chart Expenses bar shows ฿41,532
- ✅ Pie chart still shows both categories separately

---

**Status:** ✅ FIXED - Dashboard now shows correct expense data (overhead only)
**Date:** November 5, 2025

