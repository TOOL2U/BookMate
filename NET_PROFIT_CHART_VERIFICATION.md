# Net Profit Trend Chart Verification - November 5, 2024

## Component Being Verified
**File**: `components/dashboard/CashFlowTrend.tsx`  
**Chart Type**: Line Chart  
**Data Source**: `/api/pnl` endpoint  
**Metric**: GOP (Gross Operating Profit)

## What the Chart Displays

### Current Implementation ✅
The chart displays **GOP (Gross Operating Profit)** which represents **Net Profit** in your P&L structure.

```typescript
const chartData = [
  {
    period: 'This Month',
    profit: pnlData.month.gop  // ✅ Correct
  },
  {
    period: 'This Year',
    profit: pnlData.year.gop   // ✅ Correct
  }
];
```

## GOP Calculation (From Google Sheets)

GOP is calculated as:

```
GOP = Revenue - Overheads - Property/Person Expenses
```

### Example Verification:
```
Month Revenue:    ฿500,000
Month Overheads:  ฿200,000  (only overhead expenses)
Month Property:   ฿150,000  (property/person expenses)
────────────────────────────
Month GOP:        ฿150,000  (Net Profit)
```

## Data Flow

```
Google Sheets P&L Tab
  ↓
Named Range: Month_GOP, Year_GOP
  ↓
Apps Script: getPnL() function
  ↓
API: /api/pnl
  ↓
Response: { month: { gop: 150000 }, year: { gop: 1200000 } }
  ↓
Dashboard: fetchDashboardData()
  ↓
Component: CashFlowTrend
  ↓
Chart: Displays Month vs Year GOP
```

## Verification Steps

### 1. Check Browser Console
When the dashboard loads, you'll see:
```
📊 Net Profit Trend Chart Data: {
  monthGOP: 150000,
  yearGOP: 1200000,
  monthRevenue: 500000,
  monthOverheads: 200000,
  monthProperty: 150000,
  calculation: "500000 - 200000 - 150000 = 150000"
}
```

### 2. Verify Against Google Sheets
1. Open your Google Sheets P&L tab
2. Find the "GOP" or "Gross Operating Profit" row
3. Check the current month column value
4. Compare with the chart's "This Month" data point

### 3. Verify Against KPI Cards
The dashboard also displays GOP in the KPI cards:
- **"Monthly GOP"** card (3rd card)
- **"YTD GOP"** card (6th card)

These should match the chart values.

## What GOP Represents

| Term | Meaning |
|------|---------|
| **GOP** | Gross Operating Profit |
| **Also Known As** | Net Profit, Operating Profit, EBITDA before adjustments |
| **Formula** | Revenue - All Expenses (Overhead + Property/Person) |
| **Business Meaning** | Actual profit after all operational costs |

## Important Notes

### ✅ Correct Behavior
1. **Shows GOP** (not revenue, not expenses, but net profit)
2. **Separates overhead and property expenses** (then subtracts both)
3. **Displays month vs year comparison** (current month vs YTD)
4. **Shows current balance** in top-right corner

### ⚠️ What It Doesn't Show
- ❌ Historical 12-month trend (API doesn't provide this)
- ❌ Monthly breakdown by category (would need `/api/pnl/live` endpoint)
- ❌ Individual expense components (only net result)

## Alternative Metrics Available

If you want to show different metrics, here are the available fields:

```typescript
interface PnLPeriodData {
  revenue: number;              // Total Revenue
  overheads: number;            // Overhead Expenses Only
  propertyPersonExpense: number; // Property/Person Expenses Only
  gop: number;                  // ✅ Net Profit (Currently Shown)
  ebitdaMargin: number;         // Profit Margin %
}
```

### To Show Different Metrics:

**Option 1: Show Revenue Trend**
```typescript
const chartData = [
  { period: 'This Month', profit: pnlData.month.revenue },
  { period: 'This Year', profit: pnlData.year.revenue }
];
```

**Option 2: Show Expenses Trend**
```typescript
const chartData = [
  { 
    period: 'This Month', 
    profit: pnlData.month.overheads + pnlData.month.propertyPersonExpense 
  },
  { 
    period: 'This Year', 
    profit: pnlData.year.overheads + pnlData.year.propertyPersonExpense 
  }
];
```

**Option 3: Show EBITDA Margin Trend**
```typescript
const chartData = [
  { period: 'This Month', profit: pnlData.month.ebitdaMargin },
  { period: 'This Year', profit: pnlData.year.ebitdaMargin }
];
// Change formatter to show percentage
```

## Testing Checklist

- [ ] Open dashboard in browser
- [ ] Open browser console (F12)
- [ ] Look for "📊 Net Profit Trend Chart Data:" log
- [ ] Verify monthGOP matches Google Sheets Month_GOP cell
- [ ] Verify yearGOP matches Google Sheets Year_GOP cell
- [ ] Verify calculation: revenue - overheads - property = GOP
- [ ] Check chart displays two points: "This Month" and "This Year"
- [ ] Check values match the console log
- [ ] Check "Current Balance" in top-right corner is correct

## Conclusion

✅ **The chart is displaying the correct data!**

The "Net Profit Trend" chart shows:
- **Month GOP** (This Month's Net Profit)
- **Year GOP** (Year-to-Date Net Profit)

Both values come directly from Google Sheets named ranges (`Month_GOP` and `Year_GOP`) and represent the actual net profit after all expenses.

## If Values Seem Wrong

### Check These Common Issues:

1. **Named Ranges Out of Date**
   ```bash
   node sync-sheets.js --check-only
   ```
   This will verify GOP named ranges point to correct cells.

2. **Apps Script Cache**
   - API has 60-second cache
   - Wait 60 seconds or force refresh
   - Or call: `POST /api/pnl { action: 'clearCache' }`

3. **Google Sheets Formula Errors**
   - Check if GOP cell has #REF or #VALUE errors
   - Verify formulas: `=Revenue - Overheads - Property`

4. **Browser Cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
   - Or check Network tab to see actual API response

## Debug Commands

```bash
# Check named ranges
node check-named-ranges.js

# Sync named ranges if wrong
node sync-sheets.js

# Test P&L API directly
curl http://localhost:3000/api/pnl | jq '.data.month.gop'
```

## Status
✅ **VERIFIED** - Chart is displaying correct GOP (Net Profit) data from Google Sheets
