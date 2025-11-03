# 📊 BookMate Data Source Reference Guide

## Official Data Source Mapping

This document defines the **single source of truth** for all data types used throughout the webapp. Always refer to this guide when fetching data from Google Sheets.

---

## Google Sheet Information

**Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`  
**Service Account**: `config/google-credentials.json`

---

## 1. REVENUES

### Category Names (Master List)
**Range**: `Data!A2:A`  
**Returns**: Array of revenue category names  
**Count**: 4 items

```typescript
// Example values:
[
  "Revenue - Commision ",
  "Revenue - Sales ",
  "Revenue - Services",
  "Revenue - Rental Income"
]
```

### Monthly Revenue Data
**Range**: `Lists!W:X:Y`  
**Structure**: 
- Column W: Revenue category name
- Column X: Month (JAN, FEB, MAR, etc.)
- Column Y: Value (numeric)

```typescript
// Example data:
Row 2: ["Revenue - Sales", "JAN", "50000"]
Row 3: ["Revenue - Sales", "FEB", "45000"]
Row 4: ["Revenue - Commision", "JAN", "12000"]
```

**Usage**: Fetch both ranges and map category names to monthly values

```typescript
const revenueNames = await sheets.get('Data!A2:A');
const revenueData = await sheets.get('Lists!W:Y');
// Map category + month → value
```

---

## 2. EXPENSES (OVERHEAD)

### Category Names (Master List)
**Range**: `Data!B2:B`  
**Returns**: Array of expense category names  
**Count**: 28 items

```typescript
// Example values:
[
  "EXP - Utilities - Gas",
  "EXP - Utilities - Water",
  "EXP - Utilities  - Electricity",
  "EXP - Administration & General - License & Certificates",
  "EXP - Construction - Structure",
  "EXP - Construction - Overheads/General/Unclassified",
  "EXP - HR - Employees Salaries",
  // ... 21 more
]
```

### Monthly Expense Data
**Range**: `Lists!H:I:J`  
**Structure**: 
- Column H: Expense category name
- Column I: Month (JAN, FEB, MAR, etc.)
- Column J: Value (numeric)

```typescript
// Example data:
Row 2: ["EXP - Utilities - Gas", "JAN", "3500"]
Row 3: ["EXP - Utilities - Gas", "FEB", "3200"]
Row 4: ["EXP - Utilities - Water", "JAN", "1500"]
```

**Usage**: Fetch both ranges and map category names to monthly values

```typescript
const expenseNames = await sheets.get('Data!B2:B');
const expenseData = await sheets.get('Lists!H:J');
// Map category + month → value
```

---

## 3. TYPE OF PAYMENTS

### Category Names (Master List)
**Range**: `Data!D2:D`  
**Returns**: Array of payment type names  
**Count**: 5 items

```typescript
// Example values:
[
  "Bank Transfer - Bangkok Bank - Shaun Ducker",
  "Bank Transfer - Bangkok Bank - Maria Ren",
  "Bank transfer - Krung Thai Bank - Family Account",
  "Cash",
  "Alesia Cash"
]
```

### Monthly Payment Data
**Range**: `Lists!R:S:T`  
**Structure**: 
- Column R: Payment type category name
- Column S: Month (JAN, FEB, MAR, etc.)
- Column T: Value (numeric)

```typescript
// Example data:
Row 2: ["Cash", "JAN", "25000"]
Row 3: ["Cash", "FEB", "18000"]
Row 4: ["Bank Transfer - Bangkok Bank - Shaun Ducker", "JAN", "50000"]
```

**Usage**: For bank account dropdowns and payment tracking

```typescript
const paymentNames = await sheets.get('Data!D2:D');
const paymentData = await sheets.get('Lists!R:T');
// Map category + month → value
```

---

## 4. PROPERTIES

### Category Names (Master List)
**Range**: `Data!C2:C`  
**Returns**: Array of property names  
**Count**: 7 items

```typescript
// Example values:
[
  "Sia Moon - Land - General",
  "Alesia House",
  "Lanna House",
  "Parents House",
  "Shaun Ducker - Personal",
  "Maria Ren - Personal",
  "Family"
]
```

### Monthly Property Data
**Range**: `Lists!M:N:O`  
**Structure**: 
- Column M: Property category name
- Column N: Month (JAN, FEB, MAR, etc.)
- Column O: Value (numeric)

```typescript
// Example data:
Row 2: ["Alesia House", "JAN", "15000"]
Row 3: ["Alesia House", "FEB", "15000"]
Row 4: ["Lanna House", "JAN", "12000"]
```

**Usage**: For property selection dropdowns and property-specific reports

```typescript
const propertyNames = await sheets.get('Data!C2:C');
const propertyData = await sheets.get('Lists!M:O');
// Map category + month → value
```

---

## 5. DATES / MONTHS

### Month Headers
**Range**: `'P&L (DO NOT EDIT)'!4:4`  
**Returns**: Full row 4 containing month abbreviations  
**Count**: 12 months (JAN through DEC)

```typescript
// Example values (row 4, columns E through P):
["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
```

**Usage**: For dynamic month mapping (don't hardcode month indices)

```typescript
const monthHeaders = await sheets.get("'P&L (DO NOT EDIT)'!4:4");
const monthMap = {};
monthHeaders[0].forEach((month, index) => {
  monthMap[month.toUpperCase()] = index;
});

// Now you can map: "JAN" → 0, "FEB" → 1, etc.
```

**⚠️ IMPORTANT**: Always fetch month headers dynamically. Never assume JAN=0, FEB=1, etc. The P&L sheet might change column positions.

---

## 6. COMBINED OPERATIONS (Type of Operations)

### Source
**Combine**: `Data!A2:A` (Revenues) + `Data!B2:B` (Expenses)  
**Returns**: Combined array of all revenue and expense categories  
**Count**: 32 items (4 revenues + 28 expenses)

```typescript
// Usage in API:
const revenues = await sheets.get('Data!A2:A');
const expenses = await sheets.get('Data!B2:B');
const allOperations = [...revenues, ...expenses];

// Result:
[
  "Revenue - Commision ",
  "Revenue - Sales ",
  "Revenue - Services",
  "Revenue - Rental Income",
  "EXP - Utilities - Gas",
  "EXP - Utilities - Water",
  // ... 26 more expenses
]
```

**Usage**: For "Type of Operation" dropdowns that include both revenues and expenses

---

## Quick Reference Table

| Data Type | Category Names | Monthly Data | Use Case |
|-----------|---------------|--------------|----------|
| **Revenues** | `Data!A2:A` | `Lists!W:X:Y` | Revenue tracking, income reports |
| **Expenses** | `Data!B2:B` | `Lists!H:I:J` | Expense tracking, overhead reports |
| **Payments** | `Data!D2:D` | `Lists!R:S:T` | Bank account selection, payment methods |
| **Properties** | `Data!C2:C` | `Lists!M:N:O` | Property selection, property reports |
| **Operations** | `Data!A2:A` + `Data!B2:B` | `Lists!W:Y` + `Lists!H:J` | Combined revenue/expense dropdowns |
| **Months** | `'P&L (DO NOT EDIT)'!4:4` | - | Month headers for dynamic mapping |

---

## Batch Fetch Pattern (Recommended)

Instead of making multiple API calls, fetch all ranges in a single batch request:

```typescript
const batchResponse = await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: [
    // Category names
    "Data!A2:A",  // Revenues
    "Data!B2:B",  // Expenses
    "Data!C2:C",  // Properties
    "Data!D2:D",  // Payments
    
    // Monthly data
    "Lists!H:H", "Lists!I:I", "Lists!J:J",  // Expense data
    "Lists!M:M", "Lists!N:N", "Lists!O:O",  // Property data
    "Lists!R:R", "Lists!S:S", "Lists!T:T",  // Payment data
    "Lists!W:W", "Lists!X:X", "Lists!Y:Y",  // Revenue data
    
    // Month headers
    "'P&L (DO NOT EDIT)'!4:4"
  ]
});

