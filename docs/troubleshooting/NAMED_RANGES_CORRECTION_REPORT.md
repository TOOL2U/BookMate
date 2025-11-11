# 🚨 NAMED RANGES CORRECTION REPORT

## Issue Found
The Google Sheets named ranges are pointing to **WRONG rows**. The P&L structure has changed but the named ranges were not updated.

## Current (INCORRECT) Named Ranges

| Named Range | Current Cell | Current Value | What It Actually Points To |
|-------------|--------------|---------------|----------------------------|
| `Year_GOP` | Q56 | ฿0 | EXP - Household - Toiletries |
| `Year_EBITDA_Margin` | Q57 | ฿500 | EXP - Other Expenses |
| `Month_GOP` | O56 | (similar) | EXP - Household - Toiletries |
| `Month_EBITDA_Margin` | O57 | (similar) | EXP - Other Expenses |

## Actual P&L Structure (CORRECT)

| Metric | Actual Row | Column A Label |
|--------|-----------|----------------|
| **Total Revenue** | Row 11 | Total Revenue ✅ |
| **Total Overhead Expense** | Row 59 | Total Overhead Expense |
| **GROSS OPERATING PROFIT (EBITDA)** | **Row 61** | GROSS OPERATING PROFIT (EBITDA) |
| **EBITDA Margin** | **Row 63** | Ebitda Margin |

## Required Corrections

### Named Ranges That Need to be Updated in Google Sheets:

1. **`Year_GOP`**
   - Current: `'P&L (DO NOT EDIT)'!Q56`
   - Should be: `'P&L (DO NOT EDIT)'!Q61`
   
2. **`Month_GOP`**
   - Current: `'P&L (DO NOT EDIT)'!O56`
   - Should be: `'P&L (DO NOT EDIT)'!O61`

3. **`Year_EBITDA_Margin`**
   - Current: `'P&L (DO NOT EDIT)'!Q57`
   - Should be: `'P&L (DO NOT EDIT)'!Q63`

4. **`Month_EBITDA_Margin`**
   - Current: `'P&L (DO NOT EDIT)'!O57`
   - Should be: `'P&L (DO NOT EDIT)'!O63`

## Also Check These (Might be Wrong Too)

5. **`Year_Total_Overheads`**
   - Current: `'P&L (DO NOT EDIT)'!Q53`
   - Check if row 59 is correct (Total Overhead Expense is at row 59)
   - Should probably be: `'P&L (DO NOT EDIT)'!Q59`

6. **`Month_Total_Overheads`**
   - Current: `'P&L (DO NOT EDIT)'!O53`
   - Should probably be: `'P&L (DO NOT EDIT)'!O59`

## How to Fix (Manual Steps)

1. **Open Google Sheets**
   - Go to: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit

2. **Go to Data → Named Ranges**

3. **Update Each Named Range:**
   - Find `Year_GOP` → Change range from Q56 to Q61
   - Find `Month_GOP` → Change range from O56 to O61
   - Find `Year_EBITDA_Margin` → Change range from Q57 to Q63
   - Find `Month_EBITDA_Margin` → Change range from O57 to O63
   - Find `Year_Total_Overheads` → Change range from Q53 to Q59
   - Find `Month_Total_Overheads` → Change range from O53 to O59

4. **Save** (Google Sheets saves automatically)

5. **Test** by running:
   ```bash
   node validate-pnl-structure.js
   ```

## Why This Happened

The P&L sheet structure changed (overhead expenses were added/modified), but the named ranges were not updated. The overhead expenses section now goes from Row 31 to Row 58 (28 categories), which shifted all the summary metrics down by several rows.

## Impact

This explains why the P&L data was showing incorrect values! The API was reading:
- Row 57 (฿500) as EBITDA Margin instead of Row 63 (#DIV/0!)
- Row 56 (฿0) as GOP instead of Row 61 (actual GOP)

After fixing these named ranges, the P&L should display correct data.

---

**Created:** November 1, 2025
**Status:** ❌ **REQUIRES MANUAL FIX IN GOOGLE SHEETS**
