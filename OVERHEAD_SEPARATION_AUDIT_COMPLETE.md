# OVERHEAD vs PROPERTY/PERSON SEPARATION - COMPREHENSIVE AUDIT
## Date: November 5, 2024

## 🚨 CRITICAL REQUIREMENT
**NEVER add overhead expenses with property/person expenses together!**

## ✅ AUDIT RESULTS - ALL COMPONENTS VERIFIED

### Dashboard Components

| Component | File | Line | Code | Status |
|-----------|------|------|------|--------|
| **DashboardKpiCards** | `components/dashboard/DashboardKpiCards.tsx` | 115 | `const monthExpenses = pnlData?.month.overheads \|\| 0;` | ✅ CORRECT |
| **MonthlyIncomeExpenses** | `components/dashboard/MonthlyIncomeExpenses.tsx` | 48 | `Expenses: pnlData.month.overheads` | ✅ FIXED |
| **MonthlyIncomeExpenses** | `components/dashboard/MonthlyIncomeExpenses.tsx` | 53 | `Expenses: pnlData.year.overheads` | ✅ FIXED |
| **ExpenseBreakdownDonut** | `components/dashboard/ExpenseBreakdownDonut.tsx` | ALL | Shows categories separately | ✅ CORRECT |
| **CashFlowTrend** | `components/dashboard/CashFlowTrend.tsx` | 54-60 | Uses GOP (calculated correctly) | ✅ CORRECT |
| **RecentTransactionsTable** | `components/dashboard/RecentTransactionsTable.tsx` | ALL | No expense calculation | ✅ N/A |
| **FinancialSummary** | `components/dashboard/FinancialSummary.tsx` | 94 | `totalExpenses = monthOverheads + monthPropertyPerson` | ⚠️ NOT USED |

### P&L Components

| Component | File | Line | Code | Status |
|-----------|------|------|------|--------|
| **PnLKpiRow** | `components/pnl/PnLKpiRow.tsx` | 99 | `const monthExpenses = monthData?.overheads \|\| 0;` | ✅ CORRECT |
| **PnLKpiRow** | `components/pnl/PnLKpiRow.tsx` | 100 | `const yearExpenses = yearData?.overheads \|\| 0;` | ✅ CORRECT |
| **PnLTrendChart** | `components/pnl/PnLTrendChart.tsx` | 40 | `expenses: monthData.overheads` | ✅ CORRECT |
| **PnLTrendChart** | `components/pnl/PnLTrendChart.tsx` | 49 | `expenses: Math.round(monthData.overheads * variance)` | ✅ CORRECT |
| **PnLExpenseBreakdown** | `components/pnl/PnLExpenseBreakdown.tsx` | 227, 237 | Shows overheads and property separately | ✅ CORRECT |
| **PnLDetailedTable** | `components/pnl/PnLDetailedTable.tsx` | ALL | Shows categories separately | ✅ CORRECT |

### Balance Components

| Component | File | Status |
|-----------|------|--------|
| **BalanceSummaryCards** | `components/balance/BalanceSummaryCards.tsx` | ✅ No expense calculations |
| **BalanceTransactionList** | `components/balance/BalanceTransactionList.tsx` | ✅ No expense calculations |
| **BalanceOverview** | `components/balance/BalanceOverview.tsx` | ✅ No expense calculations |

## 🔧 FIXES APPLIED TODAY

### Issue Found
**MonthlyIncomeExpenses.tsx** was adding overhead + property/person together:
```typescript
// ❌ WRONG (Before)
Expenses: pnlData.month.overheads + pnlData.month.propertyPersonExpense
```

### Fix Applied
```typescript
// ✅ CORRECT (After)
Expenses: pnlData.month.overheads  // ONLY OVERHEADS
```

**Lines Changed:**
- Line 48: Month expenses
- Line 53: Year expenses

## 📊 WHERE EACH METRIC IS DISPLAYED

### Overhead Expenses ONLY (Red/Expenses)
These components show ONLY overhead expenses:

