# 📱 Mobile App Team - Transfer System Update V9.1

**Date:** November 9, 2025  
**Priority:** HIGH - Breaking Changes  
**Status:** Backend Complete, Mobile Update Required

---

## 🎯 Executive Summary

The backend transfer system has been updated to V9.1 with **critical schema changes**. The mobile app MUST be updated to align with these changes to ensure transfers work correctly.

**Key Change:** Transfer validation now reads from specific Data sheet columns (A, B, F) instead of all columns, preventing property/person names from being accepted as valid typeOfOperation values.

---

## 🚨 Critical Changes - ACTION REQUIRED

### 1. **Transfer TypeOfOperation Schema (V9.0)**

**OLD (Deprecated - Remove from Mobile App):**
```json
{
  "typeOfOperation": "EXP - Transfer"  // ❌ DEPRECATED
}
```
```json
{
  "typeOfOperation": "Revenue - Transfer"  // ❌ DEPRECATED
}
```

**NEW (Required - Implement in Mobile App):**
```json
{
  "typeOfOperation": "Transfer"  // ✅ REQUIRED (from Data!F2)
}
```

### 2. **Data Sheet Column Structure (V9.1)**

The backend now validates `typeOfOperation` against **specific columns only**:

| Column | Contains | Example Values |
|--------|----------|----------------|
| **A** | Revenue Types | "Revenue - Accommodation", "Revenue - Food & Beverage" |
| **B** | Expense Types | "EXP - Construction - Materials", "EXP - Salaries" |
| **F** | Neutral Types | "Transfer" (in cell F2) |

**What Changed:**
- **V9.0 (Old):** Read ALL columns A-F (accidentally included properties/persons from C-E)
- **V9.1 (New):** Read ONLY columns A, B, F (correct typeOfOperation sources)

**Impact on Mobile:**
- ❌ Property/person names are NO LONGER valid typeOfOperation values
- ✅ Only revenue, expense, and "Transfer" types are accepted

---

## 📋 Transfer Implementation Checklist for Mobile

### ✅ Required Changes

1. **Update Transfer Form**
   - [ ] Remove "EXP - Transfer" option from dropdown
   - [ ] Remove "Revenue - Transfer" option from dropdown
   - [ ] Add "Transfer" option (neutral category)
   - [ ] Ensure transfer UI clearly shows it's a neutral operation (not expense/revenue)

2. **Update Transfer Validation**
   - [ ] Set `typeOfOperation: "Transfer"` for all transfer transactions
   - [ ] Ensure `ref` field is REQUIRED for transfers
   - [ ] Ensure `property` field is OPTIONAL for transfers (different from revenue!)
   - [ ] Validate transfer pattern: exactly 2 rows with matching `ref`

3. **Update TypeOfOperation Dropdown**
   - [ ] Fetch valid options from `/api/options` endpoint
   - [ ] Filter out any property/person names that may appear
   - [ ] Only show values from columns A, B, F of Data sheet

4. **Update Error Handling**
   - [ ] Handle new error: "Invalid typeOfOperation. Must be a valid value from Data sheet columns A-F"
   - [ ] Handle transfer-specific errors: "Ref is required for transfer entries"

---

## 🔧 Technical Specifications

### Transfer Payload Structure (2-Row Pattern)

**Row A - Source Account (Debit)**
```json
{
  "day": "9",
  "month": "Nov",
  "year": "2025",
  "property": "",  // ✅ OPTIONAL for transfers
  "typeOfOperation": "Transfer",  // ✅ Must be exactly "Transfer" (from Data!F2)
  "typeOfPayment": "Cash - Family",  // Source account
  "detail": "Transfer to Bank Transfer - Bangkok Bank - Shaun Ducker",  // ✅ Must contain "Transfer to"
  "ref": "T-2025-001",  // ✅ REQUIRED - unique ID for both rows
  "debit": 500,  // ✅ Positive amount
  "credit": 0,   // ✅ Must be 0
  "secret": "..."
}
```

**Row B - Destination Account (Credit)**
```json
{
  "day": "9",
  "month": "Nov",
  "year": "2025",
  "property": "",  // ✅ OPTIONAL for transfers
  "typeOfOperation": "Transfer",  // ✅ Must be exactly "Transfer" (from Data!F2)
  "typeOfPayment": "Bank Transfer - Bangkok Bank - Shaun Ducker",  // Destination account
  "detail": "Transfer from Cash - Family",  // ✅ Must contain "Transfer from"
  "ref": "T-2025-001",  // ✅ SAME ref as Row A
  "debit": 0,    // ✅ Must be 0
  "credit": 500, // ✅ Positive amount
  "secret": "..."
}
```

### Validation Rules

| Rule | Requirement | Error Message |
|------|-------------|---------------|
| **typeOfOperation** | Must be "Transfer" (from Data!F2) | "Invalid typeOfOperation. Must be a valid value from Data sheet columns A-F." |
| **ref** | REQUIRED for transfers | "Ref is required for transfer entries. Both transfer rows must share the same ref value." |
| **property** | OPTIONAL for transfers | N/A (no error if missing) |
| **detail** | Must contain "Transfer to" or "Transfer from" | "Detail must contain 'Transfer to' or 'Transfer from' for transfer entries." |
| **debit/credit** | Exactly ONE must be > 0 | "Transfer must have either debit OR credit, not both." |
| **ref matching** | Both rows must have same ref | "Both transfer rows must have matching ref values." |

---

## 📊 P&L Impact

**Important:** Transfers are **EXCLUDED** from P&L calculations.

- ✅ Revenue totals: Do NOT include transfers
- ✅ Expense totals: Do NOT include transfers
- ✅ Balance updates: Transfers affect bank/cash balances ONLY

