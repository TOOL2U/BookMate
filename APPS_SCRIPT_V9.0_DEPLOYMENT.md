# 🚀 Apps Script V9.0 Deployment Guide

**Version:** 9.0  
**Date:** November 8, 2025  
**File:** `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`  
**Status:** ✅ Ready for Deployment

---

## 📋 What's New in V9.0

### 🧩 Transfer Logic Update

**Key Changes:**
1. ✅ "Transfer" type now reads from **Data!F2** as a neutral category (not revenue or expense)
2. ✅ Dynamic validation against Data sheet schema (columns A-F)
3. ✅ Transfers **EXCLUDED** from P&L revenue/expense calculations
4. ✅ Enhanced transfer detection and logging
5. ✅ Ref field validation for transfers

**Deprecated:**
- ❌ "EXP - Transfer" (removed from schema)
- ❌ "Revenue - Transfer" (removed from schema)

---

## 🎯 PM Requirements Implemented

### ✅ Apps Script Updates

```javascript
// V9.0: New validation function
function isValidTypeOfOperation_(value) {
  const validTypes = getValidTypeOfOperations_(); // Reads from Data!A2:F100
  return validTypes.indexOf(value.toString().trim()) !== -1;
}

// V9.0: Validates "Transfer" from Data!F2
// V9.0: Skips Transfer in P&L aggregation
// V9.0: Keeps dual-entry support intact
```

### ✅ Transfer Processing

```javascript
// Enhanced handleWebhook() function:
// 1. Validates typeOfOperation against Data sheet
// 2. Detects Transfer from Data!F2
// 3. Requires ref field for transfers
// 4. Logs P&L exclusion confirmation
// 5. Returns version 9.0 in response
```

---

## 📁 Data Sheet Structure

### Required Setup

**Data Sheet Must Have:**
- **Column A:** Revenue categories
- **Column B:** Expense categories (EXP -)
- **Column C:** Property/Person names
- **Column D:** Additional categories
- **Column E:** Additional categories
- **Column F:** **"Transfer"** (neutral category)

**Example Data!F2:**
```
Transfer
```

---

## 🔧 Deployment Steps

### Step 1: Backup Current Version
1. Open Google Sheet → Extensions → Apps Script
2. Copy existing code to a backup file
3. Note current deployment version

### Step 2: Deploy V9.0
1. **SELECT ALL** existing code in Apps Script editor
2. **DELETE** it completely
3. **COPY** entire content of `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`
4. **PASTE** into Apps Script editor
5. Click **Save** (💾)
6. Click **Deploy** → **Manage deployments** → **Edit** → **New version**
7. Description: `"V9.0 - Transfer Logic with Data!F2 Schema Support"`
8. Click **Deploy**

### Step 3: Verify Deployment
1. The webhook URL stays the same (no environment variable changes needed)
2. Test the health endpoint:
   ```bash
   curl https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Verify response shows `"version": "9.0 - Transfer Logic with Data!F2 Schema Support"`

---

## 🧪 Testing

### Test 1: Health Check
```bash
curl https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "BookMate webhook + Dynamic P&L + Inbox + Balance + Transfer Support",
  "version": "9.0 - Transfer Logic with Data!F2 Schema Support",
  "transferSpec": {
    "typeOfOperation": "Transfer (from Data!F2)",
    "pattern": "Two-row: debit (source) + credit (destination)",
    "ref": "Required - same value for both rows (e.g., T-2025-001)",
    "property": "Optional for transfers",
    "pnlImpact": "Excluded from revenue and expense totals",
    "deprecated": ["EXP - Transfer", "Revenue - Transfer"]
  }
}
```

### Test 2: Transfer Validation
Run `testTransfer()` from Apps Script editor:
1. Tools → Script editor
2. Select `testTransfer` function
3. Click Run
4. Check execution log

**Expected Log Output:**
```
=== Testing Transfer (Two-Row Pattern - V9.0) ===
--- Transfer OUT (Source) ---
{"ok":true,"success":true,"message":"Data appended successfully","row":XX,"timestamp":"...","isTransfer":true,"version":"9.0"}
--- Transfer IN (Destination) ---
{"ok":true,"success":true,"message":"Data appended successfully","row":XX,"timestamp":"...","isTransfer":true,"version":"9.0"}
✓ Transfer test complete! (V9.0)
Expected result:
  - Two rows in sheet with typeOfOperation = "Transfer" (from Data!F2)
  - Cash - Family: -500 (debit)
  - Bangkok Bank: +500 (credit)
  - P&L totals: UNCHANGED (transfers excluded)
  - Balance Summary: Cash -500, Bangkok Bank +500
  - Transactions sheet: 2 entries with matching ref T-2025-001
