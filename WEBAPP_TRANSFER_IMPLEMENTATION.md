# WebApp Transfer Implementation - Complete Guide

**Version:** 1.0  
**Date:** 2025-01-15  
**Status:** ✅ IMPLEMENTATION COMPLETE  
**Alignment:** Apps Script V8.6 + Webapp Backend V1.1

---

## Executive Summary

This document outlines the complete implementation of the **Bank Transfer** feature in the BookMate WebApp backend. This aligns with the Apps Script V8.6 update and implements all 8 requirements from the PM specification.

### What Changed

1. **Validation Schema** (`utils/validatePayload.ts`)
   - Added "Transfer" to valid `typeOfOperation` values
   - Made `property` field OPTIONAL for transfers (required for revenue/expenses)
   - Made `ref` field REQUIRED for transfers (optional for revenue/expenses)
   - Added transfer-specific validation rules

2. **API Options Endpoint** (`app/api/options/route.ts`)
   - Always includes "Transfer" in typeOfOperation dropdown
   - Ensures frontend can select "Transfer" category

3. **Transfer Validation Rules**
   - Detail must contain "Transfer to" or "Transfer from"
   - Exactly ONE of debit/credit must be non-zero (not both)
   - Ref field is required and must match for both rows

---

## Implementation Details

### 1. Updated Validation Schema

**File:** `utils/validatePayload.ts`

#### Changes Made:

```typescript
// BEFORE: Property always required
if (!payload.day || !payload.month || !payload.year || !payload.property ||
    !payload.typeOfOperation || !payload.typeOfPayment || !payload.detail)

// AFTER: Property required only for revenue/expenses
const isTransfer = payload.typeOfOperation?.trim() === 'Transfer';

// Property validation: REQUIRED for revenue/expenses, OPTIONAL for transfers
if (!isTransfer && !payload.property) {
  return { isValid: false, error: 'Property is required for revenue and expense entries' };
}

// Ref validation: REQUIRED for transfers, optional for revenue/expenses
if (isTransfer && !payload.ref?.trim()) {
  return { isValid: false, error: 'Ref is required for transfer entries. Both transfer rows must share the same ref value.' };
}
```

#### Transfer-Specific Validation Rules:

```typescript
if (isTransfer) {
  // Rule 1: Detail must contain "Transfer to" or "Transfer from"
  const detailLower = detail.toLowerCase();
  if (!detailLower.includes('transfer to') && !detailLower.includes('transfer from')) {
    return { isValid: false, error: 'Transfer entries must have detail containing "Transfer to" or "Transfer from"' };
  }

  // Rule 2: Exactly ONE of debit/credit must be non-zero (not both, not neither)
  const hasDebit = debit > 0;
  const hasCredit = credit > 0;
  
  if (hasDebit && hasCredit) {
    return { isValid: false, error: 'Transfer entries must have either debit OR credit, not both' };
  }
  
  if (!hasDebit && !hasCredit) {
    return { isValid: false, error: 'Transfer entries must have either a debit or credit value (cannot be zero)' };
  }

  // Rule 3: Ref is required and must not be empty
  // This ensures matching transfer pairs can be identified
}
```

---

### 2. Updated API Options Endpoint

**File:** `app/api/options/route.ts`

#### Changes Made:

```typescript
// BEFORE: Only operations from Data!A2:A + Data!B2:B
typeOfOperations = normalizedOperations;

// AFTER: Always include "Transfer"
if (!normalizedOperations.includes('Transfer')) {
  normalizedOperations.push('Transfer');
}
typeOfOperations = normalizedOperations;
console.log(`[OPTIONS] Transfer included: ${typeOfOperations.includes('Transfer')}`);
```

**Why:** Ensures "Transfer" is always available in dropdowns, even if not in Google Sheets Data columns.

---

### 3. Two-Row Transfer Pattern

Every bank transfer creates **TWO rows** in the Google Sheet:

#### Row A: Source Account (Debit)
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",  // ✅ Empty for transfers
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Transfer to SCB Savings",
  "ref": "TXN-2025-001",  // ✅ Same ref for both rows
  "debit": 50000,  // ✅ Money OUT
  "credit": 0
}
```

#### Row B: Destination Account (Credit)
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",  // ✅ Empty for transfers
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - SCB Savings",
  "detail": "Transfer from Kasikorn",
  "ref": "TXN-2025-001",  // ✅ Same ref links both rows
  "debit": 0,
  "credit": 50000  // ✅ Money IN
}
```

**Key Points:**
- Same `ref` value links both rows
- Row A has debit, Row B has credit (same amount)
- Property is empty (not tied to real estate)
- Detail describes the direction ("to" vs "from")

---

## API Behavior

### /api/sheets (Webhook)

