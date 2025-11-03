# P&L Overhead Expenses - Dynamic Categories Update

**Date:** November 3, 2025  
**Issue:** Overhead expenses were showing hardcoded P&L rows instead of dynamic Data sheet categories  
**Solution:** Updated Apps Script to read from Data sheet and aggregate actual transactions

---

## 🎯 Problem

The P&L overhead expenses were showing:
- ❌ Hardcoded rows from P&L sheet (rows 31-58)
- ❌ Only ~24 categories instead of all 29 from Data sheet
- ❌ **New categories added to Data sheet wouldn't appear automatically**

## ✅ Solution

Updated `handleGetOverheadExpensesDetails()` function in Apps Script to:
1. **Read ALL expense categories from Data!B2:B** (same source as Settings page)
2. **Aggregate actual transactions** from BookMate P&L 2025 sheet
3. **Filter by period** (current month or YTD)
4. **Return all categories**, including those with $0 (so new categories always appear)

---

## 🔄 Changes Made

### File: `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`

**Lines 867-997:** Completely rewrote `handleGetOverheadExpensesDetails()` function

**New Logic:**
```javascript
1. Read expense categories from Data!B2:B (currently 29 categories)
2. Read all transactions from BookMate P&L 2025 sheet
3. Filter transactions by period:
   - month: Current month + current year
   - year: All transactions from current year
4. Aggregate debits by category (typeOfOperation column)
5. Calculate percentages
6. Return ALL categories sorted by expense amount
```

**Added Helper Function:** `getMonthNumber_(monthStr)`
- Converts month names (Jan, Feb, etc.) to numbers (1-12)
- Handles both short and long month names
- Used for filtering transactions by current month

---

## 📊 Data Flow

### Before (Hardcoded):
```
P&L Sheet Rows 31-58 → Extract "EXP -" items → Return fixed list
```

### After (Dynamic):
```
Data Sheet B2:B → Get all categories (29)
          ↓
BookMate P&L 2025 → Filter by period → Aggregate by category
          ↓
Return ALL categories with amounts (including $0)
```

---

## 🚀 Deployment Instructions

### Step 1: Open Apps Script Editor
1. Open your Google Sheet
2. Extensions → Apps Script
3. You should see the code from `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`

### Step 2: Deploy New Version
1. Click **Deploy** → **Manage deployments**
2. Click ⚙️ **Edit** (pencil icon)
3. Under "New description", enter:
   ```
   V8.1 - Dynamic overhead categories from Data sheet
   ```
4. Click **Deploy**
5. ✅ **The URL stays the same** - no need to update environment variables!

### Step 3: Test the Changes
After deployment, test the endpoint:

**Test Current Month:**
```bash
curl -X POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getOverheadExpensesDetails",
    "secret": "YOUR_SECRET",
    "period": "month"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "data": [
    { "name": "EXP - Utilities - Gas", "expense": 15420, "percentage": 12.5 },
    { "name": "EXP - Construction - Tools", "expense": 10200, "percentage": 8.3 },
    ...ALL 29 categories...
  ],
  "period": "month",
  "totalExpense": 123456,
  "count": 29,
  "matchedTransactions": 42,
  "source": "Data sheet + BookMate P&L 2025 transactions",
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

## 🎨 Frontend Changes Already Made

### File: `components/pnl/PnLExpenseBreakdown.tsx`

✅ Added "View All Categories" button to Overheads panel  
✅ Integrated OverheadExpensesModal  
✅ Modal opens on button click  
✅ Modal fetches from `/api/pnl/overhead-expenses`  

**No frontend code changes needed** - the existing components will automatically display all 29 categories once the Apps Script is deployed.

---

## 🧪 Testing Checklist

After deploying the Apps Script update:

- [ ] Open P&L page in production
- [ ] Click "View All Categories" button in Overheads section
- [ ] Verify all 29 expense categories are shown
- [ ] Add a new expense category in Settings page
- [ ] Verify it appears in Data sheet Column B
- [ ] Refresh P&L page and check if new category appears in modal
- [ ] Test with both "Month View" and "Year View" periods
- [ ] Verify categories with $0 expenses still appear in the list

---

## 📝 Benefits

✅ **Always in sync with Settings page** - Both use Data!B2:B  
✅ **Automatically shows new categories** - No manual updates needed  
✅ **Real transaction data** - Not hardcoded P&L formulas  
✅ **Shows all categories** - Including those with $0 (for transparency)  
✅ **Period filtering** - Accurate month vs. year totals  

---

## 🔍 Technical Details

### Data Sources:
- **Categories:** `Data!B2:B` (29 expense categories)
- **Transactions:** `BookMate P&L 2025` sheet, starting from row 7 (HEADER_ROW + 1)

### Transaction Columns:
- B: Day
- C: Month (e.g., "Jan", "Feb")
- D: Year (e.g., "2025")
- E: Property
- **F: Type of Operation (expense category)** ← Used for aggregation
- G: Type of Payment
- H: Detail
- I: Reference
- **J: Debit** ← Summed for expense totals
- K: Credit

### Period Logic:
- **month:** Filters transactions where `monthNum === currentMonth && year === currentYear`
- **year:** Filters transactions where `year === currentYear`

### Edge Cases Handled:
- ✅ Empty transactions (returns all categories with $0)
- ✅ Missing Data sheet (returns error)
- ✅ Invalid period parameter (returns error)
- ✅ Month name variations (Jan/January, Sept/September)
- ✅ Categories not found in transactions (shows $0)

---

## 🎯 Next Steps

1. **Deploy the Apps Script update** (instructions above)
2. **Test in production** (checklist above)
3. **Add a new expense category** to verify auto-sync works
4. **Monitor for any errors** in Apps Script logs or browser console

---

## 📞 Support

If you encounter issues:
1. Check Apps Script logs: Script Editor → Execution Log
2. Check browser console for frontend errors
3. Verify Data sheet has categories in Column B starting from B2
4. Ensure transactions have proper date format (month names)

---

**Status:** ✅ Code updated, ready to deploy  
**Impact:** 🟢 Low risk - only changes backend data aggregation  
**Rollback:** Previous version still available in Apps Script deployment history
