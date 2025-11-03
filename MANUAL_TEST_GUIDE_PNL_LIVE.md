# 🧪 Manual Test Guide - P&L Live Integration

**Date:** November 3, 2025  
**Status:** ✅ Ready for Testing  

---

## 🎯 Test Objectives

1. Verify `/api/pnl/live` integration works
2. Confirm THB currency formatting
3. Test category auto-sync (5-minute cache)
4. Validate data accuracy against Google Sheets

---

## 📋 Test 1: Basic Page Load

### Steps:
1. Start dev server:
   ```bash
   cd /Users/shaunducker/Desktop/BookMate-webapp
   npm run dev
   ```

2. Open browser to: `http://localhost:3000/pnl`

3. Check the following:

### ✅ Expected Results:
- [ ] Page loads without errors
- [ ] KPI cards show numbers (not loading state)
- [ ] Footer shows "Last updated: [timestamp]"
- [ ] Footer shows "Source: Lists Sheet (Formula-based)"
- [ ] Footer shows "This Month: ฿X,XXX" (THB format)
- [ ] Refresh button works (shows spinning icon)

### 📸 Screenshot Checklist:
- Top section with KPI cards
- Footer with cache status
- No console errors in browser DevTools

---

## 📋 Test 2: Currency Formatting (THB)

### Steps:
1. Open browser console (F12 → Console tab)
2. Refresh the page
3. Look for formatted currency in footer

### ✅ Expected Results:
- [ ] Currency shows ฿ symbol (Thai Baht)
- [ ] Thousands separator: ฿1,065 (not ฿1065)
- [ ] No decimal places for whole numbers
- [ ] Negative values show: -฿2,130 (if applicable)

### 🔍 Console Check:
Look for logs like:
```
✅ Using cached data (45s old)
📅 Months: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
```

---

## 📋 Test 3: Month Name Formatting

### Steps:
1. Open browser console
2. Check the logged months

### ✅ Expected Results:
- [ ] Console shows: "Months: Jan, Feb, Mar..." (not "JAN, FEB, MAR...")
- [ ] September shows as "Sep" (not "SEPT")
- [ ] All 12 months logged

---

## 📋 Test 4: Cache Mechanism (5 Minutes)

### Steps:
1. Load page → Note timestamp in footer
2. Wait 10 seconds → Refresh page
3. Check footer for "Cached (Xs ago)"
4. Wait 5+ minutes → Refresh page
5. Check if timestamp updates

### ✅ Expected Results:
- [ ] **Within 5 min:** Footer shows "Cached (45s ago)" or similar
- [ ] **Within 5 min:** Same data returned (fast load)
- [ ] **After 5 min:** Cache refreshes (slightly slower load)
- [ ] **After 5 min:** New timestamp in footer
- [ ] Console shows "📊 Fresh data from Google Sheets"

### 📊 Cache Behavior:
| Time | Expected Behavior |
|------|-------------------|
| 0s | Fresh fetch (~1-2s load) |
| 30s | Cached (< 100ms load) |
| 1min | Cached (< 100ms load) |
| 4min | Cached (< 100ms load) |
| 6min | Fresh fetch (~1-2s load) |

---

## 📋 Test 5: Category Auto-Sync ⭐ **IMPORTANT**

This test verifies that new categories automatically appear without code changes.

### Part A: Add New Category

1. Open Google Sheets:
   ```
   https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
   ```

2. Go to "Data" sheet

3. Scroll to Column B (Overhead categories)

4. Find the last row with data (currently row 30: "test final")

5. Add new category in next empty cell (e.g., B31):
   ```
   EXP - Test Auto Sync - [Your Name]
   ```

6. Save (Ctrl+S / Cmd+S)

### Part B: Clear Cache

Since we just added the category, we need to wait 5 minutes OR manually clear cache:

**Option 1: Wait 5 minutes**
- Just wait, no action needed

**Option 2: Manual cache clear (faster)**
```bash
curl -X POST http://localhost:3000/api/pnl/live \
  -H "Content-Type: application/json" \
  -d '{"action":"clearCache"}'
```

Expected response:
```json
{"ok":true,"message":"Cache cleared successfully"}
```

### Part C: Verify in Webapp

1. Refresh P&L dashboard (`http://localhost:3000/pnl`)

2. Open browser console

3. Look for category count in logs:
   ```
   📋 Categories: Revenue=4, Overhead=30, Property=7, Payment=4
   ```
   (Should be 30 instead of 29 if new category added)

4. Click "View All Categories" in Overheads section

5. Scroll through modal to find your new category

### ✅ Expected Results:
- [ ] Console shows Overhead count increased (29 → 30)
- [ ] New category appears in overhead modal
- [ ] New category shows ฿0 (no transactions yet)
- [ ] Page didn't need code changes or rebuild

