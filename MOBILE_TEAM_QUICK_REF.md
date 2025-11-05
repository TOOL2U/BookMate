# 📱 Mobile App - Quick Reference Card

**Last Updated:** November 5, 2025  
**Production:** https://accounting.siamoon.com

---

## 🚨 CRITICAL CHANGE

### Balance API Response Structure

**Before:**
```json
{ "ok": true, "data": [...] }
```

**Now:**
```json
{ "ok": true, "items": [...], "totals": {...} }
```

**Fix:**
```javascript
// Change this line:
const accounts = response.data;  // ❌ OLD

// To this:
const accounts = response.items; // ✅ NEW
```

---

## 🎯 Main API Endpoints

### Get Balances
```
GET https://accounting.siamoon.com/api/balance?month=ALL
```
**Response:** `{ ok, items[], totals, durationMs }`

### Submit Transaction
```
POST https://accounting.siamoon.com/api/inbox
```
**Body:** `{ property, typeOfOperation, typeOfPayment, detail, amount, date }`

### Get Dropdown Options
```
GET https://accounting.siamoon.com/api/options
```
**Response:** `{ ok, data: { properties[], typeOfOperation[], typeOfPayments[] } }`

---

## ✅ Testing

```bash
# Test balance API
curl https://accounting.siamoon.com/api/balance?month=ALL

# Should return in < 1 second
# Should have "items" field, not "data"
```

---

## 📋 Migration Checklist

- [ ] Update `response.data` → `response.items`
- [ ] Add `?month=ALL` to balance endpoint
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Deploy to production

---

## 🆘 Issues?

1. Check API directly: https://accounting.siamoon.com/api/balance
2. Should return `{"ok": true}` in < 1 second
3. Contact webapp team if not working

---

**Full Documentation:** See `MOBILE_APP_TEAM_UPDATE.md`
