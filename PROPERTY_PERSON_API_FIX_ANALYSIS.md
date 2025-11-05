# Property/Person API Fix Analysis - November 5, 2024

## Issue Summary
The `/api/pnl/property-person` endpoint is returning incorrect data as reported by the mobile app team. The webapp dashboard is also affected.

## Root Cause Analysis

### Current Implementation (WRONG ❌)
**File:** `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`, Line 773

The `handleGetPropertyPersonDetails()` function is **hardcoded** to read:
- **Names:** Rows 14-20, Column A
- **Values:** Rows 14-20, Column N (month) or Q (year)

```javascript
// HARDCODED - This is the problem!
const nameRange = sheet.getRange("A14:A20");
const valueRange = sheet.getRange(valueColumn + "14:" + valueColumn + "20");
```

### Problems:
1. ❌ **Fixed row range** - Doesn't adapt to spreadsheet changes
2. ❌ **Includes header rows** - Returns "Total Revenue", "PROPERTY OR PERSON" in data
3. ❌ **Missing properties** - Only reads 7 rows, but might have header rows mixed in
4. ❌ **Wrong column detection** - May not be finding the correct month column

## Working Reference: Overhead Expenses

The **overhead expenses endpoint WORKS** because it:
✅ Reads ALL categories from **Data sheet** (dynamic)
✅ Matches them against P&L sheet (flexible)
✅ Filters out header rows
✅ Returns only actual expense categories

**File:** `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`, Line 873

```javascript
// CORRECT APPROACH (from overhead expenses)
const dataSheet = ss.getSheetByName("Data");
const allCategories = dataSheet.getRange("B2:B100").getValues()
  .filter(function(val) { 
    return val.toString().indexOf('EXP -') === 0;
  });

// Then matches them in P&L sheet dynamically
```

## Recommended Fix

### Option 1: Use Data Sheet (RECOMMENDED ✅)
Update `handleGetPropertyPersonDetails()` to:
1. Read property/person names from **Data sheet** (like overhead does)
2. Match them against P&L sheet dynamically
3. Filter out header rows
4. Support all 7 properties dynamically

### Option 2: Fix Row Detection
Keep current approach but:
1. Detect the actual row range for property/person section
2. Skip header rows ("Total Revenue", "PROPERTY OR PERSON")
3. Read until empty row

## Expected Properties (From P&L Sheet)

According to the mobile team, these 7 properties should be returned:

1. Sia Moon - Land - General
2. Alesia House
3. Lanna House ← Currently missing
4. Parents House ← Currently missing
5. Shaun Ducker - Personal ← Currently missing
6. Maria Ren - Personal ← Currently missing
7. Family ← Currently missing

## Data Sheet Structure Check

Let me verify if properties are in the Data sheet:

Need to check:
- Data sheet, Column ??? (need to identify which column has property/person names)
- Similar to how overhead categories are in Data!B2:B

## Proposed Solution Code

