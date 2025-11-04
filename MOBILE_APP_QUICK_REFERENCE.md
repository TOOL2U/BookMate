# 📱 Mobile App - Quick Reference Card

**Version**: Unified Balance System v9  
**Date**: November 4, 2025

---

## 🎯 Essential Information

**Spreadsheet ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`  
**Base URL**: `https://your-webapp-domain.vercel.app`  
**Auth**: None required (currently)

---

## 🔌 API Endpoints

### 1. Get Balances ⭐ MAIN ENDPOINT

```
GET /api/balance?month=ALL
```

**Returns**: All account balances (5 accounts)

**Response**:
```json
{
  "ok": true,
  "source": "BalanceSummary",
  "data": [{
    "accountName": "Bank Transfer - Bangkok Bank - Maria Ren",
    "currentBalance": 1000,
    "openingBalance": 0,
    "netChange": 1000,
    "inflow": 1000,
    "outflow": 0,
    "lastTxnAt": "2025-11-04T10:30:00Z"
  }],
  "totals": {
    "currentBalance": 1000,
    "netChange": 1000,
    "inflow": 1000,
    "outflow": 1000
  }
}
```

**Month Filter**:
- `?month=ALL` - All months (default)
- `?month=NOV` - November only
- `?month=DEC` - December only

---

### 2. Submit Transaction

```
POST /api/sheets
Content-Type: application/json
```

**Body**:
```json
{
  "day": "4",
  "month": "NOV",
  "year": "2025",
  "property": "Sia Moon - Land - General",
  "typeOfOperation": "Revenue - Commision",
  "typeOfPayment": "Bank Transfer - Bangkok Bank - Maria Ren",
  "detail": "Monthly commission",
  "ref": "INV-001",
  "debit": 0,
  "credit": 1000
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Transaction submitted successfully"
}
```

**⚠️ Important**: Wait 3 seconds after submit before fetching balances (Apps Script processing)

---

### 3. Get Dropdown Options

```
GET /api/options
```

**Returns**:
```json
{
  "ok": true,
  "data": {
    "revenues": ["Revenue - Commision", ...],
    "overheadExpenses": ["EXP - Household - Alcohol & Vapes", ...],
    "properties": ["Sia Moon - Land - General", ...],
    "typeOfPayments": [
      "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "Bank Transfer - Bangkok Bank - Maria Ren",
      "Bank transfer - Krung Thai Bank - Family Account",
      "Cash - Family",
      "Cash - Alesia"
    ],
    "months": ["JAN", "FEB", "MAR", ...]
  }
}
```

---

### 4. Health Check (Optional)

```
GET /api/health/balance
```

**Returns**: System status, detected tabs, warnings

---

## 🔄 Typical Flow

```
1. App Launch
   ↓
2. GET /api/options
   (load dropdowns)
   ↓
3. GET /api/balance?month=ALL
   (display balances)
   ↓
4. User submits transaction
   ↓
5. POST /api/sheets
   ↓
6. Wait 3 seconds ⏱️
   ↓
7. GET /api/balance?month=ALL
   (refresh balances)
   ↓
8. Done! ✅
```

---

## 📊 Account Data Structure

Each account has:
- `accountName` - Account name (e.g., "Bank Transfer - Bangkok Bank - Maria Ren")
- `currentBalance` - **Current balance** ⭐ PRIMARY METRIC
- `openingBalance` - Starting balance
- `netChange` - Total change (inflow - outflow)
- `inflow` - Money received
- `outflow` - Money spent
- `lastTxnAt` - Last transaction timestamp (or null)
- `note` - Auto-generated note

**Display Priority**:
1. `currentBalance` - Main display (large, prominent)
2. `inflow` / `outflow` - Secondary info (smaller, green/red)
3. `lastTxnAt` - Tertiary info (timestamp)

---

## ⚠️ Important Notes

### 1. Processing Delay
After `POST /api/sheets`, wait **3 seconds** before fetching balances.

```typescript
// Submit transaction
await submitTransaction(data);

// Wait for Apps Script
await sleep(3000);

// Refresh balance
await fetchBalances();
```

### 2. Negative Balances
Some accounts may have negative `currentBalance` (overdraft).
- Display in **red color**
- Show negative sign

### 3. Account Names
Account names in `/api/balance` match exactly with `typeOfPayments` from `/api/options`.

### 4. Month Filter
- Affects: `netChange`, `inflow`, `outflow`, `currentBalance`
- Does NOT affect: `openingBalance`

---

## 🧪 Test Commands

```bash
# Test balance endpoint
curl 'https://your-domain.vercel.app/api/balance?month=ALL'

# Test options endpoint
curl 'https://your-domain.vercel.app/api/options'

# Test submit
curl -X POST 'https://your-domain.vercel.app/api/sheets' \
  -H 'Content-Type: application/json' \
  -d '{"day":"4","month":"NOV","year":"2025","property":"Sia Moon - Land - General","typeOfOperation":"Revenue - Commision","typeOfPayment":"Bank Transfer - Bangkok Bank - Maria Ren","detail":"Test","ref":"TEST","debit":0,"credit":500}'

# Wait 3 seconds, then check balance again
```

---

## 🎨 UI Recommendations

### Balance Card

```
┌────────────────────────────┐
│ 💳 Bangkok Bank - Maria    │ <- Icon + Name
│                            │
│ ฿ 1,000                    │ <- Large balance
│                            │
│ ↑ ฿1,000  ↓ ฿0            │ <- Inflow/Outflow
│ Nov 4, 10:30am             │ <- Last transaction
└────────────────────────────┘
```

### Color Coding
- **Positive balance**: Green or default color
- **Negative balance**: Red
- **Zero balance**: Gray
- **Inflow**: Green arrow ↑
- **Outflow**: Red arrow ↓

### Source Badge
- **"📊 Live"**: Data from Balance Summary (real-time)
- **"🧮 Computed"**: Calculated data (fallback)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Balance not updating | Wait 3 seconds after submit |
| Wrong balance shown | Check month filter |
| "Not found" error | Check endpoint URL |
| Network error | Retry with exponential backoff |

---

## 📞 Contact

**Webapp Team**: [Your contact]  
**Questions**: Integration, API issues  

**Apps Script Team**: [Your contact]  
**Questions**: Balance calculation, auto-update

---

## ✅ Pre-Launch Checklist

- [ ] Base URL configured
- [ ] `/api/balance` tested
- [ ] `/api/sheets` tested
- [ ] 3-second delay implemented
- [ ] Error handling added
- [ ] Negative balances styled
- [ ] Month filter working
- [ ] Loading indicators added
- [ ] End-to-end test passed

---

**Status**: ✅ Ready for Integration  
**Last Updated**: November 4, 2025
