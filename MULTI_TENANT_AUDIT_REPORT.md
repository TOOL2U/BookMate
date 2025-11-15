# Multi-Tenant Endpoint Audit Report

**Date**: November 15, 2025  
**Audit**: All API endpoints checked for multi-tenant compliance  
**Triggered By**: User testing discovered transaction going to wrong sheet

---

## 🎯 Audit Summary

### ✅ COMPLIANT Endpoints (Using Account-Specific Config)

All these endpoints are **correctly** using `account.scriptUrl` and `account.scriptSecret`:

1. **`/api/sheets`** ✅ - Transaction submission (Manual Entry + Transfers)
   - Fixed in commit c426265
   - Uses: `account.scriptUrl`, `account.scriptSecret`
   - Multi-tenant: ENFORCED

2. **`/api/options`** ✅ - Dropdown options
   - Uses: `account.sheetId` (direct Google Sheets API)
   - Multi-tenant: ENFORCED

3. **`/api/balance`** ✅ - Balance data
   - Uses: Direct import, no external calls
   - Multi-tenant: ENFORCED

4. **`/api/pnl`** ✅ - Profit & Loss report
   - Uses: `account.scriptUrl`, `account.scriptSecret`
   - Multi-tenant: ENFORCED

5. **`/api/pnl/overhead-expenses`** ✅ - Overhead expenses breakdown
   - Uses: `account.scriptUrl`, `account.scriptSecret`
   - Multi-tenant: ENFORCED

6. **`/api/pnl/property-person`** ✅ - Property/person P&L
   - Uses: `account.scriptUrl`, `account.scriptSecret`
   - Multi-tenant: ENFORCED

7. **`/api/inbox`** ✅ - Receipt inbox
   - Uses: `account.scriptUrl`, `account.scriptSecret`
   - Multi-tenant: ENFORCED

8. **`/api/categories/*`** ✅ - All category endpoints
   - Uses: Authentication but no external calls
   - Multi-tenant: ENFORCED

---

### ⚠️ NON-COMPLIANT Endpoints (Using Global Env Vars)

These endpoints are still using **global environment variables** and need to be fixed:

1. **`/api/balance/summary`** ⚠️
   - Currently uses: `process.env.SHEETS_BALANCE_URL`
   - Currently uses: `process.env.SHEETS_WEBHOOK_SECRET`
   - **RISK**: All users hitting same balance summary endpoint
   - **FIX NEEDED**: Use `account.scriptUrl` + `account.scriptSecret`

2. **`/api/pnl/namedRanges`** ⚠️
   - Currently uses: `process.env.SHEETS_PNL_URL`
   - Currently uses: `process.env.SHEETS_WEBHOOK_SECRET`
   - **RISK**: Admin endpoint, but still should be account-aware
   - **FIX NEEDED**: Use `account.scriptUrl` + `account.scriptSecret`

---

## 📋 Transfer Functionality Analysis

### How Transfers Work

Transfers use the **same `/api/sheets` endpoint** as manual entries:

```typescript
// Transfer transaction (Row A - Debit)
POST /api/sheets
{
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank transfer - Krung Thai Bank - Family Account",
  "detail": "Transfer to savings",
  "ref": "T-2025-768056",
  "debit": 1000,
  "credit": 0
}

// Transfer transaction (Row B - Credit)
POST /api/sheets
{
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Cash - Savings",
  "detail": "Transfer from checking",
  "ref": "T-2025-768056",  // Same ref links them
  "debit": 0,
  "credit": 1000
}
```

### Transfer Multi-Tenant Status

✅ **SAFE** - Transfers are now using account-specific webhooks (fixed in commit c426265)

**Before Fix**:
- User A transfers money → Goes to global SHEETS_WEBHOOK_URL ❌
- Could appear in User B's sheet ❌