```

### Test 3: Webapp Integration
Run the webapp test suite:
```bash
node STAGING_TRANSFER_TESTS.js
```

**Expected:** All 7 tests pass (100%)

---

## 📊 V9.0 Features

### Core Functions

| Function | Purpose | V9.0 Change |
|----------|---------|-------------|
| `getValidTypeOfOperations_()` | Fetch valid types from Data sheet | **NEW** - Reads columns A-F |
| `isValidTypeOfOperation_(value)` | Validate typeOfOperation | **NEW** - Dynamic validation |
| `handleWebhook(payload)` | Process incoming receipts | **UPDATED** - Enhanced transfer support |
| `testTransfer()` | Test transfer functionality | **UPDATED** - V9.0 messaging |
| `doGet()` | Health check endpoint | **UPDATED** - V9.0 version info |

### Data Flow

```
Webapp/Mobile
    ↓
    POST /api/sheets
    ↓
Validation (validatePayload.ts)
    ↓
Apps Script V9.0
    ↓
getValidTypeOfOperations_() → Reads Data!A2:F100
    ↓
isValidTypeOfOperation_() → Validates "Transfer" from Data!F2
    ↓
handleWebhook() → Detects isTransfer = true
    ↓
Appends to "BookMate P&L 2025" sheet
    ↓
P&L formulas EXCLUDE Transfer from revenue/expenses
    ↓
Transactions sheet shows dual entries
```

---

## ⚠️ Important Notes

### Transfer Requirements (V9.0)
1. ✅ **typeOfOperation** = "Transfer" (must match Data!F2)
2. ✅ **ref** = Required (e.g., "T-2025-001")
3. ✅ **detail** = Must contain "Transfer to" or "Transfer from"
4. ✅ **debit/credit** = Exactly ONE must be > 0 (not both)
5. ✅ **property** = Optional (can be empty)

### Schema Changes
- **Old (V8.6):** Transfer was hardcoded in Apps Script
- **New (V9.0):** Transfer reads from Data!F2 schema
- **Benefit:** Centralized schema management, easier to maintain

### Backward Compatibility
- ✅ All existing endpoints work unchanged
- ✅ Webhook URL stays the same
- ✅ Revenue/Expense validation unchanged
- ✅ P&L calculations unchanged
- ✅ Balance management unchanged

---

## 🔍 Validation Logic

### V8.6 (Old)
```javascript
// Hardcoded check
const isTransfer = payload.typeOfOperation === 'Transfer';
```

### V9.0 (New)
```javascript
// Dynamic validation from Data sheet
if (!isValidTypeOfOperation_(payload.typeOfOperation)) {
  return createErrorResponse('Invalid typeOfOperation. Must be a valid value from Data sheet columns A-F.');
}

