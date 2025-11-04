# Endpoint Comparison Results

## Response Structure Differences

### /api/options
```json
{
  "ok": true,
  "source": "google_sheets_lists",
  "cached": false,
  "data": {
    "properties": ["string", "string", ...],
    "typeOfOperations": ["string", "string", ...],  // Combined revenues + expenses
    "typeOfPayments": [
      {
        "name": "string",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
    ]
  }
}
```

### /api/categories/all
```json
{
  "ok": true,
  "data": {
    "revenues": ["string", "string", ...],    // Separated
    "expenses": ["string", "string", ...],    // Separated
    "properties": ["string", "string", ...],
    "payments": ["string", "string", ...]     // Simple strings, NO monthly data
  }
}
```

## Key Differences

| Feature | /api/options | /api/categories/all |
|---------|-------------|---------------------|
| **Revenues & Expenses** | Combined in `typeOfOperations` | Separated: `revenues` + `expenses` |
| **Payment Data** | Objects with `monthly` + `yearTotal` | Simple string array |
| **Properties** | ✅ Included | ✅ Included |
| **Source Info** | ✅ Shows `source` + `cached` | ❌ No metadata |
| **Google Sheets** | ✅ Fetches from Lists blocks | ❓ Unknown source |
| **Monthly Tracking** | ✅ Payment monthly data | ❌ No monthly data |

## Use Case Recommendations

### Use /api/options if you need:
- ✅ Payment monthly data (for charts, analytics)
- ✅ Combined revenue + expense list (for single picker)
- ✅ Data source transparency (source field)
- ✅ Future-proof (includes all data types)

### Use /api/categories/all if you need:
- ✅ Separated revenues vs expenses (for filtered pickers)
- ✅ Simple string arrays (no nested objects)
- ✅ Lightweight response (no monthly data)

## Questions to Answer

1. **Does /api/categories/all fetch from Google Sheets or static config?**
2. **Which endpoint is the "source of truth"?**
3. **Should we deprecate one of them?**
4. **Do mobile apps need payment monthly data?**