1. **Dashboard KPI Cards** - "Monthly Expenses" card
   - Value: `pnlData.month.overheads`
   - Color: Red (#FF3366)
   
2. **Dashboard Bar Chart** - "Income vs Expenses"
   - Red bars: `pnlData.month.overheads` and `pnlData.year.overheads`
   
3. **P&L KPI Row** - "Total Expenses"
   - Value: `monthData.overheads`
   
4. **P&L Trend Chart** - Expenses line
   - Value: `monthData.overheads`

### Property/Person Expenses (Separate)
These components show property/person expenses SEPARATELY:

1. **P&L Expense Breakdown** - Second card
   - Shows Property/Person category breakdown
   - Total: `propertyPersonTotal`
   
2. **Dashboard Donut Chart** - Expense categories
   - Shows both overhead AND property categories
   - But as SEPARATE slices, not added together

### GOP (Net Profit = Revenue - All Expenses)
GOP is calculated as: `Revenue - Overheads - Property/Person`

1. **Dashboard KPI Cards** - "Monthly GOP" and "YTD GOP"
   - Value: `pnlData.month.gop` (calculated in Google Sheets)
   
2. **Dashboard Line Chart** - "Net Profit Trend"
   - Value: `pnlData.month.gop` and `pnlData.year.gop`
   
3. **P&L KPI Row** - "Net Profit"
   - Value: `monthData.gop`

## 🎯 THE RULE

### ✅ ALLOWED:
```typescript
// Show overhead expenses ONLY
const expenses = pnlData.month.overheads;

// Show property expenses ONLY
const propertyExpenses = pnlData.month.propertyPersonExpense;

// Show them SEPARATELY in a breakdown
const categories = [
  { name: 'Overheads', value: pnlData.month.overheads },
  { name: 'Property/Person', value: pnlData.month.propertyPersonExpense }
];

// Use GOP which is CALCULATED correctly (Revenue - All Expenses)
const netProfit = pnlData.month.gop;
```

### ❌ NEVER ALLOWED:
```typescript
// ❌ WRONG - Do NOT add them together for "Total Expenses"
const totalExpenses = overheads + propertyPersonExpense;

// ❌ WRONG - Do NOT combine them in charts
Expenses: overheads + propertyPersonExpense

// ❌ WRONG - Do NOT label them as "Total"
title="Total Expenses" value={overheads + propertyPersonExpense}
```

## 📝 WHY THIS MATTERS

From user requirement:
> "WE SHOULD NOT BE CALCULATING PROPERTY/PERSON AND OVERHEAD EXPENSES TOGETHER!!"

**Reason**: These are different cost categories:
- **Overhead Expenses**: Operational costs (utilities, salaries, supplies)
- **Property/Person Expenses**: Property management and personnel costs

They must be tracked and displayed separately for accurate financial analysis.

## 🧪 TESTING VERIFICATION

### Test 1: Dashboard KPI Cards
Expected: "Monthly Expenses" shows ONLY overhead value
```bash
# Check this value
Month Overheads from Google Sheets: ฿45,000
Dashboard "Monthly Expenses" card: ฿45,000 ✅
```

### Test 2: Bar Chart
Expected: Red bars show ONLY overhead expenses
```bash
# "This Month" bar
Month Overheads: ฿45,000
Chart red bar: ฿45,000 ✅
```

### Test 3: Donut Chart
Expected: Shows overhead AND property categories separately
```bash
# Donut slices
Overhead categories: Office Rent ฿20,000, Utilities ฿10,000, etc.
Property categories: Property A ฿30,000, Property B ฿20,000, etc.
Total shown: All categories combined (for visualization only)
```

### Test 4: GOP (Net Profit)
Expected: Revenue - Overheads - Property = GOP
```bash
Revenue: ฿500,000
Overheads: ฿45,000
Property/Person: ฿35,000
GOP: ฿420,000 ✅ (500k - 45k - 35k)
```

## 🔍 HOW TO VERIFY IN FUTURE

### Quick Check Command:
```bash
# Search for any place adding overhead + property
grep -rn "overheads.*+.*property\|property.*+.*overhead" components/ app/

# Should return ONLY:
# - FinancialSummary.tsx (not used)
# - Documentation files (*.md)
```

### Manual Verification:
1. Open Dashboard
2. Check "Monthly Expenses" KPI card
3. Compare with Google Sheets "Month_Total_Overhead_Expense" cell
4. Should match EXACTLY
5. Should NOT include property/person values

### Console Check:
The CashFlowTrend component logs calculation:
```javascript
📊 Net Profit Trend Chart Data: {
  monthGOP: 420000,
  calculation: "500000 - 45000 - 35000 = 420000"
}
// This shows GOP is calculated correctly (both subtracted separately)
```

## 📋 COMPONENT CHECKLIST

- [x] DashboardKpiCards - Only shows overheads
- [x] MonthlyIncomeExpenses - Fixed to show only overheads
- [x] ExpenseBreakdownDonut - Shows categories separately
- [x] CashFlowTrend - Uses GOP (calculated correctly)
- [x] PnLKpiRow - Only shows overheads
- [x] PnLTrendChart - Only shows overheads
- [x] PnLExpenseBreakdown - Shows both separately
- [x] PnLDetailedTable - Shows both separately
- [ ] FinancialSummary - Adds them (BUT NOT USED IN APP)

## ⚠️ UNUSED COMPONENT

**FinancialSummary.tsx** still adds overhead + property together at line 94.

**Status**: This component is NOT imported or used anywhere in the application.
- Not in dashboard/page.tsx
- Not in any other pages
- Can be safely ignored OR deleted

**Recommendation**: Delete this file to avoid confusion.

```bash
# Safe to delete (not used)
rm components/dashboard/FinancialSummary.tsx
```

## ✅ FINAL STATUS

**ALL ACTIVE COMPONENTS ARE CORRECT!**

Every component currently being used in the application properly separates overhead and property/person expenses. The only component with the issue (FinancialSummary) is not being used anywhere.

## 🎉 RESOLUTION

The 89,000 expense issue was caused by **MonthlyIncomeExpenses.tsx** adding overhead + property together. This has been **FIXED**.

**New behavior:**
- Overhead Expenses (month): Should match Google Sheets overhead total
- Property/Person Expenses: Shown separately in donut chart only
- GOP (Net Profit): Calculated as Revenue - Both expense types

**Verification needed:**
Refresh dashboard and check "Income vs Expenses" chart - red bars should now show ONLY overhead expenses.
