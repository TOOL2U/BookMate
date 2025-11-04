# ✅ Dual Deployment Configuration Complete

**Date:** $(date)
**Status:** All API routes updated and configured

---

## 🎯 Summary

Your webapp now correctly routes API calls to TWO separate Google Sheets deployments:

1. **P&L Sheet** - Handles data entry, inbox, P&L reports, dropdowns
2. **Balance Sheet** - Handles accounts, transactions, balance summaries

---

## 📋 What Was Done

### 1. Environment Variables Updated (`.env.local`)

```bash
# ============================================
# DEPLOYMENT 1: P&L Sheet (Legacy Operations)
# ============================================
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec
SHEETS_PNL_URL=https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# ============================================
# DEPLOYMENT 2: Balance Sheet (V9 Operations)
# ============================================
SHEETS_BALANCE_URL=https://script.google.com/macros/s/AKfycbyER8w5q3OnZgjR5Zsk2XX3t115MX7457Dq_myGHKZt99GF-HX-qMmm4c1ma9HBioBs/exec
BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI

# Shared secret (same for both deployments)
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
```

### 2. API Routes Updated (3 files)

All Balance Sheet endpoints now use `SHEETS_BALANCE_URL`:

| File | Function | Status |
|------|----------|--------|
| `app/api/balance/summary/route.ts` | Get balance summary | ✅ Updated |
| `app/api/v9/transactions/route.ts` | POST - Create transaction | ✅ Updated |
| `app/api/v9/transactions/route.ts` | GET - Fetch transactions | ✅ Updated |
| `app/api/v9/accounts/sync/route.ts` | Sync accounts | ✅ Updated |

### 3. P&L Endpoints (Unchanged)

These continue to use `SHEETS_WEBHOOK_URL` or `SHEETS_PNL_URL`:

| File | Function | Status |
|------|----------|--------|
| `app/api/options/route.ts` | Get dropdowns | ✅ Correct |
| `app/api/sheets/route.ts` | Add/delete entries | ✅ Correct |
| `app/api/pnl/route.ts` | Get P&L report | ✅ Correct |

---

## 🧪 Testing

### Quick Test Commands

```bash
# Test P&L deployment
curl http://localhost:3000/api/options | jq '.ok'
# Expected: true

# Test Balance deployment
curl http://localhost:3000/api/balance/summary | jq '.ok'
# Expected: true

# Test V9 transactions
curl http://localhost:3000/api/v9/transactions | jq '.ok'
# Expected: true
```

### Full Test Script

Run the comprehensive test suite:

```bash
chmod +x test-dual-deployments.sh
./test-dual-deployments.sh
```

---

## 📊 API Routing Map

### P&L Sheet Endpoints (Deployment 1)
```
📍 Sheet: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
🔗 Webhook: ...AKfycbwKa0f0m_...hmFl/exec

/api/options          → getOptions (typeOfPayments, properties, operations)
/api/sheets           → appendEntry, deleteEntry
/api/pnl              → getPnL
/api/inbox            → getInbox
```

### Balance Sheet Endpoints (Deployment 2)
```
📍 Sheet: 1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI
🔗 Webhook: ...AKfycbyER8w5q3...ioBs/exec

/api/balance/summary       → balanceGetSummary
/api/v9/transactions       → transactionAppend, getTransactions
/api/v9/accounts/sync      → accountsSync
```

---

## 🚀 Deployment to Vercel

### Required Environment Variables

Add these to your Vercel project:

```bash
# P&L Sheet
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec
SHEETS_PNL_URL=https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# Balance Sheet
SHEETS_BALANCE_URL=https://script.google.com/macros/s/AKfycbyER8w5q3OnZgjR5Zsk2XX3t115MX7457Dq_myGHKZt99GF-HX-qMmm4c1ma9HBioBs/exec
BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI

# Shared
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
```

### Deployment Steps

```bash
# 1. Commit changes
git add .
git commit -m "Configure dual deployment architecture for P&L and Balance sheets"

# 2. Push to trigger deployment
git push

# 3. Verify environment variables in Vercel dashboard
# Settings → Environment Variables

# 4. Test production endpoints
curl https://your-app.vercel.app/api/balance/summary | jq '.ok'
curl https://your-app.vercel.app/api/options | jq '.ok'
```

---

## 🔍 Verification Checklist

### Local Testing
- [ ] Dev server starts without errors
- [ ] `/api/options` returns dropdown options (P&L sheet)
- [ ] `/api/balance/summary` returns balance data (Balance sheet)
- [ ] `/api/v9/transactions` can fetch transactions (Balance sheet)
- [ ] `/api/v9/accounts/sync` can sync accounts (Balance sheet)

### Balance Sheet Structure
- [ ] Sheet has "Accounts" tab with columns: accountName, openingBalance, active, note, createdAt
- [ ] Sheet has "Transactions" tab with columns: timestamp, fromAccount, toAccount, transactionType, amount, currency, note, referenceID, user
- [ ] Sheet has "Balance Summary" tab with columns: accountName, openingBalance, netChange, currentBalance, lastTxnAt, inflow, outflow, note
- [ ] Apps Script has functions: accountsSync, transactionAppend, balanceGetSummary, getTransactions

### P&L Sheet Structure (Should be unchanged)
- [ ] Sheet has "Data" tab
- [ ] Sheet has "Lists" tab
- [ ] Sheet has "P&L" tab
- [ ] Apps Script has functions: appendEntry, deleteEntry, getPnL, getInbox, getOptions

---

## 🐛 Troubleshooting

### Issue: "SHEETS_BALANCE_URL not configured"

**Cause:** Environment variable missing or not loaded

**Fix:**
```bash
# Check .env.local
grep SHEETS_BALANCE_URL .env.local

# Restart dev server
# Stop with Ctrl+C, then:
npm run dev
```

### Issue: Wrong data returned from endpoint

**Cause:** API calling wrong webhook URL

**Check:**
```typescript
// In the API file, ensure it uses:
const webhookUrl = process.env.SHEETS_BALANCE_URL;
// NOT:
const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
```

### Issue: Apps Script returns error

**Cause:** Action not supported by that deployment

**Check mapping:**
- P&L actions: `appendEntry`, `deleteEntry`, `getPnL`, `getInbox`, `getOptions`
- Balance actions: `accountsSync`, `transactionAppend`, `balanceGetSummary`, `getTransactions`

---

## 📚 Related Documentation

- `TWO_DEPLOYMENTS_CONFIG.md` - Detailed configuration guide
- `BALANCE_SYSTEM_QA_REPORT.md` - Complete QA documentation
- `test-balance-system.sh` - Automated test suite
- `BALANCE_QA_QUICK_REF.md` - Quick reference

---

## ✅ Next Steps

1. **Test Locally** - Run tests to verify both deployments work
2. **Verify Balance Sheet** - Check that the sheet structure matches expected columns
3. **Deploy to Vercel** - Add environment variables and deploy
4. **Monitor** - Check logs for any routing issues
5. **Document** - Update team about dual deployment architecture

---

## 📝 Notes

- Both deployments share the same webhook secret for authentication
- Each deployment handles different aspects of the app:
  - P&L Sheet: Traditional data entry and reporting
  - Balance Sheet: New account-based balance tracking
- This separation allows independent updates to each sheet without conflicts
- Future: Consider merging into single deployment once balance system is stable

---

**Configuration Status:** ✅ Complete
**Ready for Testing:** ✅ Yes
**Ready for Deployment:** ✅ Yes (after local testing)
