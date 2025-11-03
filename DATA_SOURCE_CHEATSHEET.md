# 📋 Quick Data Source Cheat Sheet

## Google Sheet: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`

---

## 🎯 Where to Get Data

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SHEET (Category Names)                   │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   Column A   │   Column B   │   Column C   │      Column D        │
│   REVENUES   │   EXPENSES   │  PROPERTIES  │  TYPE OF PAYMENT     │
│   Data!A2:A  │  Data!B2:B   │  Data!C2:C   │     Data!D2:D        │
│   (4 items)  │  (28 items)  │  (7 items)   │     (5 items)        │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│              LISTS SHEET (Monthly Values)                        │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   H : I : J  │  M : N : O   │  R : S : T   │     W : X : Y        │
│   EXPENSES   │  PROPERTIES  │   PAYMENTS   │      REVENUES        │
│ Cat│Mo│Val   │ Cat│Mo│Val   │ Cat│Mo│Val   │    Cat│Mo│Val       │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                   P&L SHEET (Month Headers)                      │
│              'P&L (DO NOT EDIT)'!4:4 (Row 4)                     │
│     JAN | FEB | MAR | APR | MAY | JUN | JUL | AUG | SEP |...     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Copy-Paste Ranges

### For Category Names Only
```javascript
const ranges = [
  "Data!A2:A",  // Revenues (4)
  "Data!B2:B",  // Expenses (28)
  "Data!C2:C",  // Properties (7)
  "Data!D2:D"   // Payments (5)
];
```

### For Monthly Data
```javascript
const ranges = [
  "Lists!H:H", "Lists!I:I", "Lists!J:J",  // Expenses
  "Lists!M:M", "Lists!N:N", "Lists!O:O",  // Properties
  "Lists!R:R", "Lists!S:S", "Lists!T:T",  // Payments
  "Lists!W:W", "Lists!X:X", "Lists!Y:Y"   // Revenues
];
```

### Complete Batch (Everything)
```javascript
const ranges = [
  // Categories
  "Data!A2:A", "Data!B2:B", "Data!C2:C", "Data!D2:D",
  // Monthly: Expenses
  "Lists!H:H", "Lists!I:I", "Lists!J:J",
  // Monthly: Properties
  "Lists!M:M", "Lists!N:N", "Lists!O:O",
  // Monthly: Payments
  "Lists!R:R", "Lists!S:S", "Lists!T:T",
  // Monthly: Revenues
  "Lists!W:W", "Lists!X:X", "Lists!Y:Y",
  // Month headers
  "'P&L (DO NOT EDIT)'!4:4"
];
```

---

## 💡 Common Patterns

### Get All Properties
```typescript
const response = await fetch('/api/options');
const properties = response.data.properties;
// ["Alesia House", "Lanna House", ...]
```

### Get All Bank Accounts
```typescript
const response = await fetch('/api/options');
const banks = response.data.typeOfPayments.map(p => p.name);
// ["Cash", "Bank Transfer - Bangkok Bank", ...]
```

### Get Combined Revenue + Expense Categories
```typescript
const response = await fetch('/api/options');
const operations = response.data.typeOfOperations;
// ["Revenue - Sales", "EXP - Utilities - Gas", ...]
```

---

## 📊 Data Structure

### Simple Arrays (for dropdowns)
```javascript
properties: ["Alesia House", "Lanna House", ...]
```

### Objects with Monthly Data
```javascript
typeOfPayments: [
  {
    name: "Cash",
    monthly: [12000, 9500, 10000, ...],  // 12 months
    yearTotal: 135000
  }
]
```

---

## ⚡ Production Endpoint

**Use**: `GET /api/options`

**Returns**:
- `data.properties` - 7 items
- `data.typeOfOperations` - 32 items (revenues + expenses)
- `data.typeOfPayments` - 5 items with monthly data

---

## 🔑 Remember

1. ✅ Always use `/api/options` API (don't query Sheets directly)
2. ✅ Data!C = Properties (NOT Data!A)
3. ✅ Combine Data!A + Data!B for complete operations list
4. ✅ Month headers from P&L row 4 (dynamic mapping)
5. ✅ Lists columns are in groups of 3 (Category, Month, Value)

---

**Quick Access**: See `DATA_SOURCE_REFERENCE.md` for complete details
