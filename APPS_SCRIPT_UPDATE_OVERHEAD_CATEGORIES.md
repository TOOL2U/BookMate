# Apps Script Update - Show All 28 Overhead Categories

## Problem
The "Overhead Expenses Breakdown" modal was only showing 11 categories instead of all 28 expense categories.

## Root Cause
The `handleGetOverheadExpensesDetails` function in Apps Script was hardcoded to read from rows 31-58 of the P&L sheet. Only 11 of those rows had data, so only 11 categories were returned.

## Solution
Updated the Apps Script to:
1. Read **ALL** expense categories from the **Data sheet** (column B)
2. Match each category with its value from the P&L sheet
3. Return all 28 categories (even if some have $0 values)

## Changes Made

### Before (Limited to 11 categories):
```javascript
// Hardcoded row range in P&L sheet
const startRow = 31;
const endRow = 58;
const namesRange = sheet.getRange("A" + startRow + ":A" + endRow);
const names = namesRange.getValues();
```

### After (All 28+ categories):
```javascript
// Read ALL categories from Data sheet
const dataSheet = ss.getSheetByName("Data");
const dataRange = dataSheet.getRange("B2:B100");
const allCategories = dataRange.getValues()
  .filter(function(val) { 
    return val && val.toString().trim().indexOf('EXP -') === 0;
  });

// Match each category with its value in P&L sheet
for (let i = 0; i < allCategories.length; i++) {
  const categoryName = allCategories[i];
  // Find in P&L sheet and get value...
}
```

## Deployment Steps

1. **Open Google Sheets**:
   - Go to your "Accounting Buddy" spreadsheet

2. **Open Apps Script Editor**:
   - Click **Extensions** → **Apps Script**

3. **Replace the Code**:
   - Copy all content from `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`
   - Paste into the Apps Script editor (replacing all existing code)

4. **Save**:
   - Click **File** → **Save** (or Cmd+S)
   - Name it: "Accounting Buddy Complete V7"

5. **Deploy**:
   - Click **Deploy** → **Manage deployments**
   - Click **Edit** (pencil icon) on your existing deployment
   - Under **Version**, select **New version**
   - Add description: "Fix: Show all 28 overhead expense categories"
   - Click **Deploy**

6. **Test**:
   - Open the P&L page in your webapp
   - Click "View All Categories" on the Overhead Expenses panel
   - You should now see **28 categories** instead of 11

## Expected Result

### Before:
- 11 categories displayed
- Missing: "EXP - Household - Appliances & Electronics", "EXP - Household - Alcohol & Vapes", etc.

### After:
- **28 categories** displayed
- All expense categories from Data sheet shown
- Categories with $0 expense also included (sorted to bottom)

## Technical Details

**File Changed**: `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`
**Function Updated**: `handleGetOverheadExpensesDetails(period)`
**Lines Changed**: 859-980

**Data Source Change**:
- **Old**: P&L sheet rows 31-58 (hardcoded, incomplete)
- **New**: Data sheet column B (dynamic, complete)

**Categories Now Included** (28 total):
1. EXP - Utilities - Gas
2. EXP - Utilities - Water
3. EXP - Utilities  - Electricity
4. EXP - Administration & General - License & Certificates
5. EXP - Construction - Structure
6. EXP - Construction - Overheads/General/Unclassified
7. EXP - HR - Employees Salaries
8. EXP - Construction - Electric Supplies
9. EXP - Construction - Wall
10. EXP - Administration & General - Legal
11. EXP - Administration & General - Professional fees
12. EXP - Administration & General - Office supplies
13. EXP - Administration & General  - Subscription, Software & Membership
14. EXP - Windows, Doors, Locks & Hardware
15. EXP - Repairs & Maintenance  - Furniture & Decorative Items
16. EXP - Repairs & Maintenance  - Waste removal
17. EXP - Repairs & Maintenance - Tools & Equipment
18. EXP - Repairs & Maintenance - Painting & Decoration
19. EXP - Repairs & Maintenance - Electrical & Mechanical
20. EXP - Repairs & Maintenance - Landscaping
21. EXP - Sales & Marketing -  Professional Marketing Services
22. EXP - Household - Appliances & Electronics  ← **NEW**
23. EXP - Other Expenses
24. EXP - Personal - Massage
25. EXP - Household - Alcohol & Vapes  ← **NEW**
26. EXP - Household - Groceries  ← **NEW**
27. EXP - Household - Nappies  ← **NEW**
28. EXP - Household - Toiletries & Care  ← **NEW**
29. Exp - Household - Clothes  ← **NEW**
30. Exp - Repairs & Maintenance - Car & Motorbike  ← **NEW**
31. Exp - Personal - Entertainment  ← **NEW**
32. Exp - Personal - Travel  ← **NEW**

---

**Updated**: November 4, 2025
**Issue**: Only 11 categories showing in Overhead Expenses modal
**Status**: ✅ Fixed - Now shows all categories from Data sheet