const isTransfer = payload.typeOfOperation === 'Transfer';
// V9.0: Transfer must exist in Data!F2
```

---

## 📱 Mobile App Requirements

**The mobile team needs to update:**

1. **Remove old transfer types:**
   - ❌ "EXP - Transfer"
   - ❌ "Revenue - Transfer"

2. **Use new transfer type:**
   - ✅ "Transfer" (from Data!F2)

3. **Transfer payload format:**
```json
{
  "typeOfOperation": "Transfer",
  "transactionType": "Transfer",
  "fromAccount": "Cash - Family",
  "toAccount": "Bank Transfer - Bangkok Bank - Shaun Ducker",
  "amount": 5000,
  "ref": "T-2025-001",
  "detail": "Transfer to Bank Transfer - Bangkok Bank - Shaun Ducker"
}
```

4. **Validation:**
   - ✅ Confirm only 2 rows per transfer are created
   - ✅ Both rows must have same ref
   - ✅ One row has debit > 0, other has credit > 0

---

## 🎯 Success Criteria

### ✅ Deployment Successful If:
1. Health endpoint returns version "9.0"
2. `testTransfer()` function executes without errors
3. Transfer validation reads from Data!F2
4. Transfers excluded from P&L calculations
5. All webapp tests pass (7/7)
6. Transactions sheet shows dual entries with matching refs

### ❌ Rollback If:
1. Health endpoint fails
2. Transfer validation errors
3. P&L calculations broken
4. Webapp tests fail
5. Data sheet schema issues

**Rollback Steps:**
1. Deploy → Manage deployments → Edit
2. Revert to previous version
3. Click Deploy
4. Notify team

---

## 📞 Support

### Common Issues

**Issue:** "Invalid typeOfOperation" error
**Solution:** Ensure Data!F2 contains "Transfer" (case-sensitive)

**Issue:** Transfer not excluded from P&L
**Solution:** Check P&L formulas exclude rows where typeOfOperation = "Transfer"

**Issue:** Ref validation failing
**Solution:** Ensure both transfer rows have identical ref value

**Issue:** Cache not updating
**Solution:** Run `clearAllCaches()` from Apps Script editor

---

## 📝 Changelog

### V9.0 (November 8, 2025)
- **Added:** Dynamic typeOfOperation validation from Data sheet
- **Added:** `getValidTypeOfOperations_()` function
- **Added:** `isValidTypeOfOperation_()` function
- **Updated:** `handleWebhook()` with enhanced transfer support
- **Updated:** `testTransfer()` with V9.0 messaging
- **Updated:** `doGet()` health check with V9.0 info
- **Updated:** Documentation and deployment instructions
- **Deprecated:** Hardcoded transfer validation
- **Removed:** Support for "EXP - Transfer" and "Revenue - Transfer"

### V8.6 (Previous)
- Transfer validation hardcoded
- Property optional for transfers
- Two-row pattern support

---

## ✅ Final Checklist

Before deployment:
- [ ] Data!F2 contains "Transfer"
- [ ] Backup current Apps Script version
- [ ] Review all code changes
- [ ] Test in Apps Script editor
- [ ] Verify Data sheet structure

After deployment:
- [ ] Health endpoint returns V9.0
- [ ] Run `testTransfer()` successfully
- [ ] Run webapp test suite (7/7 pass)
- [ ] Verify P&L excludes transfers
- [ ] Check Transactions sheet for dual entries
- [ ] Monitor execution logs for errors
- [ ] Notify mobile team of schema changes

---

**Status:** ✅ **READY FOR PRODUCTION DEPLOYMENT**

**Deployed by:** _____________  
**Date:** _____________  
**Verified by:** _____________  
**Date:** _____________

---

## 🎉 V9.0 Benefits

1. ✅ **Centralized Schema:** Transfer defined in Data sheet (single source of truth)
2. ✅ **Dynamic Validation:** Automatically validates against current Data sheet
3. ✅ **Better Logging:** Enhanced transfer detection and P&L exclusion confirmation
4. ✅ **Cleaner Code:** Removed deprecated transfer types
5. ✅ **Future-Proof:** Easy to add new transfer types in Data sheet
6. ✅ **Alignment:** Mobile, Web, and Sheets all use same schema

**V9.0 is the most robust and maintainable transfer implementation to date!** 🚀