**Mobile UI Guidance:**
- Show transfers in transaction history with neutral badge (not red/green)
- Don't include transfers in revenue/expense charts
- Show transfers in separate "Balance Movements" section

---

## 🧪 Testing Requirements

### Test Cases for Mobile App

1. **Valid Transfer**
   ```
   Input: Transfer with typeOfOperation="Transfer", ref="T-001"
   Expected: 200 OK, 2 rows created
   ```

2. **Invalid Transfer - Wrong TypeOfOperation**
   ```
   Input: Transfer with typeOfOperation="EXP - Transfer"
   Expected: 400 Error "Invalid typeOfOperation"
   ```

3. **Invalid Transfer - Missing Ref**
   ```
   Input: Transfer with typeOfOperation="Transfer", ref=""
   Expected: 400 Error "Ref is required"
   ```

4. **Invalid Transfer - Property Name as TypeOfOperation**
   ```
   Input: Transfer with typeOfOperation="Sia Moon - Land - General"
   Expected: 400 Error "Invalid typeOfOperation"
   ```

5. **Valid Expense - Should Still Work**
   ```
   Input: Expense with typeOfOperation="EXP - Salaries"
   Expected: 200 OK
   ```

---

## 🔗 API Endpoints Reference

### Get Valid TypeOfOperation Options
```
POST /api/options
Headers: { "Content-Type": "application/json" }
Body: { "secret": "..." }

Response:
{
  "typeOfOperation": [
    "Transfer",
    "Revenue - Accommodation",
    "Revenue - Food & Beverage",
    "EXP - Construction - Materials",
    "EXP - Salaries",
    ...
  ]
}
```

**Note:** The `/api/options` endpoint automatically:
- ✅ Includes "Transfer" from Data!F2
- ✅ Filters out old "EXP - Transfer" and "Revenue - Transfer"
- ✅ Returns only valid options from columns A, B, F

### Submit Transfer
```
POST /api/sheets
Headers: { "Content-Type": "application/json" }
Body: { 
  "typeOfOperation": "Transfer",
  "ref": "T-2025-001",
  ... 
}

Response (Success):
{
  "ok": true,
  "success": true,
  "message": "Data appended successfully",
  "isTransfer": true,
  "version": "9.1"
}

Response (Error):
{
  "ok": false,
  "error": "Invalid typeOfOperation. Must be a valid value from Data sheet columns A-F."
}
```

---

## 📝 Migration Guide

### Step 1: Update Transfer UI
1. Remove old transfer options from dropdowns
2. Add new "Transfer" option with neutral styling
3. Update transfer form to show ref field prominently
4. Add validation to ensure ref is provided

### Step 2: Update Transfer Logic
1. Change all `typeOfOperation` values from "EXP - Transfer" → "Transfer"
2. Change all `typeOfOperation` values from "Revenue - Transfer" → "Transfer"
3. Ensure transfer payload includes required `ref` field
4. Make `property` field optional for transfers

### Step 3: Update Validation
1. Fetch valid typeOfOperation options from `/api/options`
2. Validate user input against the fetched list
3. Show clear error messages for invalid selections

### Step 4: Testing
1. Test creating a transfer with new schema
2. Test validation errors (missing ref, wrong typeOfOperation)
3. Test backward compatibility (old transfers should still display)
4. Verify P&L excludes transfers from revenue/expense totals

---

## 🆘 Troubleshooting

### Issue: "Invalid typeOfOperation" error when submitting transfer
**Cause:** Using old format ("EXP - Transfer" or "Revenue - Transfer")  
**Solution:** Use "Transfer" exactly as it appears in Data!F2

### Issue: "Ref is required" error
**Cause:** Missing or empty `ref` field in transfer payload  
**Solution:** Generate unique ref ID (e.g., "T-2025-001") and include in both rows

### Issue: Property names appearing in typeOfOperation dropdown
**Cause:** Mobile app caching old dropdown values  
**Solution:** Clear cache and fetch fresh options from `/api/options`

### Issue: Transfers showing in P&L revenue/expense totals
**Cause:** Mobile app not filtering transfers from calculations  
**Solution:** Exclude transactions where `typeOfOperation === "Transfer"` from P&L charts

---

## 📞 Support & Questions

**Backend Version:** V9.1 (Apps Script)  
**Webapp Version:** V1.1 (Next.js)  
**Last Updated:** November 9, 2025

**Questions?** Contact backend team or refer to:
- `APPS_SCRIPT_V9.0_PM_SUMMARY.md` - Executive overview
- `APPS_SCRIPT_V9.0_IMPLEMENTATION_COMPLETE.md` - Technical details
- `STAGING_TRANSFER_TESTS.js` - Working test examples

---

## ✅ Sign-Off Checklist

Before marking mobile app as transfer-ready:

- [ ] Updated transfer form UI (removed old options, added "Transfer")
- [ ] Updated transfer validation (ref required, property optional)
- [ ] Fetching typeOfOperation options from `/api/options`
- [ ] Filtering out property/person names from dropdown
- [ ] Tested valid transfer creation (2 rows, matching ref)
- [ ] Tested invalid scenarios (missing ref, wrong typeOfOperation)
- [ ] Updated P&L calculations (exclude transfers)
- [ ] Updated UI to show transfers as neutral (not red/green)
- [ ] Verified backward compatibility (old transfers display correctly)
- [ ] Code reviewed and approved by mobile team lead

---

**Status:** 🟡 Backend Ready, Awaiting Mobile Implementation

**Next Steps:**
1. Mobile team reviews this document
2. Mobile team implements changes
3. Mobile team tests against staging backend
4. Mobile team confirms sign-off checklist complete
5. Coordinate production deployment with PM

---

*Document Version: 1.0*  
*Generated: November 9, 2025*  
*Backend Team: BookMate Core*