**BEFORE:**
```typescript
// Rejected transfers
if (!validation.data.typeOfOperation || invalidCategories.includes(validation.data.typeOfOperation)) {
  return error;
}
```

**AFTER:**
```typescript
// Accepts transfers (validated by validatePayload utility)
const validation = await validatePayload(body);
if (!validation.isValid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}

// Apps Script V8.6 handles the transfer logic
const normalizedData = validation.data;
```

---

### /api/options

**Response includes "Transfer":**
```json
{
  "ok": true,
  "data": {
    "typeOfOperation": [
      "Rent Income",
      "Electricity",
      "Water Bill",
      ...,
      "Transfer"  // ✅ Always present
    ]
  }
}
```

---

### /api/pnl

**P&L Calculations:**
- **REVENUE:** Includes rows where `typeOfOperation` matches revenue categories (excludes "Transfer")
- **EXPENSES:** Includes rows where `typeOfOperation` matches expense categories (excludes "Transfer")
- **TRANSFERS:** Excluded from P&L totals (only affect balances)

**Apps Script V8.6** already implements this logic:
```javascript
// From COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js getPnL()
// Revenue/expense calculations automatically exclude Transfer rows
// because "Transfer" is not in REVENUE_CATEGORIES or OVERHEAD_CATEGORIES
```

---

## Frontend Integration

### Dropdown Options

**Mobile/Web forms should:**
1. Fetch options from `/api/options`
2. Display "Transfer" in typeOfOperation dropdown
3. Implement conditional validation:
   - If "Transfer" selected: hide/disable Property field, require Ref field
   - If Revenue/Expense selected: require Property field, Ref optional

### Example Form Logic (React/Next.js)

```typescript
const [typeOfOperation, setTypeOfOperation] = useState('');
const isTransfer = typeOfOperation === 'Transfer';

// Conditional field requirements
<Select 
  label="Type of Operation" 
  value={typeOfOperation}
  onChange={(e) => setTypeOfOperation(e.target.value)}
>
  {options.typeOfOperation.map(op => (
    <option key={op} value={op}>{op}</option>
  ))}
</Select>

<Input 
  label="Property"
  required={!isTransfer}  // ✅ Optional for transfers
  disabled={isTransfer}   // ✅ Hide for transfers
  value={property}
/>

<Input 
  label="Ref"
  required={isTransfer}   // ✅ Required for transfers
  value={ref}
  placeholder={isTransfer ? "Must match for both rows" : "Optional"}
/>
```

---

## Testing Strategy

### Staging Test Plan

**Environment:** Staging/Test Google Sheet (not production)

#### Test Case 1: Valid Expense Entry
```json
{
  "day": "10",
  "month": "January", 
  "year": "2025",
  "property": "The Loft Ekkamai",
  "typeOfOperation": "Electricity",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Monthly electric bill",
  "ref": "",
  "debit": 2500,
  "credit": 0
}
```

**Expected Result:**
- ✅ Accepted by validation
- ✅ Appears in P&L expenses
- ✅ Deducts from bank balance

---

#### Test Case 2: Valid Revenue Entry
```json
{
  "day": "1",
  "month": "January",
  "year": "2025", 
  "property": "The Loft Ekkamai",
  "typeOfOperation": "Rent Income",
  "typeOfPayment": "Bank - SCB Savings",
  "detail": "January rent payment",
  "ref": "",
  "debit": 0,
  "credit": 15000
}
```

**Expected Result:**
- ✅ Accepted by validation
- ✅ Appears in P&L revenue
- ✅ Adds to bank balance

---

#### Test Case 3: Valid Transfer (Two Rows)

**Row A (Source):**
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Transfer to SCB Savings",
  "ref": "T-2025-001",
  "debit": 50000,
  "credit": 0
}
```

**Row B (Destination):**
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - SCB Savings",
  "detail": "Transfer from Kasikorn",
  "ref": "T-2025-001",
  "debit": 0,
  "credit": 50000
}
```

**Expected Results:**
- ✅ Both rows accepted by validation
- ✅ Kasikorn balance decreased by 50,000
- ✅ SCB Savings balance increased by 50,000
- ❌ Transfer does NOT appear in P&L revenue
- ❌ Transfer does NOT appear in P&L expenses
- ✅ Overall balance total unchanged (zero drift)
- ✅ Both rows linked by same ref "T-2025-001"

---

#### Test Case 4: Invalid Transfer (Missing Ref)
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Transfer to SCB",
  "ref": "",  // ❌ Missing ref
  "debit": 50000,
  "credit": 0
}
```

**Expected Result:**
- ❌ Rejected with error: "Ref is required for transfer entries. Both transfer rows must share the same ref value."

---

#### Test Case 5: Invalid Transfer (Both Debit and Credit)
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Transfer to SCB",
  "ref": "T-001",
  "debit": 50000,  // ❌ Both non-zero
  "credit": 50000
}
```

