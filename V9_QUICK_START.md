# 🚀 V9 BALANCE SYSTEM - QUICK START

## 📋 30-Second Overview

**What is V9?**
- Double-entry bookkeeping system
- Live Google Sheets sync
- Transfer money between accounts via UI
- Auto-syncs accounts from /api/options

---

## ⚡ Quick Deploy (5 Steps)

### 1. Create Google Sheets (3 tabs)

| Sheet Name | Headers |
|------------|---------|
| **Accounts** | accountName, openingBalance, active, note, createdAt |
| **Transactions** | timestamp, fromAccount, toAccount, transactionType, amount, currency, note, referenceID, user |
| **Balance Summary** | accountName, openingBalance, netChange, currentBalance, lastTxnAt, inflow, outflow, note |

### 2. Add Apps Script

Copy from `APPS_SCRIPT_V9_NEW_BALANCE_SYSTEM.js` → Paste into Apps Script Editor

Add to `doPost`:
```javascript
} else if (payload.action === 'accountsSync') {
  return handleAccountsSync(payload);
} else if (payload.action === 'transactionAppend') {
  return handleTransactionAppend(payload);
} else if (payload.action === 'balanceGetSummary') {
  return handleBalanceGetSummary();
} else if (payload.action === 'getTransactions') {
  return handleGetTransactions(payload);
```

Deploy as Web App → Copy URL

### 3. Environment Variables

```env
SHEETS_V9_BALANCE_URL=<your-web-app-url>
SHEETS_V9_TRANSACTIONS_URL=<your-web-app-url>
SHEETS_V9_ACCOUNTS_URL=<your-web-app-url>
```

### 4. Sync Accounts

```bash
curl -X POST http://localhost:3000/api/v9/accounts/sync
```

### 5. Test Transfer

Open `http://localhost:3000/balance` → Click "💸 Transfer" → Done!

---

## 🎯 Key Endpoints

```bash
# Sync accounts from type-of-payments
POST /api/v9/accounts/sync

# Get all balances
POST /api/v9/balance/summary

# Create transfer
POST /api/v9/transactions
{
  "fromAccount": "Cash",
  "toAccount": "Bank Transfer - Bangkok Bank",
  "transactionType": "transfer",
  "amount": 1000,
  "note": "Rent payment"
}

# Get transaction history
GET /api/v9/transactions?accountName=Cash&limit=50
```

---

## 🎨 UI Features

✅ Real-time balance display  
✅ Transfer modal with validation  
✅ Inflow/outflow tracking  
✅ Drift detection warnings  
✅ Account sync button  
✅ Color-coded balances (positive=green, negative=red)  

---

## 📊 Data Flow

```
User Transfer → API → Apps Script → Google Sheets (3 tabs updated)
                                    ↓
                            Balance recalculated
                                    ↓
                              UI refreshes
```

---

## ⚠️ Important Notes

1. **Balance Summary** = Auto-calculated (don't edit manually!)
2. **Negative balances** = Allowed (system warns)
3. **Drift warning** = Means inflow ≠ outflow (review transactions)
4. **V8 backup** = Kept at `app/balance/page-old-v8.tsx`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Accounts not syncing | Check Data sheet column D has payment types |
| Drift detected | Review Transactions for incomplete entries |
| 302 errors | Already handled (redirect: 'manual') |
| Old page showing | Clear cache, hard refresh (Cmd+Shift+R) |

---

## 📚 Full Documentation

- **Deployment Guide**: `V9_BALANCE_SYSTEM_DEPLOYMENT_GUIDE.md`
- **Implementation Summary**: `V9_BALANCE_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **V8 Documentation**: `BALANCE_PAGE_COMPREHENSIVE_REPORT.md`

---

## ✅ Success Checklist

- [ ] 3 Google Sheets created
- [ ] Apps Script deployed
- [ ] Environment variables set
- [ ] Accounts synced (Accounts sheet populated)
- [ ] Test transfer works
- [ ] Balance Summary auto-updates
- [ ] UI shows updated balances

---

**🎉 You're ready to go!**

Open `/balance` and start transferring money between accounts!
