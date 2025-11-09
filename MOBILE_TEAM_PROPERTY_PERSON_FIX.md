# 🔧 Mobile Team - Property/Person Expenses Fix Required

**Date:** November 9, 2025  
**Priority:** HIGH  
**Issue:** Property/Person expenses showing incorrect data in mobile app

---

## 🚨 Problem

The **Property/Person expenses** are displaying incorrectly in the mobile app, but they are **working correctly** on the web app. This indicates the mobile app is calling the wrong API endpoint or using an outdated endpoint.

---

## ✅ Correct API Endpoint

The mobile app should be using this endpoint:

### **Production Endpoint:**
```
https://accounting.siamoon.com/api/pnl/property-person
```

### **Method:** 
Both `GET` and `POST` are supported

### **Request Format (GET):**
```http
GET https://accounting.siamoon.com/api/pnl/property-person?period=month
GET https://accounting.siamoon.com/api/pnl/property-person?period=year
```

### **Request Format (POST):**
```http
POST https://accounting.siamoon.com/api/pnl/property-person
Content-Type: application/json

{
  "period": "month"  // or "year"
}
```

### **Expected Response:**
```json
{
  "ok": true,
  "success": true,
  "data": [
    {
      "name": "Alesia House",
      "expense": 12500.00,
      "percentage": 28.5
    },
    {
      "name": "Lanna House", 
      "expense": 8200.00,
      "percentage": 18.3
    },
    {
      "name": "Sia Moon - Land - General",
      "expense": 15000.00,
      "percentage": 33.5
    }
    // ... more properties
  ],
  "period": "month",
  "totalExpense": 44753.00,
  "timestamp": "2025-11-09T10:30:00.000Z"
}
```

---

## 🔍 How to Verify

### Test Command (Month):
```bash
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=month" | jq .
```

### Test Command (Year):
```bash
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=year" | jq .
```

### Verify Count:
```bash
curl -s "https://accounting.siamoon.com/api/pnl/property-person?period=month" | jq '.data | length'
# Should return: 7 (as of November 2025)
```

---

## ❌ Common Mistakes

### Don't Use These Old Endpoints:
- ❌ `/api/options` - This is for dropdowns only, not expense data
- ❌ `/api/categories/properties` - This only lists property names, not expenses
- ❌ Any local/cached property data - Must fetch fresh from this endpoint

---

## 📋 What the Mobile App Should Do

1. **When showing Property/Person expenses breakdown:**
   - Call: `GET /api/pnl/property-person?period=month` (for current month)
   - Call: `GET /api/pnl/property-person?period=year` (for year-to-date)

2. **Display format:**
   ```
   Property/Person Expenses: ฿44,753
   
   Sia Moon - Land - General  ฿15,000 (33.5%)
   Alesia House              ฿12,500 (28.5%)
   Lanna House               ฿8,200  (18.3%)
   ...
   ```

3. **Data freshness:**
   - This endpoint connects directly to Apps Script
   - Data is always real-time from Google Sheets
   - No caching needed - the API handles performance

---

## 🔗 Related Documentation

- **Full API Guide:** See `MOBILE_TEAM_API_INTEGRATION_GUIDE.md`
- **Property/Person Fix:** See `PROPERTY_PERSON_API_FIX_DEPLOYED.md`
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

The web app uses this exact endpoint in `components/PropertyPersonModal.tsx`:

```typescript
const response = await fetch(`/api/pnl/property-person?period=${period}`);
const result = await response.json();
setData(result.data || []);
```

The mobile app should use the **same approach**.

---

**Status:** 🔴 Awaiting mobile team fix  
**Expected Fix Time:** <1 hour  
**Testing Required:** Yes - verify all properties show correct amounts
