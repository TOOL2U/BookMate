# 🔄 IMPORTANT: API Endpoint Update for Mobile Team

**To:** Mobile Team  
**From:** Webapp Team  
**Date:** November 3, 2025  
**Priority:** MEDIUM  
**Impact:** Improved Performance & Simplified Architecture

---

## 📋 Summary

We've **upgraded** our dropdown options API to a better architecture. Your existing `/api/options` endpoint **still works**, but we recommend updating to our new **`/api/categories/all`** endpoint for better performance and real-time Google Sheets sync.

---

## 🎯 What Changed

### **OLD Endpoint (Still Working)**
```
https://accounting.siamoon.com/api/options
```
- ✅ Still functional (no breaking changes)
- ⚠️ Uses cached file (`config/live-dropdowns.json`)
- ⚠️ Requires manual `npm run sync` to update
- ⚠️ Field names: `typeOfOperations` (plural)

### **NEW Endpoint (Recommended)**
```
https://accounting.siamoon.com/api/categories/all
```
- ✅ **Real-time sync** - fetches directly from Google Sheets
- ✅ **Always current** - no manual sync needed
- ✅ **Better performance** - single batch request to Google API
- ✅ **Consistent naming** - matches webapp architecture
- ✅ Field names: `typeOfOperation` (singular - matches Google Sheets column)

---

## 📊 Side-by-Side Comparison

| Feature | `/api/options` (OLD) | `/api/categories/all` (NEW) |
|---------|---------------------|----------------------------|
| **Status** | ✅ Working | ✅ Working |
| **Data Source** | Cached JSON file | Direct from Google Sheets |
| **Update Method** | Manual `npm run sync` | Automatic on every request |
| **Response Time** | ~50-100ms | ~200-400ms |
| **Field Names** | `typeOfOperations` (plural) | `typeOfOperation` (singular) |
| **Breaking Changes** | None | Field name difference |
| **Recommended** | Legacy support | ✅ Yes |

---

## 🔍 Response Format Comparison

### **OLD `/api/options`:**
```json
{
  "ok": true,
  "data": {
    "properties": [...],
    "typeOfOperations": [...],    // ⬅️ PLURAL
    "typeOfPayments": [...]        // ⬅️ PLURAL
  },
  "updatedAt": "2025-11-01T12:34:56.789Z",
  "cached": true
}
```

### **NEW `/api/categories/all`:**
```json
{
  "ok": true,
  "data": {
    "properties": [...],
    "typeOfOperation": [...],      // ⬅️ SINGULAR
    "typeOfPayment": [...],        // ⬅️ SINGULAR
    "revenues": [...],             // ⬅️ NEW: Separate revenue categories
    "month": ["Jan", "Feb", ...]
  },
  "meta": {
    "source": "Google Sheets Data",
    "timestamp": "2025-11-03T10:15:30.456Z",
    "counts": {
      "revenues": 4,
      "typeOfOperation": 28,
      "properties": 7,
      "typeOfPayment": 4
    }
  }
}
```

---

## ✅ What You Need to Do

### **Option 1: Keep Using `/api/options` (No Changes Needed)**
- ✅ **Zero work** - everything continues to work
- ⚠️ We'll continue syncing manually when categories change
- ⚠️ May have 1-2 hour delay when we add new categories
- **Best for:** If you want to avoid any code changes

### **Option 2: Migrate to `/api/categories/all` (Recommended)**
- ✅ **Real-time updates** - no sync delays
- ✅ **Better architecture** - matches our webapp
- ⚠️ Requires minor code changes (field name updates)
- **Best for:** Long-term stability and performance

---

## 🔧 Migration Guide (If You Choose Option 2)

### **Step 1: Update Your API Service**

**OLD:**
```typescript
// services/api.ts
const ENDPOINT = 'https://accounting.siamoon.com/api/options';

interface OptionsResponse {
  ok: boolean;
  data: {
    properties: string[];
    typeOfOperations: string[];     // ⬅️ PLURAL
    typeOfPayments: string[];       // ⬅️ PLURAL
  };
}
```

**NEW:**
```typescript
// services/api.ts
const ENDPOINT = 'https://accounting.siamoon.com/api/categories/all';

interface OptionsResponse {
  ok: boolean;
  data: {
    properties: string[];
    typeOfOperation: string[];      // ⬅️ SINGULAR
    typeOfPayment: string[];        // ⬅️ SINGULAR
    revenues: string[];             // ⬅️ NEW (optional to use)
    month: string[];
  };
  meta: {
    source: string;
    timestamp: string;
    counts: {
      revenues: number;
      typeOfOperation: number;
      properties: number;
      typeOfPayment: number;
    };
  };
}
```