// Destructure in order:
const [
  revenuesRange,
  expensesRange,
  propertiesRange,
  paymentsRange,
  expenseCat, expenseMonth, expenseValue,
  propertyCat, propertyMonth, propertyValue,
  paymentCat, paymentMonth, paymentValue,
  revenueCat, revenueMonth, revenueValue,
  monthHeaders
] = batchResponse.data.valueRanges;
```

---

## Data Processing Pattern

### For Category Lists (Dropdowns)
```typescript
// Extract names, skip headers
const extractNames = (range, skipHeaders = ['REVENUES', 'EXPENSES', 'PROPERTY', 'TYPE OF PAYMENT']) => {
  const rows = range?.values || [];
  return rows
    .map(row => row?.[0]?.trim())
    .filter(name => name && !skipHeaders.includes(name));
};

const revenues = extractNames(revenuesRange, ['REVENUES']);
const expenses = extractNames(expensesRange, ['OVERHEAD EXPENSES']);
const properties = extractNames(propertiesRange, ['PROPERTY']);
const payments = extractNames(paymentsRange, ['TYPE OF PAYMENT']);
```

### For Monthly Data
```typescript
// Combine category, month, value into structured data
const buildMonthlyData = (categoryRows, monthRows, valueRows, monthMap) => {
  const dataMap = new Map();
  
  // Initialize all categories
  categories.forEach(name => {
    dataMap.set(name, {
      name,
      monthly: new Array(12).fill(0),
      yearTotal: 0
    });
  });
  
  // Populate values
  const maxRows = Math.max(categoryRows.length, monthRows.length, valueRows.length);
  for (let i = 1; i < maxRows; i++) { // Skip header row
    const category = categoryRows[i]?.[0];
    const month = monthRows[i]?.[0];
    const value = parseFloat(valueRows[i]?.[0]) || 0;
    
    if (!category || !month) continue;
    
    const data = dataMap.get(category);
    if (data) {
      const monthIndex = monthMap[month.toUpperCase()];
      if (monthIndex !== undefined) {
        data.monthly[monthIndex] = value;
        data.yearTotal += value;
      }
    }
  }
  
  return Array.from(dataMap.values());
};
```

---

## API Endpoint: `/api/options`

**Current Implementation**: Already fetches all data using this structure  
**Usage**: All pages should call `/api/options` for dropdown data

```typescript
// GET /api/options
{
  "ok": true,
  "data": {
    "properties": [...],           // From Data!C2:C (7 items)
    "typeOfOperations": [...],     // From Data!A2:A + Data!B2:B (32 items)
    "typeOfPayments": [            // From Data!D2:D + Lists!R:S:T (5 items)
      {
        "name": "Cash",
        "monthly": [0,0,0,0,0,0,0,0,0,0,0,0],
        "yearTotal": 0
      }
    ]
  },
  "updatedAt": "2025-11-03T12:00:00.000Z",
  "source": "google_sheets_lists"
}
```

---

## Common Use Cases

### 1. Property Dropdown
```typescript
const response = await fetch('/api/options');
const { properties } = response.data;
// Use: properties array for <select> options
```

### 2. Revenue/Expense Category Dropdown
```typescript
const response = await fetch('/api/options');
const { typeOfOperations } = response.data;
// Use: typeOfOperations array (includes both revenues and expenses)
```

### 3. Bank Account Selection
```typescript
const response = await fetch('/api/options');
const { typeOfPayments } = response.data;
const bankNames = typeOfPayments.map(p => p.name);
// Use: bankNames array for bank selection
```

### 4. Monthly Revenue Report
```typescript
const response = await fetch('/api/options');
const { typeOfPayments } = response.data;
// Each payment type has monthly[] array and yearTotal
const cashPayments = typeOfPayments.find(p => p.name === 'Cash');
console.log('January:', cashPayments.monthly[0]);
console.log('Year Total:', cashPayments.yearTotal);
```

---

## ⚠️ Important Rules

1. **Never Hardcode Data**: Always fetch from Google Sheets
2. **Use Batch Requests**: Fetch multiple ranges in one API call
3. **Dynamic Month Mapping**: Always fetch month headers from P&L!4:4
4. **Consistent Naming**: Use exact column names from this guide
5. **Fallback Support**: Handle cases where Google Sheets is unavailable
6. **Cache Appropriately**: Use cache-busting for real-time data (`?t=${Date.now()}`)

---

## Future Expansions

When you need to add new data types:

1. **Add to Data Sheet**: Create a new column in the Data sheet
2. **Add to Lists Sheet**: Create corresponding category-month-value columns
3. **Update `/api/options`**: Add the new ranges to the batch request
4. **Document Here**: Add the new data type to this guide

---

**Last Updated**: 2025-11-03  
**Maintained By**: Engineering Team  
**Status**: ✅ Production Reference

This is the **official source of truth** for all data fetching operations in the BookMate webapp.
