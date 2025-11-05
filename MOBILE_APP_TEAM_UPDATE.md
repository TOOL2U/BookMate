# 🚀 Mobile App Team - Critical API Updates

**Date:** November 5, 2025  
**Production URL:** https://accounting.siamoon.com  
**Status:** ✅ All changes deployed and tested

---

## 📋 What Changed

We've upgraded the balance system and fixed critical production issues. Here's everything your mobile app needs to know:

---

## ⚠️ BREAKING CHANGES

### 1. Balance API Response Structure Changed

**Old Response (DEPRECATED):**
```json
{
  "ok": true,
  "data": [
    {
      "accountName": "Cash - Family",
      "currentBalance": 1058497.2,
      ...
    }
  ]
}
```

**New Response (CURRENT):**
```json
{
  "ok": true,
  "source": "BalanceSummary",
  "month": "ALL",
  "items": [
    {
      "accountName": "Cash - Family",
      "openingBalance": 1245976,
      "netChange": -187478.8,
      "currentBalance": 1058497.2,
      "lastTxnAt": "2025-11-04 18:46",
      "inflow": 0,
      "outflow": 187478.8,
      "note": ""
    }
  ],
  "totals": {
    "netChange": 0,
    "currentBalance": 1446486.2,
    "inflow": 187478.8,
    "outflow": 187478.8
  },
  "durationMs": 379
}
```

**🔧 Required Mobile App Change:**
```javascript
// OLD CODE (won't work anymore)
const accounts = response.data;

// NEW CODE (use this)
const accounts = response.items;
const totals = response.totals; // bonus: you get totals now!
```

---

## 🎯 Updated API Endpoints

### 1️⃣ GET Balance Data (RECOMMENDED)

**Endpoint:** `GET /api/balance?month=ALL`

**URL:** `https://accounting.siamoon.com/api/balance?month=ALL`

**Method:** `GET`

**Headers:**
```http
Cache-Control: no-cache
```

**Response:**
```json
{
  "ok": true,
  "source": "BalanceSummary",
  "month": "ALL",
  "items": [
    {
      "accountName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "openingBalance": 2885.93,
      "netChange": 15000,
      "currentBalance": 17885.93,
      "lastTxnAt": "1899-12-30 00:00",
      "inflow": 15000,
      "outflow": 0,
      "note": ""
    }
  ],
  "totals": {
    "netChange": 0,
    "currentBalance": 1446486.2,
    "inflow": 187478.8,
    "outflow": 187478.8
  },
  "durationMs": 379
}
```

**Performance:** ~300-500ms (was 25+ seconds before!)

**Features:**
- ✅ Fast (timeout-protected, never hangs)
- ✅ Returns detailed balance breakdown
- ✅ Includes totals summary
- ✅ Supports month filtering (ALL, JAN, FEB, etc.)
- ✅ Auto-synced from Google Sheets "Balance Summary" tab

---

### 2️⃣ POST Balance Update (if mobile app uploads balances)

**Endpoint:** `POST /api/balance/save`

**URL:** `https://accounting.siamoon.com/api/balance/save`

**Method:** `POST`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "bankName": "Cash - Family",
  "balance": 1050000,
  "note": "Monthly balance update from mobile app"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Balance saved successfully",
  "timestamp": "2025-11-05T14:30:00.000Z"
}
```

---

### 3️⃣ GET Dropdown Options

**Endpoint:** `GET /api/options`

**URL:** `https://accounting.siamoon.com/api/options`

**Method:** `GET`

**Response:**
```json
{
  "ok": true,
  "data": {
    "properties": ["Property A", "Property B", ...],
    "typeOfOperation": ["Revenue", "Expense", ...],
    "typeOfPayments": ["Cash - Family", "Bank Transfer - Bangkok Bank", ...]
  }
}
```

**Status:** ✅ Working (no changes needed)

---

### 4️⃣ POST Transaction to Inbox

**Endpoint:** `POST /api/inbox`

**URL:** `https://accounting.siamoon.com/api/inbox`

