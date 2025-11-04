# Mobile Team - Data Integration Guide

## Quick Start

### For Mobile App Developers
If you're building the mobile app and just need to **consume data from the web app**:

1. **Primary Endpoint**: `GET https://your-vercel-app.vercel.app/api/options`
2. **Returns**: All dropdown options, categories, and monthly data
3. **Cache**: Data is fresh from Google Sheets (no stale cache)

### API Response Structure
```typescript
{
  "ok": true,
  "data": {
    "properties": [
      "Alesia House",
      "Lanna House",
      // ... 7 total properties
    ],
    "typeOfOperations": [
      "Revenue - Commision",
      "Revenue - Sales",
      "EXP - Utilities - Gas",
      // ... 32 total (4 revenues + 28 expenses)
    ],
    "typeOfPayments": [
      {
        "name": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash - Family",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
      // ... 5 total payment types
    ]
  }
}
```

---

## When You Need to Go Deeper

### Building New Features?
If you need to:
- Create new API endpoints
- Modify data fetching logic
- Implement direct Google Sheets access
- Build admin features

**Read these files in order**:

1. **`DATA_SOURCE_CHEATSHEET.md`** ← Start here (quick visual reference)
   - Shows exactly which Google Sheets ranges contain what data
   - Copy-paste ready code snippets
   - Common patterns

2. **`DATA_SOURCE_REFERENCE.md`** ← Complete guide (400+ lines)
   - Detailed explanation of all 17 ranges
   - Batch fetch patterns
   - Data processing examples
   - Edge cases and gotchas

3. **`GOOGLE_SHEETS_INTEGRATION_COMPLETE.md`** ← Technical implementation
   - How the web app fetches data
   - Service account setup
   - Performance notes

---

## Quick Reference: Google Sheets Structure

### Spreadsheet ID
```
1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
```

### Data Sheet (Category Names)
```
Column A = Revenues (4 items)
Column B = Expenses (28 items)
Column C = Properties (7 items)
Column D = Payment Types (5 items)
```

### Lists Sheet (Monthly Values)
```
H:I:J = Overhead Expenses (Category, Month, Value)
M:N:O = Properties (Category, Month, Value)
R:S:T = Payments (Category, Month, Value)
W:X:Y = Revenues (Category, Month, Value)
```

### P&L Sheet
```
Row 4 = Month headers (JAN, FEB, MAR, ...)
```

---

## Testing the API

### From Command Line
```bash
# Test production endpoint
curl https://your-vercel-app.vercel.app/api/options | jq '.data | keys'

# Test locally (if running web app)
curl http://localhost:3000/api/options | jq '.data | keys'
```

### Expected Response Keys
```json
{
  "ok": true,
  "data": {
    "properties": [...],
    "typeOfOperations": [...],
    "typeOfPayments": [...]
  },
  "source": "google_sheets_lists",
  "cached": false
}
```

---

## Common Mobile Use Cases

### 1. Populate Property Dropdown
```typescript
const response = await fetch('https://your-app.vercel.app/api/options');
const data = await response.json();

// Use properties array directly
const propertyPicker = data.data.properties;
// ["Alesia House", "Lanna House", "Sia Moon - Land - General", ...]
```

### 2. Populate Revenue/Expense Category Picker
```typescript
const response = await fetch('https://your-app.vercel.app/api/options');
const data = await response.json();

// All categories combined (revenues + expenses)
const categories = data.data.typeOfOperations;
// ["Revenue - Commision", "Revenue - Sales", "EXP - Utilities - Gas", ...]
```

### 3. Populate Bank Account Picker
```typescript
const response = await fetch('https://your-app.vercel.app/api/options');
const data = await response.json();

// Extract bank names from payment type objects
const bankAccounts = data.data.typeOfPayments.map(payment => payment.name);
// ["Bank Transfer - Bangkok Bank - Shaun Ducker", "Cash - Family", ...]
```

### 4. Get Monthly Data for a Payment Type
```typescript
const response = await fetch('https://your-app.vercel.app/api/options');
const data = await response.json();

// Find a specific payment type
const cashPayment = data.data.typeOfPayments.find(p => p.name === "Cash - Family");

console.log(cashPayment.monthly); // [0, 0, 0, ...]
console.log(cashPayment.yearTotal); // 0
```

---

## Direct Google Sheets Access (Advanced)

If you need to implement direct Google Sheets access in the mobile app:

### Authentication
- Use the same service account: `accounting-buddy-476114-82555a53603b.json`
- Set up Google Sheets API in your mobile project
- Use OAuth2 service account authentication

### Batch Fetch Pattern
```typescript
// Fetch all 17 ranges in a single request
const ranges = [
  "Data!A2:A", "Data!B2:B", "Data!C2:C", "Data!D2:D",
  "Lists!H:H", "Lists!I:I", "Lists!J:J",
  "Lists!M:M", "Lists!N:N", "Lists!O:O",
  "Lists!R:R", "Lists!S:S", "Lists!T:T",
  "Lists!W:W", "Lists!X:X", "Lists!Y:Y",
  "'P&L (DO NOT EDIT)'!4:4"
];

const response = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8',
  ranges: ranges
});
```

See `DATA_SOURCE_REFERENCE.md` for complete implementation details.

---

## Important Rules

### ✅ DO
- Use `/api/options` endpoint for all dropdown data
- Cache responses appropriately in mobile app
- Handle cases where API is unavailable (offline mode)
- Validate data structure matches expected format

### ❌ DON'T
- Hardcode category names, properties, or bank accounts
- Assume fixed array lengths (data grows over time)
- Hardcode month mappings (fetch from P&L!4:4)
- Query Google Sheets directly unless building admin features

---

## Syncing Strategy

### Recommended Approach
1. **On App Launch**: Fetch `/api/options` to get all dropdowns
2. **Cache Locally**: Store in mobile app storage (AsyncStorage, CoreData, etc.)
3. **Refresh Periodically**: Update cache every 24 hours or on pull-to-refresh
4. **Offline Mode**: Use cached data when network unavailable

### Example (React Native)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

async function fetchOptions() {
  try {
    const response = await fetch('https://your-app.vercel.app/api/options');
    const data = await response.json();
    
    // Cache the data
    await AsyncStorage.setItem('app_options', JSON.stringify(data.data));
    
    return data.data;
  } catch (error) {
    // Fallback to cached data if network fails
    const cached = await AsyncStorage.getItem('app_options');
    return cached ? JSON.parse(cached) : null;
  }
}
```

---

## Who to Contact

### Questions About:
- **API Endpoints**: Web team (they manage Vercel deployment)
- **Data Structure**: See `DATA_SOURCE_REFERENCE.md`
- **Google Sheets Access**: Check `config/google-credentials.json` (service account)
- **Bugs in Data**: Check Google Sheets directly or ask data owner

---

## Summary

**Just consuming data?** → Use `/api/options` endpoint, you're done! ✅

**Building new features?** → Read `DATA_SOURCE_CHEATSHEET.md` then `DATA_SOURCE_REFERENCE.md` 📚

**Direct Sheets access?** → Read all three docs + set up service account 🔧

---

**Last Updated**: November 4, 2025  
**Related Files**:
- `DATA_SOURCE_CHEATSHEET.md` - Quick visual reference
- `DATA_SOURCE_REFERENCE.md` - Complete 400+ line guide
- `GOOGLE_SHEETS_INTEGRATION_COMPLETE.md` - Technical implementation details