**Expected Result:**
- ❌ Rejected with error: "Transfer entries must have either debit OR credit, not both"

---

#### Test Case 6: Invalid Transfer (Missing "Transfer to/from")
```json
{
  "day": "15",
  "month": "January",
  "year": "2025",
  "property": "",
  "typeOfOperation": "Transfer",
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Money movement",  // ❌ Missing "Transfer to/from"
  "ref": "T-001",
  "debit": 50000,
  "credit": 0
}
```

**Expected Result:**
- ❌ Rejected with error: "Transfer entries must have detail containing 'Transfer to' or 'Transfer from'"

---

## Deployment Steps

### 1. Update Environment Variables (If Needed)
```bash
# .env.local (already configured)
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SHEETS_WEBHOOK_SECRET=your-secret-key
GOOGLE_SHEET_ID=your-sheet-id
```

### 2. Deploy Apps Script V8.6 (Already Done)
✅ `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js` updated to V8.6  
✅ Deployed to Google Sheets  
✅ Test function `testTransfer()` available

### 3. Deploy Webapp Backend V1.1 (This Update)
```bash
# Build and deploy
npm run build
vercel --prod  # or your deployment method
```

### 4. Clear API Caches
```bash
# Clear /api/options cache (force fresh dropdown data)
curl -X POST https://your-domain.com/api/pnl \
  -H "Content-Type: application/json" \
  -d '{"action":"clearCache"}'
```

### 5. Run Staging Tests
- Execute all 6 test cases documented above
- Verify P&L excludes transfers
- Verify balances update correctly
- Verify zero drift maintained

---

## Verification Checklist

### Backend Validation
- [ ] `validatePayload()` accepts "Transfer" typeOfOperation
- [ ] Property field optional for transfers
- [ ] Ref field required for transfers
- [ ] Transfer-specific rules enforced (detail, debit/credit)

### API Endpoints
- [ ] `/api/options` returns "Transfer" in typeOfOperation
- [ ] `/api/sheets` accepts transfer payloads
- [ ] `/api/pnl` excludes transfers from revenue/expense totals

### Google Sheets Integration
- [ ] Apps Script V8.6 deployed
- [ ] Transfer rows accepted
- [ ] Balance calculations correct
- [ ] P&L totals exclude transfers

### Frontend Integration
- [ ] Dropdown shows "Transfer" option
- [ ] Conditional validation works (property/ref)
- [ ] Form can submit transfer entries
- [ ] Error messages clear and helpful

---

## Monitoring & Logging

### What to Watch

1. **Validation Errors:**
   ```
   [VALIDATION] Transfer entries must have detail containing "Transfer to" or "Transfer from"
   [VALIDATION] Ref is required for transfer entries
   ```

2. **Options Endpoint:**
   ```
   [OPTIONS] Transfer included: true
   [OPTIONS] Found 34 operations from Data!A2:A + Data!B2:B + Transfer
   ```

3. **Apps Script Logs:**
   ```
   [V8.6] Handling webhook: Transfer
   [V8.6] Transfer detected, property optional
   [Balance] Updated Bank - Kasikorn: -50000
   [Balance] Updated Bank - SCB Savings: +50000
   ```

---

## Troubleshooting

### Issue: "Invalid operation type 'Transfer'"

**Cause:** `/api/options` cache not cleared  
**Fix:** 
```bash
# Force cache refresh
curl https://your-domain.com/api/options
```

---

### Issue: "Property is required"

**Cause:** Old validation logic still active  
**Fix:** 
1. Verify `utils/validatePayload.ts` updated
2. Restart Next.js dev server
3. Clear browser cache

---

### Issue: "Transfer appears in P&L"

**Cause:** Apps Script not filtering transfers correctly  
**Fix:**
1. Verify Apps Script V8.6 deployed
2. Check `REVENUE_CATEGORIES` and `OVERHEAD_CATEGORIES` do NOT include "Transfer"
3. Re-test `getPnL()` function

---

## Support & References

- **Apps Script Documentation:** `TRANSFER_FINAL_IMPLEMENTATION.md`
- **Deployment Guide:** `TRANSFER_DEPLOYMENT_STEPS.md`
- **Apps Script Tests:** `TRANSFER_VERIFICATION_TESTS.js`
- **PM Specification:** See conversation history (8 requirements)

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-15 | Initial implementation (8 PM requirements) |
| | | - Added "Transfer" to validation schema |
| | | - Made property optional for transfers |
| | | - Made ref required for transfers |
| | | - Added transfer-specific validation rules |
| | | - Updated /api/options endpoint |
| | | - Created staging test plan |

---

**Status:** ✅ Ready for Staging Tests  
**Next Step:** Run Test Cases 1-6 in staging environment