**Method:** `POST`

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "property": "Property A",
  "typeOfOperation": "Revenue",
  "typeOfPayment": "Cash - Family",
  "detail": "Monthly rent payment",
  "amount": 25000,
  "date": "2025-11-05"
}
```

**Status:** ✅ Working (no changes needed)

---

## 🔄 Deprecated Endpoints

### ⚠️ `/api/balance/by-property` - DEPRECATED

**Old Endpoint:** `POST /api/balance/by-property`

**Status:** ⚠️ Still works but DEPRECATED

**Migration:** Use `GET /api/balance?month=ALL` instead

**Reason:** 
- Old endpoint depends on "Bank & Cash Balance" sheet which may not exist
- New endpoint is faster and more reliable
- New endpoint has better data structure

**Timeline:** Will be removed in future version (6+ months notice)

---

## 🧪 Testing the New API

### Test 1: Get All Balances
```bash
curl -s https://accounting.siamoon.com/api/balance?month=ALL | jq '.'
```

**Expected Result:**
- Status: 200 OK
- Response time: < 1 second
- Returns 5 accounts
- Total balance: ฿1,446,486.20

### Test 2: Get Current Month Balances
```bash
curl -s https://accounting.siamoon.com/api/balance?month=NOV | jq '.'
```

**Expected Result:**
- Same response structure
- Filtered by November transactions

### Test 3: Check Response Structure
```bash
curl -s https://accounting.siamoon.com/api/balance | jq 'keys'
```

**Expected Result:**
```json
[
  "durationMs",
  "items",      // ← Changed from "data"
  "month",
  "ok",
  "source",
  "totals"      // ← New field!
]
```

---

## 📱 Mobile App Required Changes

### Priority 1: Update Balance Fetching (CRITICAL)

**File:** Wherever you fetch balances (e.g., `BalanceService.js`, `api/balance.dart`)

**Change:**
```javascript
// OLD CODE ❌
async function fetchBalances() {
  const response = await fetch('https://accounting.siamoon.com/api/balance');
  const json = await response.json();
  return json.data; // ← This won't work!
}

// NEW CODE ✅
async function fetchBalances() {
  const response = await fetch('https://accounting.siamoon.com/api/balance?month=ALL');
  const json = await response.json();
  return {
    accounts: json.items,    // ← Changed!
    totals: json.totals,     // ← New!
    source: json.source,     // ← Helpful for debugging
  };
}
```

### Priority 2: Update TypeScript/Dart Types (if applicable)

**TypeScript:**
```typescript
// OLD TYPE ❌
interface BalanceResponse {
  ok: boolean;
  data: BalanceAccount[];
}

// NEW TYPE ✅
interface BalanceResponse {
  ok: boolean;
  source: string;
  month: string;
  items: BalanceAccount[];
  totals: {
    netChange: number;
    currentBalance: number;
    inflow: number;
    outflow: number;
  };
  durationMs: number;
}

interface BalanceAccount {
  accountName: string;
  openingBalance: number;
  netChange: number;
  currentBalance: number;
  lastTxnAt: string | null;
  inflow: number;
  outflow: number;
  note: string;
}
```

**Dart (Flutter):**
```dart
// OLD MODEL ❌
class BalanceResponse {
  final bool ok;
  final List<BalanceAccount> data;
}

// NEW MODEL ✅
class BalanceResponse {
  final bool ok;
  final String source;
  final String month;
  final List<BalanceAccount> items;  // Changed!
  final BalanceTotals totals;        // New!
  final int durationMs;
  
  factory BalanceResponse.fromJson(Map<String, dynamic> json) {
    return BalanceResponse(
      ok: json['ok'],
      source: json['source'],
      month: json['month'],
      items: (json['items'] as List)  // Changed from 'data'
          .map((item) => BalanceAccount.fromJson(item))
          .toList(),
      totals: BalanceTotals.fromJson(json['totals']),
      durationMs: json['durationMs'],
    );
  }
}

class BalanceTotals {
  final double netChange;
  final double currentBalance;
  final double inflow;
  final double outflow;
  