**After Fix**:
- User A transfers money → Goes to `account.scriptUrl` (User A's sheet) ✅
- User B transfers money → Goes to their own `account.scriptUrl` ✅
- Multi-tenant isolation enforced ✅

---

## 🔍 Detailed Findings

### 1. `/api/balance/summary` - NON-COMPLIANT ⚠️

**Current Implementation**:
```typescript
const webhookUrl = process.env.SHEETS_BALANCE_URL;
const secret = process.env.SHEETS_WEBHOOK_SECRET;

const response = await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    action: 'balanceGetSummary',
    secret: secret,
    month: month
  })
});
```

**Issue**: 
- Uses global `SHEETS_BALANCE_URL`
- All users hit same endpoint
- Returns data from same sheet (last configured account)

**Required Fix**:
```typescript
// Add authentication
const account = await getAccountFromRequest(request);

// Use account-specific webhook
const response = await fetch(account.scriptUrl, {
  method: 'POST',
  body: JSON.stringify({
    action: 'balanceGetSummary',
    secret: account.scriptSecret,
    month: month
  })
});
```

**Impact**: 
- Used by: Web app balance page
- Risk: Medium (read-only, but shows wrong data)
- Priority: HIGH

---

### 2. `/api/pnl/namedRanges` - NON-COMPLIANT ⚠️

**Current Implementation**:
```typescript
const pnlUrl = process.env.SHEETS_PNL_URL;
const secret = process.env.SHEETS_WEBHOOK_SECRET;

const response = await fetch(pnlUrl, {
  method: 'POST',
  body: JSON.stringify({
    action: 'list_named_ranges',
    secret: secret
  })
});
```

**Issue**:
- Uses global `SHEETS_PNL_URL`
- Admin/debug endpoint
- Returns named ranges from single sheet

**Required Fix**:
```typescript
// Add authentication
const account = await getAccountFromRequest(request);

// Use account-specific webhook
const response = await fetch(account.scriptUrl, {
  method: 'POST',
  body: JSON.stringify({
    action: 'list_named_ranges',
    secret: account.scriptSecret
  })
});
```

**Impact**:
- Used by: Admin debugging
- Risk: Low (admin-only, read-only)
- Priority: MEDIUM

---

## 🚨 Critical Endpoints Check

### Endpoints That Write Data (Highest Risk)

1. **`/api/sheets` (Manual Entry + Transfers)** ✅ **FIXED**
   - Status: Account-specific
   - Risk: MITIGATED
   - Commit: c426265

### Endpoints That Read Data (Medium Risk)

1. **`/api/options`** ✅ COMPLIANT
2. **`/api/balance`** ✅ COMPLIANT  
3. **`/api/balance/summary`** ⚠️ **NEEDS FIX**
4. **`/api/pnl`** ✅ COMPLIANT
5. **`/api/pnl/overhead-expenses`** ✅ COMPLIANT
6. **`/api/pnl/property-person`** ✅ COMPLIANT
7. **`/api/pnl/namedRanges`** ⚠️ **NEEDS FIX**
8. **`/api/inbox`** ✅ COMPLIANT

---

## ✅ Recommended Actions

### IMMEDIATE (Before Mobile Team Re-Tests)

1. ✅ **DONE**: Fix `/api/sheets` to use account-specific webhooks
   - Commit: c426265
   - Status: Deployed

### HIGH PRIORITY (Deploy Today)

2. ⏳ **TODO**: Fix `/api/balance/summary`
   - Add authentication middleware
   - Use `account.scriptUrl` and `account.scriptSecret`
   - Impact: Web app balance page

3. ⏳ **TODO**: Fix `/api/pnl/namedRanges`
   - Add authentication middleware  
   - Use `account.scriptUrl` and `account.scriptSecret`
   - Impact: Admin debugging

### VERIFICATION

4. ⏳ **TODO**: Test all endpoints with multiple accounts
   - shaun@siamoon.com → Should see Shaun's data only
   - maria@siamoon.com → Should see Maria's data only
   - Verify no cross-account data leakage

---

## 📊 Multi-Tenant Compliance Scorecard

| Endpoint | Authenticated | Account-Specific | Status |
|----------|--------------|------------------|--------|
| `/api/auth/login` | N/A | N/A | ✅ Public |
| `/api/options` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/balance` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/balance/summary` | ❌ | ❌ | ⚠️ **NEEDS FIX** |
| `/api/pnl` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/pnl/overhead-expenses` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/pnl/property-person` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/pnl/namedRanges` | ❌ | ❌ | ⚠️ **NEEDS FIX** |
| `/api/sheets` | ✅ | ✅ | ✅ **FIXED** (c426265) |
| `/api/inbox` | ✅ | ✅ | ✅ COMPLIANT |
| `/api/categories/*` | ✅ | ✅ | ✅ COMPLIANT |

**Score**: 9/11 endpoints compliant (81.8%)

---

## 🎯 Summary

### What's Fixed
- ✅ `/api/sheets` now uses account-specific webhooks
- ✅ Transfers (Manual Entry with typeOfOperation="Transfer") are safe
- ✅ Multi-tenant isolation enforced for transaction submission

### What Needs Fixing
- ⚠️ `/api/balance/summary` - Uses global SHEETS_BALANCE_URL
- ⚠️ `/api/pnl/namedRanges` - Uses global SHEETS_PNL_URL

### Impact on Mobile App
- ✅ **Transaction submission**: SAFE (fixed)
- ✅ **Transfer transactions**: SAFE (fixed)
- ✅ **Data reading**: SAFE (already compliant)
- ⚠️ **Balance summary**: Would show wrong data (if mobile app uses it)

---

**Created**: November 15, 2025  
**Audited By**: Backend Team  
**Triggered By**: User testing discovered multi-tenant isolation bug  
**Next Steps**: Fix remaining 2 endpoints with global env vars
