# 🚨 URGENT: Missing Payment Types in /api/options

**Date:** November 4, 2025  
**Priority:** HIGH  
**Endpoint:** `POST /api/options`  
**Issue:** Missing 2 payment types

---

## ❌ Current State (WRONG)

The `/api/options` endpoint currently returns only **4 payment types**:

```json
{
  "data": {
    "typeOfPayments": [
      {
        "name": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank Transfer - Bangkok Bank - Maria Ren",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank transfer - Krung Thai Bank - Family Account",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
    ]
  }
}
```

---

## ✅ Required State (CORRECT)

The endpoint MUST return **5 payment types**:

```json
{
  "data": {
    "typeOfPayments": [
      {
        "name": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank Transfer - Bangkok Bank - Maria Ren",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank transfer - Krung Thai Bank - Family Account",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash - Family",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash - Alesia",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
    ]
  }
}
```

---

## 🔍 Missing Payment Types

1. **"Cash - Family"** ❌ Missing
2. **"Cash - Alesia"** ❌ Missing

---

## 📋 Action Required

### Webapp Team Tasks:

1. **Update Google Sheets**
   - Ensure "Payment Type" column has all 5 values
   - Check spelling matches exactly (case-sensitive)

2. **Update `/api/options` Endpoint Logic**
   - Verify the endpoint reads ALL payment types from Google Sheets
   - Ensure no filtering is removing "Cash - Family" and "Cash - Alesia"

3. **Test the Endpoint**
   ```bash
   curl -s https://accounting.siamoon.com/api/options | jq '.data.typeOfPayments[].name'
   ```
   
   Expected output:
   ```
   "Bank Transfer - Bangkok Bank - Shaun Ducker"
   "Bank Transfer - Bangkok Bank - Maria Ren"
   "Bank transfer - Krung Thai Bank - Family Account"
   "Cash - Family"
   "Cash - Alesia"
   ```

4. **Deploy to Production**
   - Deploy fix to Vercel
   - Notify mobile team when ready

---

## 📱 Mobile Team Status

✅ **Mobile app updated and ready**
- Updated TypeScript interfaces for `/api/options`
- Updated endpoint from `/api/categories/all` → `/api/options`
- Updated field names from singular → plural (`typeOfOperations`, `typeOfPayments`)
- Payment name extraction logic implemented
- Hardcoded fallback updated with all 5 payment types
- **0 TypeScript errors**

⏳ **Waiting for webapp deployment**
- Once fixed, mobile app will automatically use correct data
- No mobile code changes needed after webapp fix

---

## 🎯 Success Criteria

✅ `/api/options` returns 5 payment types (not 4)  
✅ Includes "Cash - Family"  
✅ Includes "Cash - Alesia"  
✅ All payment names match exactly (case-sensitive)  
✅ Mobile app dropdowns show all 5 options  

---

**Test URL:** https://accounting.siamoon.com/api/options

**Contact:** Mobile Team (Ready for testing once deployed)
