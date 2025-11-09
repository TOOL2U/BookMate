# 🔧 Mobile Team - Overhead Expenses Fix Required

**Date:** November 9, 2025  
**Priority:** HIGH  
**Issue:** Overhead expenses showing incorrect data in mobile app

---

## 🚨 Problem

The **Overhead expenses** are displaying incorrectly in the mobile app, but they are **working correctly** on the web app. This indicates the mobile app is calling the wrong API endpoint or using an outdated endpoint.

---

## ✅ Correct API Endpoint

The mobile app should be using this endpoint:

### **Production Endpoint:**
```
https://accounting.siamoon.com/api/pnl/overhead-expenses
```

### **Method:** 
Both `GET` and `POST` are supported

### **Request Format (GET):**
```http
GET https://accounting.siamoon.com/api/pnl/overhead-expenses?period=month
GET https://accounting.siamoon.com/api/pnl/overhead-expenses?period=year
```

### **Request Format (POST):**
```http
POST https://accounting.siamoon.com/api/pnl/overhead-expenses
Content-Type: application/json

{
  "period": "month"  // or "year"
}
```

### **Expected Response:**
```json
{
  "ok": true,
  "data": [
    {
      "name": "Utilities - Gas",
      "expense": 3500.00,
      "percentage": 15.2
    },
    {
      "name": "Utilities - Water",
      "expense": 2100.00,
      "percentage": 9.1
    },
    {
      "name": "Utilities - Electricity",
      "expense": 4800.00,
      "percentage": 20.8
    },
    {
      "name": "Marketing",
      "expense": 8500.00,
      "percentage": 36.9
    }
    // ... more overhead categories
  ],
  "period": "month",
  "totalExpense": 23050.00,
  "timestamp": "2025-11-09T10:30:00.000Z"
}
```

---

## 🔍 How to Verify

### Test Command (Month):
```bash
curl -s "https://accounting.siamoon.com/api/pnl/overhead-expenses?period=month" | jq .
```

### Test Command (Year):
```bash
curl -s "https://accounting.siamoon.com/api/pnl/overhead-expenses?period=year" | jq .
```

### Verify Count:
```bash
curl -s "https://accounting.siamoon.com/api/pnl/overhead-expenses?period=month" | jq '.data | length'
# Should return the correct number of overhead expense categories
```

### Verify Total:
```bash
curl -s "https://accounting.siamoon.com/api/pnl/overhead-expenses?period=month" | jq '.totalExpense'
# Should match the P&L sheet overhead total
```

---

## ❌ Common Mistakes

### Don't Use These Old Endpoints:
- ❌ `/api/options` - This is for dropdowns only, not expense data
- ❌ `/api/categories/expenses` - This only lists expense category names, not amounts
- ❌ Any local/cached overhead data - Must fetch fresh from this endpoint

---

## 📋 What the Mobile App Should Do

1. **When showing Overhead expenses breakdown:**
   - Call: `GET /api/pnl/overhead-expenses?period=month` (for current month)
   - Call: `GET /api/pnl/overhead-expenses?period=year` (for year-to-date)

2. **Display format:**
   ```
   Overhead Expenses: ฿23,050
   
   Marketing                 ฿8,500  (36.9%)
   Utilities - Electricity   ฿4,800  (20.8%)
   Utilities - Gas           ฿3,500  (15.2%)
   Utilities - Water         ฿2,100  (9.1%)
   ...
   ```

3. **Data freshness:**
   - This endpoint connects directly to Apps Script
   - Data is always real-time from Google Sheets
   - No caching needed - the API handles performance

---

## 🔗 Related Documentation

- **Full API Guide:** See `MOBILE_TEAM_API_INTEGRATION_GUIDE.md`
- **Overhead Fix:** See `APPS_SCRIPT_OVERHEAD_EXPENSES.js`
- **Endpoint Comparison:** See `PM_ENDPOINT_COMPARISON.md`

---

## 📞 Questions?

If you need clarification on:
- Response format
- Error handling
- Authentication
- Rate limiting

Please reach out and we'll provide additional details.

---

## ✅ Web App Reference (Already Working)

The web app uses this exact endpoint in `components/OverheadExpensesModal.tsx`:

```typescript
const response = await fetch(`/api/pnl/overhead-expenses?period=${period}`);
const result = await response.json();
setData(result.data || []);
```

The mobile app should use the **same approach**.

---

## 📊 Data Structure

Each overhead expense item contains:
- **name** (string): Category name (e.g., "Utilities - Gas", "Marketing")
- **expense** (number): Amount in Thai Baht
- **percentage** (number): Percentage of total overhead expenses

### Important Notes:
- Percentages are already calculated by the API (out of 100)
- All amounts are in Thai Baht
- Categories are sorted by expense amount (highest to lowest)
- Only categories with non-zero values are returned

---

## 🎯 Summary

| What | Endpoint |
|------|----------|
| **Month Data** | `GET /api/pnl/overhead-expenses?period=month` |
| **Year Data** | `GET /api/pnl/overhead-expenses?period=year` |
| **Method** | GET or POST (both supported) |
| **Response** | `{ ok, data[], period, totalExpense, timestamp }` |
| **Example** | See web app: `components/OverheadExpensesModal.tsx` |

---

**Status:** 🔴 Awaiting mobile team fix  
**Expected Fix Time:** <1 hour  
**Testing Required:** Yes - verify all overhead categories show correct amounts
