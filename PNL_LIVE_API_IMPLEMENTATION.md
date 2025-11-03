# 📊 Live P&L Integration - Lists Sheet (Formula-Based)

**Date:** November 3, 2025  
**Status:** ✅ Implemented  
**Endpoint:** `/api/pnl/live`  

---

## 🎯 Overview

This endpoint provides **formula-accurate** P&L data by reading directly from the **Lists** sheet, which contains normalized pivot data created with `ARRAYFORMULA + VLOOKUP` in Google Sheets.

### Key Benefits:
- ✅ **Webapp values = Spreadsheet formulas** (100% accurate)
- ✅ **Auto-updates** when categories are added/removed in Data sheet
- ✅ **5-minute cache** for efficient reads
- ✅ **No recalculation** in app code (trusts sheet formulas)

---

## 📡 API Endpoint

### Request:
```bash
GET /api/pnl/live
```

### Response Structure:
```typescript
{
  months: string[];           // ["Jan", "Feb", "Mar", ...]
  blocks: {
    revenue: CategoryRow[];   // Villa A, Villa B, etc.
    overhead: CategoryRow[];  // EXP - Utilities, etc.
    property: CategoryRow[];  // Sia Moon, Alesia House, etc.
    payment: CategoryRow[];   // Cash, Bank transfer, etc.
  };
  totals: {
    revenue: TotalData;       // Sum of all revenue
    overhead: TotalData;      // Sum of all overhead
    property: TotalData;      // Sum of all property
    payment: TotalData;       // Sum of all payment
    grand: TotalData;         // Sum of all blocks
  };
  updatedAt: string;          // ISO timestamp
  cached?: boolean;           // true if from cache
  cacheAge?: number;          // seconds since cache
}
```

### CategoryRow Type:
```typescript
{
  name: string;               // "Villa A", "EXP - Utilities - Gas", etc.
  monthly: number[];          // [50000, 45000, ...] (12 months)
  yearTotal: number;          // 580000
}
```

### TotalData Type:
```typescript
{
  monthly: number[];          // [150000, 140000, ...] (12 months)
  yearTotal: number;          // 1800000
}
```

---

## 🗂️ Data Sources

### Google Sheets Structure:

| Sheet | Range | Purpose |
|-------|-------|---------|
| **Data** | A2:A | Revenue categories (4 items) |
| **Data** | B2:B | Overhead categories (29 items) |
| **Data** | C2:C | Property/Person categories (7 items) |
| **Data** | D2:D | Payment type categories (4 items) |
| **Lists** | H:J | Overhead (Category, Month, Value) |
| **Lists** | M:O | Property/Person (Category, Month, Value) |
| **Lists** | R:T | Payment Type (Category, Month, Value) |
| **Lists** | W:Y | Revenue (Category, Month, Value) |
| **P&L (DO NOT EDIT)** | 4:4 (E:P) | Month headers (JAN, FEB, etc.) |

### Lists Sheet Format:
Each block in Lists contains three columns:
1. **Category** - Full category name
2. **Month** - Month in UPPERCASE (JAN, FEB, MAR, etc.)
3. **Value** - Numeric value (THB)

Example (Overhead):
```
H           | I    | J
EXP - Utils | JAN  | 5000
EXP - Utils | FEB  | 4500
EXP - Const | JAN  | 10000
...
```

---

## 🔄 Data Flow

```
1. Fetch all ranges via batchGet (16 ranges in 1 request)
   ↓
2. Extract category lists from Data sheet
   ↓
3. Extract Lists blocks (H:J, M:O, R:T, W:Y)
   ↓
4. Extract month headers from P&L sheet
   ↓
5. For each category:
   - Create 12-month array (initialized to 0)
   - Aggregate values by matching category + month
   - Calculate year total
   ↓
6. Calculate block totals (sum all categories)
   ↓
7. Calculate grand total (sum all blocks)
   ↓
8. Cache for 5 minutes
   ↓
9. Return JSON
```

---

## 🚀 Implementation Details

### File Location:
```
app/api/pnl/live/route.ts
```

### Key Functions:

#### `formatBlock()`
Converts a Lists block into CategoryRow[] array:
```typescript
const formatBlock = (
  block: { cat: any[], mon: any[], val: any[] },
  categories: string[]
): CategoryRow[] => {
  return categories.map(name => {
    const monthly = Array(12).fill(0);
    
    // Aggregate values for this category across all months
    for (let i = 0; i < block.cat.length; i++) {
      const c = String(block.cat[i] || '').trim();
      const m = String(block.mon[i] || '').trim();
      const v = Number(block.val[i] || 0);
      
      if (c === name && monthIndex[m] != null) {
        monthly[monthIndex[m]] += v;
      }
    }
    
    return { 
      name, 
      monthly, 
      yearTotal: monthly.reduce((a, b) => a + b, 0) 
    };
  });
};
```

#### `sumCols()`
Calculates totals for a block:
```typescript
const sumCols = (arr: CategoryRow[]): TotalData => {
  const monthly = Array(12).fill(0);
  arr.forEach(row => {
    row.monthly.forEach((value, index) => {
      monthly[index] += value;
    });
  });
  return { 
    monthly, 
    yearTotal: monthly.reduce((a, b) => a + b, 0) 
  };
};
```

