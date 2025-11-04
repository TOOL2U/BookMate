# 🚀 Balance System QA - Quick Reference Card

**Status:** 75% Complete | **Date:** Nov 4, 2025

---

## 📖 START HERE

1. **Read:** `README_BALANCE_QA.md` (navigation & index)
2. **Quick Summary:** `BALANCE_QA_IMPLEMENTATION_COMPLETE.md`
3. **Full Details:** `BALANCE_SYSTEM_QA_REPORT.md` (500+ lines)

---

## ⚡ CRITICAL TASKS (2 blockers)

### 1. Deploy Apps Script V9 (15 min)
```
1. Go to: https://script.google.com
2. Find project for: 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
3. Copy: APPS_SCRIPT_COMPLETE_WITH_V9.js (entire file)
4. Paste into Code.gs (replace all)
5. Deploy → New deployment → "V9 Balance System"
6. Verify URL matches .env.local SHEETS_WEBHOOK_URL
```

### 2. Verify Google Sheets (10 min)
```
Open: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8

Check sheets exist:
☐ Data
☐ Lists (Summary Data)
☐ P&L (DO NOT EDIT)
☐ Accounts (V9 new)
☐ Transactions (V9 new)
☐ Ledger (V9 new)
☐ Balance Summary (V9 new)

If missing → See BALANCE_SYSTEM_QA_REPORT.md Section 1
```

---

## 🧪 TEST COMMANDS

### Run All Tests
```bash
chmod +x test-balance-system.sh
./test-balance-system.sh
```

### Test Specific Endpoint
```bash
# Balance summary
curl http://localhost:3000/api/balance/summary | jq '.'

# Transactions
curl http://localhost:3000/api/v9/transactions | jq '.'

# Options (with cache-busting)
curl "http://localhost:3000/api/options?t=$(date +%s)" | jq '.'
```

### Create Test Transaction
```bash
curl -X POST http://localhost:3000/api/v9/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date":"2025-11-04",
    "fromAccount":"",
    "toAccount":"Cash",
    "amount":100,
    "type":"Revenue",
    "detail":"Test sale",
    "month":"NOV"
  }' | jq '.'
```

---

## 📊 COMPLETION CHECKLIST

### Code (100%)
- [x] All API endpoints created/verified
- [x] Cache-busting enabled
- [x] Error handling implemented
- [x] Logging added

### Documentation (100%)
- [x] README_BALANCE_QA.md
- [x] BALANCE_QA_IMPLEMENTATION_COMPLETE.md
- [x] BALANCE_SYSTEM_QA_REPORT.md
- [x] test-balance-system.sh

### Deployment (0%)
- [ ] Apps Script V9 deployed ⚡
- [ ] Google Sheets verified ⚡
- [ ] Tests passing
- [ ] UI tested

---

## 📁 FILE QUICK REFERENCE

| File | Purpose | Lines |
|------|---------|-------|
| `README_BALANCE_QA.md` | Index & navigation | 400 |
| `BALANCE_QA_IMPLEMENTATION_COMPLETE.md` | Quick summary | 300 |
| `BALANCE_SYSTEM_QA_REPORT.md` | Full QA docs | 500 |
| `test-balance-system.sh` | Test suite | 450 |
| `app/api/balance/summary/route.ts` | NEW endpoint | 90 |
| `app/settings/page.tsx` | Cache-bust added | 298 |

---

## 🎯 YOUR 8 SECTIONS STATUS

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 0 | Pre-Flight | ✅ 100% | All checks pass |
| 1 | Spreadsheet | ⏳ 20% | Manual verify |
| 2 | API Layer | ✅ 100% | All endpoints ready |
| 3 | UI | ✅ 90% | Needs browser test |
| 4 | Transactions | ⏳ 0% | Apps Script needed |
| 5 | AI (Phase 6) | ⏭️ N/A | Future |
| 6 | Edge Cases | ⏳ 0% | Apps Script needed |
| 7 | Observability | ✅ 80% | Mostly done |
| 8 | Rollback | ✅ 100% | Documented |

**Overall: 75%**

---

## ⏱️ TIME TO COMPLETION

- Apps Script deployment: 15 min
- Sheets verification: 10 min
- Run tests: 5 min
- **Total: 30 minutes to 100%**

---

## 🔗 QUICK LINKS

- **Google Sheets:** https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
- **Apps Script:** https://script.google.com
- **Balance Page:** http://localhost:3000/balance
- **Settings Page:** http://localhost:3000/settings

---

## 🆘 TROUBLESHOOTING

**Apps Script not working?**
→ Check logs: Apps Script editor → View → Logs

**API returning errors?**
→ Check: Browser console (F12) or Next.js terminal

**Tests failing?**
→ Ensure Apps Script deployed first

**Sheets missing?**
→ Create using templates in BALANCE_SYSTEM_QA_REPORT.md § 1

---

## ✅ SUCCESS CRITERIA

All green = QA complete:
- [x] ENV configured
- [x] APIs created
- [x] Cache-busting enabled
- [ ] Apps Script deployed ⚡
- [ ] Sheets verified ⚡
- [ ] Tests passing
- [ ] UI working
- [ ] Transactions create
- [ ] Balances update

---

**Next:** Deploy Apps Script V9 → Verify Sheets → Run tests → Done! 🎉