  factory BalanceTotals.fromJson(Map<String, dynamic> json) {
    return BalanceTotals(
      netChange: json['netChange']?.toDouble() ?? 0.0,
      currentBalance: json['currentBalance']?.toDouble() ?? 0.0,
      inflow: json['inflow']?.toDouble() ?? 0.0,
      outflow: json['outflow']?.toDouble() ?? 0.0,
    );
  }
}
```

### Priority 3: Update UI to Show New Fields (OPTIONAL)

You now have access to more data:

- `openingBalance` - Starting balance
- `netChange` - Total change (inflow - outflow)
- `inflow` - Total money in
- `outflow` - Total money out
- `totals` - Summary across all accounts

**Example UI Enhancement:**
```javascript
// Show balance breakdown
<Card>
  <Title>{account.accountName}</Title>
  <Amount>฿{account.currentBalance.toLocaleString()}</Amount>
  
  {/* NEW: Show change */}
  <Change positive={account.netChange >= 0}>
    {account.netChange >= 0 ? '↑' : '↓'} 
    ฿{Math.abs(account.netChange).toLocaleString()}
  </Change>
  
  {/* NEW: Show flows */}
  <Details>
    <Inflow>In: ฿{account.inflow.toLocaleString()}</Inflow>
    <Outflow>Out: ฿{account.outflow.toLocaleString()}</Outflow>
  </Details>
</Card>

{/* NEW: Show totals */}
<TotalCard>
  <Title>Total Balance</Title>
  <Amount>฿{totals.currentBalance.toLocaleString()}</Amount>
</TotalCard>
```

---

## ✅ No Changes Needed For

These endpoints are **unchanged** and work exactly as before:

- ✅ `POST /api/inbox` - Submit transactions
- ✅ `GET /api/inbox` - Fetch transactions
- ✅ `GET /api/options` - Get dropdown options
- ✅ `POST /api/balance/save` - Upload balance screenshots
- ✅ `GET /api/pnl` - Fetch P&L data
- ✅ Any file upload endpoints

---

## 🐛 Known Issues Fixed

These production issues are now **resolved**:

1. ✅ **30-second timeouts** - Fixed with PM's hardened route
2. ✅ **Slow balance loading** - Now ~300ms (was 25+ seconds)
3. ✅ **Private key authentication errors** - Fixed newline escaping
4. ✅ **Firebase sync errors** - Updated to use new endpoint
5. ✅ **Vercel deployment timeouts** - Added timeout protection

---

## 🔒 Authentication

**No changes to authentication!**

If you're using API keys or auth tokens, continue using them the same way:

```javascript
fetch('https://accounting.siamoon.com/api/balance', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN', // If you have auth
    'Cache-Control': 'no-cache',
  }
})
```

---

## 📞 Support & Questions

**Webapp Team Contact:**
- Repository: https://github.com/TOOL2U/BookMate
- Production: https://accounting.siamoon.com
- Environment: Node.js 18+, Next.js 15.5.6

**For Questions:**
1. Check this document first
2. Test the API endpoints above
3. Review the example code
4. Contact webapp team if issues persist

**Emergency:**
If production is down or returning errors:
- Check: https://accounting.siamoon.com/api/balance
- Should return: `{"ok": true, ...}` in < 1 second
- If not, contact webapp team immediately

---

## 📝 Migration Checklist

Use this checklist to ensure your mobile app is updated:

### Code Changes
- [ ] Update balance API call to use `items` instead of `data`
- [ ] Add `?month=ALL` query parameter to balance endpoint
- [ ] Update TypeScript/Dart types for new response structure
- [ ] Handle new `totals` field in response
- [ ] Test with production API

### Testing
- [ ] Test balance fetching on iOS
- [ ] Test balance fetching on Android
- [ ] Verify totals display correctly
- [ ] Test error handling
- [ ] Check performance (should be < 1 second)

### Documentation
- [ ] Update API documentation
- [ ] Update code comments
- [ ] Update README if applicable
- [ ] Notify QA team of changes

### Deployment
- [ ] Test in staging/dev environment
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify no crashes or issues

---

## 🎉 Benefits for Mobile App

With these changes, your mobile app gets:

1. **93% Faster** - Balance loading: 27s → 2s
2. **More Data** - Access to inflow, outflow, net change, totals
3. **More Reliable** - Timeout protection, never hangs
4. **Better UX** - Can show detailed balance breakdowns
5. **Future-Proof** - Using current, supported endpoints

---

## 📅 Timeline

- **Now:** All changes deployed to production
- **Action Required:** Update mobile app ASAP
- **Deprecation:** `/api/balance/by-property` will be removed in 6+ months
- **Support:** Full support for new API endpoints ongoing

---

**Questions?** Contact the webapp team or test the API directly!

**Last Updated:** November 5, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