---

## ⚡ Performance

### Caching Strategy:
- **Duration:** 5 minutes (300 seconds)
- **Type:** In-memory (server-side)
- **Invalidation:** Automatic after 5 minutes, or manual via POST

### API Efficiency:
- **Single request:** All 16 ranges fetched via `batchGet`
- **No pagination:** All data loaded at once
- **Fast aggregation:** Simple array operations

### Expected Response Times:
- **Cache hit:** < 10ms
- **Cache miss (fresh fetch):** 500-1000ms (Google Sheets API)
- **Subsequent requests:** < 10ms (within 5-minute window)

---

## 🧪 Testing

### Test the Endpoint:
```bash
# Development
curl http://localhost:3000/api/pnl/live | jq

# Production
curl https://accounting.siamoon.com/api/pnl/live | jq
```

### Expected Response:
```json
{
  "months": ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"],
  "blocks": {
    "revenue": [
      {
        "name": "Revenue - Commission",
        "monthly": [30000, 25000, 28000, 32000, 29000, 31000, 33000, 30000, 28000, 27000, 29000, 31000],
        "yearTotal": 353000
      },
      ...
    ],
    "overhead": [...],
    "property": [...],
    "payment": [...]
  },
  "totals": {
    "revenue": {
      "monthly": [50000, 48000, ...],
      "yearTotal": 580000
    },
    "overhead": { ... },
    "property": { ... },
    "payment": { ... },
    "grand": {
      "monthly": [200000, 195000, ...],
      "yearTotal": 2400000
    }
  },
  "updatedAt": "2025-11-03T08:30:00.000Z",
  "cached": false
}
```

### Clear Cache:
```bash
curl -X POST http://localhost:3000/api/pnl/live \
  -H "Content-Type: application/json" \
  -d '{"action":"clearCache"}'
```

---

## 🎨 Frontend Integration

### Update P&L Dashboard:

Replace the current `/api/pnl` call with `/api/pnl/live`:

```typescript
// app/pnl/page.tsx
const fetchPnLData = async () => {
  const response = await fetch('/api/pnl/live');
  const result = await response.json();
  
  // result.months - ["JAN", "FEB", ...]
  // result.blocks.revenue - CategoryRow[]
  // result.totals.revenue - TotalData
  
  // Display in UI components
};
```

### Display Monthly Data:

```typescript
// Example: Show revenue by month
result.blocks.revenue.map(category => (
  <div>
    <h3>{category.name}</h3>
    <table>
      {result.months.map((month, i) => (
        <tr>
          <td>{month}</td>
          <td>฿{category.monthly[i].toLocaleString()}</td>
        </tr>
      ))}
      <tr>
        <td>Year Total</td>
        <td>฿{category.yearTotal.toLocaleString()}</td>
      </tr>
    </table>
  </div>
));
```

### Display Totals:

```typescript
// KPI Cards
<div>
  <h2>Revenue</h2>
  <p>This Month: ฿{result.totals.revenue.monthly[currentMonth].toLocaleString()}</p>
  <p>Year Total: ฿{result.totals.revenue.yearTotal.toLocaleString()}</p>
</div>
```

---

## ✅ Validation Checklist

- [x] Endpoint created at `/app/api/pnl/live/route.ts`
- [x] Fetches 16 ranges via batchGet
- [x] Reads categories from Data sheet (A/B/C/D)
- [x] Reads Lists blocks (H:J, M:O, R:T, W:Y)
- [x] Reads month headers from P&L sheet
- [x] Aggregates values by category + month
- [x] Calculates year totals
- [x] Calculates block totals
- [x] Calculates grand total
- [x] 5-minute cache implemented
- [x] Manual cache clearing via POST
- [x] TypeScript types defined
- [x] Error handling with detailed messages
- [x] Console logging for debugging
- [ ] Frontend updated to use new endpoint
- [ ] THB currency formatting applied
- [ ] Month display (Jan, Feb vs JAN, FEB)
- [ ] Category sync verification

---

## 🔄 Next Steps

### 1. Test Endpoint
```bash
npm run dev
curl http://localhost:3000/api/pnl/live | jq
```

### 2. Update Frontend Components
- Modify `app/pnl/page.tsx` to fetch from `/api/pnl/live`
- Update `PnLKpiRow.tsx` to display monthly + year totals
- Update `PnLTrendChart.tsx` to use real monthly data
- Update `PnLExpenseBreakdown.tsx` to show category details

### 3. Format Display
- Convert month names (JAN → Jan)
- Format currency (฿50,000)
- Handle current month highlighting
- Add loading states

### 4. Verify Accuracy
- Compare webapp values to spreadsheet
- Add new category in Data sheet
- Verify it appears in webapp after cache expires
- Check totals match across all views

---

## 📞 Support

**Implementation Status:** ✅ Backend complete  
**Frontend Integration:** ⏳ Pending  
**Testing:** ⏳ Pending  

**Questions?**
- Check console logs for detailed debugging
- Verify GOOGLE_SHEET_ID matches: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- Ensure service account has read access to all sheets
- Confirm Lists sheet has data in H:J, M:O, R:T, W:Y ranges

---

**Last Updated:** November 3, 2025  
**Status:** ✅ Ready for frontend integration