```javascript
function handleGetPropertyPersonDetails(period) {
  try {
    Logger.log('=== Property/Person Details Request ===');
    Logger.log('Period: ' + period);

    if (!period || !['month', 'year'].includes(period)) {
      return createErrorResponse('Invalid period. Must be "month" or "year".');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pnlSheet = ss.getSheetByName("P&L (DO NOT EDIT)");
    const dataSheet = ss.getSheetByName("Data");

    if (!pnlSheet) {
      return createErrorResponse('P&L sheet not found.');
    }
    
    if (!dataSheet) {
      return createErrorResponse('Data sheet not found.');
    }

    // Get ALL property/person names from Data sheet
    // TODO: Identify which column in Data sheet has property names
    // Assumption: Data!D2:D or similar (need to verify)
    const dataRange = dataSheet.getRange("D2:D100");  // Adjust column as needed
    const allProperties = dataRange.getValues()
      .map(function(row) { return row[0]; })
      .filter(function(val) { 
        if (!val) return false;
        const str = val.toString().trim();
        // Filter for actual property names (exclude headers)
        return str !== '' && 
               str !== 'Total Revenue' && 
               str !== 'PROPERTY OR PERSON';
      });
    
    Logger.log('Found ' + allProperties.length + ' property/person items from Data sheet');
    
    // Determine which column to use based on period
    let valueColumn;
    if (period === 'month') {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
      const currentMonth = months[new Date().getMonth()];
      const headerRow = pnlSheet.getRange("A4:Z4").getValues()[0];
      
      let monthColumnIndex = null;
      for (let i = 0; i < headerRow.length; i++) {
        if (headerRow[i] && headerRow[i].toString().toUpperCase().trim() === currentMonth) {
          monthColumnIndex = i + 1;
          break;
        }
      }
      
      if (!monthColumnIndex) {
        return createErrorResponse('Could not find current month column');
      }
      
      valueColumn = String.fromCharCode(64 + monthColumnIndex);
      Logger.log('Using month column: ' + valueColumn + ' for ' + currentMonth);
    } else {
      valueColumn = 'Q';
      Logger.log('Using year column: Q');
    }
    
    // Get ALL rows from P&L sheet column A to find matching properties
    const pnlNamesRange = pnlSheet.getRange("A1:A100");
    const pnlNames = pnlNamesRange.getValues();
    
    // Build the data array by matching properties from Data sheet with values from P&L sheet
    const data = [];
    let totalExpense = 0;
    
    for (let i = 0; i < allProperties.length; i++) {
      const propertyName = allProperties[i].toString().trim();
      
      // Find this property in P&L sheet column A
      let pnlRowIndex = -1;
      for (let j = 0; j < pnlNames.length; j++) {
        if (pnlNames[j][0] && pnlNames[j][0].toString().trim() === propertyName) {
          pnlRowIndex = j + 1;
          break;
        }
      }
      
      // Get the expense value from P&L sheet (or 0 if not found)
      let expense = 0;
      if (pnlRowIndex > 0) {
        const cellValue = pnlSheet.getRange(valueColumn + pnlRowIndex).getValue();
        expense = parseFloat(cellValue) || 0;
      }
      
      data.push({
        name: propertyName,
        expense: expense
      });
      totalExpense += expense;
    }
    
    // Calculate percentages
    data.forEach(function(item) {
      item.percentage = totalExpense > 0 ? (item.expense / totalExpense) * 100 : 0;
    });
    
    // Sort by expense amount (descending)
    data.sort(function(a, b) {
      return b.expense - a.expense;
    });
    
    Logger.log('✓ Found ' + data.length + ' property/person items, total: ' + totalExpense);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        data: data,
        period: period,
        totalExpense: totalExpense,
        count: data.length,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('ERROR in handleGetPropertyPersonDetails: ' + error.toString());
    return createErrorResponse('Property/Person details error: ' + error.toString());
  }
}
```

## Next Steps

1. **Identify Property Column in Data Sheet**
   - Need to check which column in "Data" sheet has property/person names
   - Could be column D, C, or another column

2. **Update Apps Script**
   - Replace hardcoded row range with dynamic Data sheet lookup
   - Follow the same pattern as overhead expenses function

3. **Test**
   - Test month endpoint
   - Test year endpoint
   - Verify all 7 properties are returned
   - Verify correct totals

4. **Deploy**
   - Update COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js
   - Deploy to Google Apps Script
   - Test from both webapp and mobile app

## Impact

### Webapp:
- Dashboard "Expense Breakdown Donut" chart will show property categories correctly
- Modal popups will display correct property/person expenses

### Mobile App:
- Property/Person modal will display all 7 properties with correct amounts
- Total will match P&L summary (฿44,753 for November)

## Questions to Answer

1. **Where are property names stored in Data sheet?**
   - Need to identify the column

2. **Are there any property name variations?**
   - Case sensitivity?
   - Exact match vs. partial match?

3. **Should we filter properties in any way?**
   - Only active properties?
   - Exclude certain patterns?

## Testing Commands

After fix is deployed:

```bash
# Test month endpoint
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=month" | jq .

# Test year endpoint
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=year" | jq .

# Verify count
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=month" | jq '.data | length'
# Should return: 7

# Verify total
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=month" | jq '.totalExpense'
# Should return: 44753 (for November 2025)
```

## Status

🔴 **WAITING FOR INFORMATION**
- Need to identify which column in Data sheet contains property/person names

Once identified, the fix can be implemented following the overhead expenses pattern.
