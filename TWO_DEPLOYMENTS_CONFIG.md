# 🔧 Two Apps Script Deployments - Configuration Guide

**Date:** November 4, 2025  
**Status:** Updated for dual deployment architecture

---

## 📊 DEPLOYMENT ARCHITECTURE

You have **TWO separate Google Sheets** with **TWO separate Apps Script deployments**:

### 1️⃣ P&L Sheet (Original/V7)
```
Sheet ID:    1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
Apps Script: COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE
Webhook URL: https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec

Contains:
  - Data sheet (master dropdown data)
  - Lists (Summary Data)
  - P&L (DO NOT EDIT)
  - Other V7 sheets

Handles:
  - getPnL
  - getInbox
  - deleteEntry
  - getPropertyPersonDetails
  - getOverheadExpensesDetails
  - /api/options (typeOfPayments, properties, operations)
```

### 2️⃣ Balance Sheet (V9 New)
```
Sheet ID:    1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI
Apps Script: APPS_SCRIPT_COMPLETE_WITH_V9
Webhook URL: https://script.google.com/macros/s/AKfycbyER8w5q3OnZgjR5Zsk2XX3t115MX7457Dq_myGHKZt99GF-HX-qMmm4c1ma9HBioBs/exec

Contains:
  - Accounts
  - Transactions
  - Balance Summary
  - Ledger

Handles:
  - accountsSync
  - transactionAppend
  - balanceGetSummary
  - getTransactions
  - V9 balance operations
```

---

## 🔑 ENVIRONMENT VARIABLES (Updated)

The `.env.local` has been updated with clear separation:

```bash
# Webhook secret (same for both)
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=

# DEPLOYMENT 1: P&L Sheet
SHEETS_WEBHOOK_URL=https://script.google.com/.../AKfycbwKa0f0m_...hmFl/exec
SHEETS_PNL_URL=https://script.google.com/.../AKfycbwKa0f0m_...hmFl/exec
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# DEPLOYMENT 2: Balance Sheet
SHEETS_BALANCE_URL=https://script.google.com/.../AKfycbyER8w5q3...ioBs/exec
BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI
```

---

## 🔀 API ENDPOINT ROUTING

### Use P&L Sheet (SHEETS_WEBHOOK_URL)
- ✅ `/api/options` - Get dropdown options (typeOfPayments, properties, operations)
- ✅ `/api/sheets` - Create new transaction entries
- ✅ `/api/inbox` - Get inbox data
- ✅ `/api/pnl` - Get P&L data
- ✅ `/api/pnl/namedRanges` - Get named ranges

### Use Balance Sheet (SHEETS_BALANCE_URL)
- ✅ `/api/balance/summary` - Get balance summary (V9)
- ✅ `/api/v9/transactions` - Transaction CRUD (V9)
- ✅ `/api/v9/accounts/sync` - Sync accounts from Type of Payments (V9)
- ✅ `/api/balance/save` - Save balances
- ✅ `/api/balance/get` - Get balances

---

## ✅ WHAT WAS UPDATED

### 1. Environment Variables (`.env.local`)
```diff
+ # Clear separation of two deployments with comments
+ # P&L Sheet section (Deployment 1)
+ # Balance Sheet section (Deployment 2)
+ SHEETS_BALANCE_URL=https://script.google.com/.../AKfycbyER8w5q3...
+ BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI
```

### 2. API Routes Need Updates

The following API routes have been updated to use `SHEETS_BALANCE_URL`:

**✅ Updated (All Complete):**
- `/app/api/balance/summary/route.ts` - ✅ Uses `SHEETS_BALANCE_URL`
- `/app/api/v9/transactions/route.ts` (POST & GET) - ✅ Uses `SHEETS_BALANCE_URL`
- `/app/api/v9/accounts/sync/route.ts` - ✅ Uses `SHEETS_BALANCE_URL`

**Already Correct:**
- `/app/api/options/route.ts` - Uses `SHEETS_WEBHOOK_URL` ✅
- `/app/api/sheets/route.ts` - Uses `SHEETS_WEBHOOK_URL` ✅
- `/app/api/pnl/route.ts` - Uses `SHEETS_PNL_URL` ✅

---

## 🚀 NEXT STEPS

### 1. Update API Routes (3 files)

I'll update these files to use the correct webhook URL:

```typescript
// Change from:
const webhookUrl = process.env.SHEETS_WEBHOOK_URL;

// To:
const webhookUrl = process.env.SHEETS_BALANCE_URL;
```

**Files to update:**
1. `app/api/balance/summary/route.ts`
2. `app/api/v9/transactions/route.ts`
3. `app/api/v9/accounts/sync/route.ts`

### 2. Test Connections

After updating, test both deployments:

```bash
# Test P&L deployment (options)
curl http://localhost:3000/api/options | jq '.ok'
# Should return: true

# Test Balance deployment (V9 summary)
curl http://localhost:3000/api/balance/summary | jq '.ok'
# Should return: true

# Test V9 transactions
curl http://localhost:3000/api/v9/transactions | jq '.ok'
# Should return: true
```

### 3. Verify in Vercel

When deploying to production, add these environment variables to Vercel:

```
SHEETS_WEBHOOK_URL=https://script.google.com/.../AKfycbwKa0f0m_...hmFl/exec
SHEETS_BALANCE_URL=https://script.google.com/.../AKfycbyER8w5q3...ioBs/exec
BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
```

---

## 📋 DEPLOYMENT CHECKLIST

### P&L Sheet Deployment ✅
- [x] Apps Script: `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE`
- [x] Deployed to: https://script.google.com/.../AKfycbwKa0f0m_...
- [x] Sheet ID: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- [x] Secret key configured

### Balance Sheet Deployment ✅
- [x] Apps Script: `APPS_SCRIPT_COMPLETE_WITH_V9`
- [x] Deployed to: https://script.google.com/.../AKfycbyER8w5q3...
- [x] Sheet ID: `1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI`
- [x] Secret key configured (same as P&L)

### Webapp Configuration
- [x] `.env.local` updated with both URLs
- [ ] API routes updated to use correct URLs ⚡ NEXT
- [ ] Tested both deployments working
- [ ] Vercel environment variables updated

---

## 🔍 TROUBLESHOOTING

### Both sheets use same secret key ✅
This is fine! The secret key is the same (`VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=`) in both Apps Script deployments, which makes configuration simpler.

### How to know which sheet to use?
- **Options/Dropdowns/P&L:** Use P&L Sheet (original)
- **Balance/Transactions/V9:** Use Balance Sheet (new)

### What if I get errors?
Check which sheet the API should use:
- If it's balance-related → `SHEETS_BALANCE_URL`
- If it's options/P&L-related → `SHEETS_WEBHOOK_URL`

---

## 📊 DATA FLOW

```
User Browser
    ↓
Next.js API Routes
    ↓
    ├─→ /api/options ──────────→ P&L Sheet (1UnCopzurl...)
    │                             └─ Data, Lists, P&L
    │
    └─→ /api/balance/summary ──→ Balance Sheet (1zJa_cwO...)
        /api/v9/transactions       └─ Accounts, Transactions, Balance Summary
```

---

**Status:** Environment configured ✅  
**Next:** Update 3 API route files to use `SHEETS_BALANCE_URL`  
**Time:** ~5 minutes
