# Dashboard API Fix - November 5, 2024

## Problem
Dashboard showed "No data available" for all new charts because they were trying to use `/api/pnl/live` endpoint which doesn't exist.

## Root Cause
The dashboard was designed to use a non-existent `/api/pnl/live` endpoint that would return historical monthly data with detailed category breakdowns. This endpoint was never created.

## Available APIs
1. **`/api/pnl`** - Returns current month and year totals only
   ```typescript
   {
     month: { revenue, overheads, propertyPersonExpense, gop, ebitdaMargin },
     year: { revenue, overheads, propertyPersonExpense, gop, ebitdaMargin }
   }
   ```

2. **`/api/pnl/overhead-expenses?period=month`** - Returns current month overhead categories
   ```typescript
   {
     data: [{ name, expense, percentage }],
     totalExpense: number
   }
   ```

3. **`/api/pnl/property-person?period=month`** - Returns current month property/person categories
   ```typescript
   {
     data: [{ name, expense, percentage }],
     totalExpense: number
   }
   ```

## Solution
Updated all dashboard chart components to use the available APIs with current month/year comparison instead of historical 12-month trends:

### 1. Dashboard Page (`app/dashboard/page.tsx`)
- **Removed**: `pnlLive` from state and PnLLiveData interface
- **Added**: `overheadCategories` and `propertyCategories` arrays
- **Changed**: Fetch overhead and property category data in parallel
- **Fixed**: Tailwind v4 warnings (`flex-shrink-0` → `shrink-0`)

### 2. Monthly Income vs Expenses Chart (`components/dashboard/MonthlyIncomeExpenses.tsx`)
- **Before**: Line chart showing 12 months of historical Income vs Expenses
- **After**: Bar chart comparing "This Month" vs "This Year"
- **Data Source**: `/api/pnl` (month and year totals)
- **Calculation**: Expenses = overheads + propertyPersonExpense (maintains separation)

### 3. Expense Breakdown Donut (`components/dashboard/ExpenseBreakdownDonut.tsx`)
- **Before**: Donut chart of all categories from last 12 months
- **After**: Donut chart of current month categories
- **Data Source**: `/api/pnl/overhead-expenses` + `/api/pnl/property-person`
- **Features**: 
  - Combines overhead + property categories
  - Filters zero values
  - Sorts by expense descending
  - Shows percentages and scrollable legend

### 4. Cash Flow Trend (`components/dashboard/CashFlowTrend.tsx`)
- **Before**: Line chart showing 12 months of net cash flow
- **After**: Line chart comparing "This Month" vs "This Year" GOP (Net Profit)
- **Data Source**: `/api/pnl` (GOP from month and year)
- **Additional**: Shows current total balance in header

### 5. Recent Transactions Table (`components/dashboard/RecentTransactionsTable.tsx`)
- **No change**: Already using correct `/api/inbox` data
- **Fixed**: Tailwind v4 warnings (`bg-gradient-to-br` → `bg-linear-to-br`)

## Key Changes Summary

| Component | Old Data Source | New Data Source | Chart Type Change |
|-----------|----------------|-----------------|-------------------|
| MonthlyIncomeExpenses | `/api/pnl/live` (12 months) | `/api/pnl` (month + year) | Line → Bar |
| ExpenseBreakdownDonut | `/api/pnl/live` (historical) | `/api/pnl/overhead-expenses` + `/api/pnl/property-person` | Same (Donut) |
| CashFlowTrend | `/api/pnl/live` (12 months) | `/api/pnl` (month + year GOP) | Same (Line) |

## Benefits
1. ✅ **Works with existing APIs** - No need to create new endpoints
2. ✅ **Maintains data accuracy** - Still separates overhead from property/person expenses
3. ✅ **Simpler and faster** - Fewer API calls, current data only
4. ✅ **Brand consistent** - All charts use yellow (#FFF02B), black, grey colors
5. ✅ **Responsive** - All charts work on mobile/tablet/desktop

## Limitations
- **No historical trends**: Charts show current month vs year comparison instead of 12-month history
- **Current month only**: Expense breakdown shows only current month categories

## Future Enhancement Option
If historical monthly data is needed, create `/api/pnl/live` endpoint in Apps Script that:
1. Reads P&L tab for last 12 months
2. Returns monthly arrays for all categories
3. Includes totals for revenue, overhead, property, and grand totals

Then revert these components to use historical data visualization.

## Files Modified
- `app/dashboard/page.tsx`
- `components/dashboard/MonthlyIncomeExpenses.tsx`
- `components/dashboard/ExpenseBreakdownDonut.tsx`
- `components/dashboard/CashFlowTrend.tsx`

## Testing
1. Start dev server: `npm run dev`
2. Navigate to `/dashboard`
3. Verify all 4 charts show data:
   - KPI Cards (6 cards)
   - Income vs Expenses (2 bars: Month vs Year)
   - Expense Breakdown (Donut with categories)
   - Net Profit Trend (2 points: Month vs Year GOP)
   - Recent Transactions (Last 10 transactions)

## Status
✅ **COMPLETE** - Dashboard now loads with available API data