### Part D: Add Transaction (Optional)

1. Go to "BookMate P&L 2025" sheet

2. Add a row with your new category:
   ```
   Day: 3
   Month: Nov
   Year: 2025
   Property: Sia Moon - Land - General
   Type of operation: EXP - Test Auto Sync - [Your Name]
   Type of payment: Bank Transfer - Bangkok Bank - Shaun Ducker
   Detail: Test transaction
   Debit: 500
   Credit: 0
   ```

3. Wait 5 minutes OR clear cache again

4. Refresh webapp

5. Check if:
   - November total increased by ฿500
   - Your category shows ฿500 (not ฿0)
   - Grand total includes the ฿500

### ✅ Expected Results:
- [ ] November overhead increases by ฿500
- [ ] New category shows ฿500 in modal
- [ ] Grand total in footer increases
- [ ] No code changes needed

---

## 📋 Test 6: Data Accuracy

### Steps:

1. **Check Google Sheets:**
   - Open "Lists" sheet
   - Look at Overhead block (Columns H:J)
   - Note November values for any category

2. **Check Webapp:**
   - Load P&L dashboard
   - Click "View All Categories" in Overheads
   - Find the same category
   - Compare values

### ✅ Expected Results:
- [ ] Webapp values EXACTLY match Lists sheet
- [ ] Month totals match
- [ ] Year totals match
- [ ] GOP calculation correct: Revenue - Overhead - Property

### 🔍 Specific Checks:

**Current Data (as of Nov 3, 2025):**
| Category | Lists Sheet | Webapp |
|----------|-------------|--------|
| EXP - Other Expenses | ฿590 (Nov) | ฿590 |
| EXP - Household - Alcohol | ฿475 (Nov) | ฿475 |
| Total Overhead (Nov) | ฿1,065 | ฿1,065 |
| Total Overhead (Year) | ฿1,065 | ฿1,065 |

---

## 📋 Test 7: Error Handling

### Steps:

1. **Test API Failure:**
   - Temporarily rename `.env.local` to `.env.local.backup`
   - Refresh page
   - Check error display

### ✅ Expected Results:
- [ ] Error toast appears in bottom-right
- [ ] Shows "Couldn't fetch P&L data"
- [ ] "Retry" button visible
- [ ] Clicking "Retry" attempts to reload

2. **Restore and Test:**
   - Rename back to `.env.local`
   - Click "Retry" button
   - Data should load successfully

---

## 📋 Test 8: Month/Year Toggle

### Steps:

1. Click "Month View" button (should already be active)
2. Note the GOP value in footer
3. Click "Year View" button
4. Note the GOP value changes

### ✅ Expected Results:
- [ ] "Month View" button highlights when active
- [ ] "Year View" button highlights when active
- [ ] Footer GOP updates to show correct period
- [ ] KPI cards update (though this is controlled by separate component)

---

## 📊 Test Summary Sheet

Use this checklist to track your testing:

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Basic Page Load | ⬜ | |
| 2 | Currency Formatting | ⬜ | |
| 3 | Month Name Formatting | ⬜ | |
| 4 | Cache Mechanism | ⬜ | |
| 5 | Category Auto-Sync | ⬜ | ⭐ Most Important |
| 6 | Data Accuracy | ⬜ | |
| 7 | Error Handling | ⬜ | |
| 8 | Month/Year Toggle | ⬜ | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Partial pass

---

## 🐛 Bug Reporting Template

If you find issues, use this template:

```
**Test #:** [Number]
**Test Name:** [Name]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshot:** [Attach if applicable]
**Console Errors:** [Copy any errors from browser console]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

## ✅ Success Criteria

All tests must pass for production deployment:

- ✅ Page loads without errors
- ✅ THB currency displays correctly (฿1,065)
- ✅ Months formatted correctly (Jan, Feb, not JAN, FEB)
- ✅ 5-minute cache working
- ✅ **New categories appear automatically** ⭐
- ✅ Data matches Google Sheets exactly
- ✅ Error handling works
- ✅ Month/Year toggle works

---

## 🚀 After Testing

### If All Tests Pass:
```bash
# Commit and deploy
git add .
git commit -m "feat: P&L live integration with THB formatting and auto-sync"
git push origin main

# Vercel auto-deploys to production
# Test at: https://accounting.siamoon.com/pnl
```

### If Tests Fail:
- Document failures using bug template above
- Share with development team
- DO NOT deploy to production

---

**Testing Duration:** ~30 minutes  
**Most Critical Test:** Test #5 (Category Auto-Sync)  
**Documentation:** PNL_LIVE_FRONTEND_COMPLETE.md