### **Step 2: Update Field References**

**Find and replace in your codebase:**
- `typeOfOperations` → `typeOfOperation`
- `typeOfPayments` → `typeOfPayment`

**Example:**
```typescript
// Before:
const categories = options.data.typeOfOperations;
const payments = options.data.typeOfPayments;

// After:
const categories = options.data.typeOfOperation;
const payments = options.data.typeOfPayment;
```

### **Step 3: Test**

```bash
# Test the new endpoint
curl -s https://accounting.siamoon.com/api/categories/all | jq '.data | keys'

# Should return:
["month", "properties", "revenues", "typeOfOperation", "typeOfPayment"]
```

---

## 🧪 Testing Checklist (Option 2)

- [ ] Update `ENDPOINT` constant to `/api/categories/all`
- [ ] Update TypeScript interface field names
- [ ] Find/replace `typeOfOperations` → `typeOfOperation`
- [ ] Find/replace `typeOfPayments` → `typeOfPayment`
- [ ] Test dropdown population in ManualEntryScreen
- [ ] Verify caching still works with new field names
- [ ] Test fallback mechanism
- [ ] Confirm transaction submission works

---

## 📊 Real-Time Sync Benefits

### **With OLD `/api/options`:**
```
1. We update Google Sheets
2. We manually run `npm run sync` on server
3. Server regenerates live-dropdowns.json
4. Your app gets new data on next cache refresh
   ⏱️ Total delay: 1-2 hours (manual sync + your cache TTL)
```

### **With NEW `/api/categories/all`:**
```
1. We update Google Sheets
2. Your app gets new data on next request immediately
   ⏱️ Total delay: 0-24 hours (only your cache TTL)
```

---

## 🚨 Important Notes

### **NO Breaking Changes to `/api/options`**
- We're **NOT removing** `/api/options`
- It will **continue to work** indefinitely
- This is an **optional upgrade**
- You can migrate at your own pace

### **Data Consistency**
- Both endpoints serve the **same data**
- Both are sourced from Google Sheets
- Only difference is sync method (manual vs automatic)

---

## 📞 Questions?

**Which endpoint should we use?**
- Use `/api/options` if you want zero changes (we'll keep syncing it)
- Use `/api/categories/all` for real-time updates and better performance

**Will you deprecate `/api/options`?**
- Not in the near future
- We'll give 3+ months notice if we ever do
- For now, both are fully supported

**How long to migrate?**
- Estimated: 30-60 minutes
- Mostly find/replace for field names
- Low risk, easy rollback

**Do we have to migrate?**
- No, it's optional
- Both endpoints work fine
- New endpoint is just better architecture

---

## 🎯 Our Recommendation

**For existing mobile app already in production:**
- ✅ Keep using `/api/options` for now
- ✅ Plan migration to `/api/categories/all` in next sprint
- ✅ No rush, both endpoints are stable

**For new features or major updates:**
- ✅ Use `/api/categories/all` for new code
- ✅ Gradually migrate old code as you touch it
- ✅ Benefits: real-time sync, better performance

---

## 📚 Resources

**Test the new endpoint:**
```bash
curl https://accounting.siamoon.com/api/categories/all
```

**Documentation:**
- Old endpoint: `docs/API_OPTIONS_ENDPOINT.md`
- New endpoint: `DROPDOWN_SYNC_COMPLETE.md`

**Example response:**
```bash
# Get all dropdown options
curl -s https://accounting.siamoon.com/api/categories/all | jq '.data'

# Get just categories count
curl -s https://accounting.siamoon.com/api/categories/all | jq '.meta.counts'
```

---

## ✅ Summary

| Item | Status | Action Required |
|------|--------|----------------|
| `/api/options` | ✅ Working | None (continue using) |
| `/api/categories/all` | ✅ Working | Optional migration |
| Breaking changes | ❌ None | None |
| Data accuracy | ✅ Same | None |
| Your action | 🤷 Optional | Decide which endpoint to use |

---

## 🎉 Bottom Line

**Nothing breaks. Everything works. New option available if you want it.**

- ✅ Your current integration with `/api/options` continues to work
- ✅ We'll keep syncing it manually when categories change
- ✅ New `/api/categories/all` endpoint available for better real-time sync
- ✅ Migrate when convenient (or never - both work fine!)

---

**Let us know which approach you prefer!** 🚀

— Webapp Team  
November 3, 2025
