# 🚀 Dual Deployment Quick Reference

## Environment Variables

```bash
# P&L Sheet (Data Entry & Reports)
SHEETS_WEBHOOK_URL=...AKfycbwKa0f0m_...hmFl/exec
SHEETS_PNL_URL=...AKfycbwKa0f0m_...hmFl/exec
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

# Balance Sheet (Accounts & Transactions)
SHEETS_BALANCE_URL=...AKfycbyER8w5q3...ioBs/exec
BALANCE_SHEET_ID=1zJa_cwOA40escBDZfOOBcFV-c2yP_TdCvNFNjIXgWpI

# Shared Secret
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
```

## API Routing

**P&L Sheet:**
- `/api/options` - Dropdowns
- `/api/pnl` - P&L report
- `/api/inbox` - Inbox entries
- `/api/sheets` - Add/delete entries

**Balance Sheet:**
- `/api/balance/summary` - Balance summary
- `/api/v9/transactions` - Transactions
- `/api/v9/accounts/sync` - Sync accounts

## Quick Test

```bash
# Test both deployments
./test-dual-deployments.sh

# Or test individually
curl http://localhost:3000/api/options | jq '.ok'
curl http://localhost:3000/api/balance/summary | jq '.ok'
```

## Files Changed

✅ `.env.local` - Added `SHEETS_BALANCE_URL` and `BALANCE_SHEET_ID`  
✅ `app/api/balance/summary/route.ts` - Uses `SHEETS_BALANCE_URL`  
✅ `app/api/v9/transactions/route.ts` - Uses `SHEETS_BALANCE_URL`  
✅ `app/api/v9/accounts/sync/route.ts` - Uses `SHEETS_BALANCE_URL`

## Deployment Checklist

- [ ] Local tests pass
- [ ] Balance Sheet structure verified
- [ ] Vercel env vars added
- [ ] Production deployment
- [ ] Production tests pass

## Support Docs

- `DUAL_DEPLOYMENT_SUCCESS.md` - Test results & next steps
- `DUAL_DEPLOYMENT_COMPLETE.md` - Full guide
- `TWO_DEPLOYMENTS_CONFIG.md` - Technical details
