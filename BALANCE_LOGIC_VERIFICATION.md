# Balance Calculation Logic Verification ✅

**Date**: November 3, 2025  
**Purpose**: Verify bank account balance tracking is 100% accurate

---

## Current Implementation

### Formula
```
Current Balance = Uploaded Balance + Total Revenue - Total Expenses
```

### Code Location
`/app/api/balance/by-property/route.ts` - Line 176:
```typescript
const currentBalance = uploaded.balance + totalRevenues - totalExpenses;
```

---

## Your Example Scenario

### Scenario: Shaun Ducker's Bangkok Bank Account

**Initial State:**
- Bank Account: "Bank Transfer - Bangkok Bank - Shaun Ducker"
- Starting Balance (uploaded): ฿200

**Transaction:**
- Person: Shaun Ducker - Personal
- Expense: ฿100 on "Exp - Construction - Paint"
- Type of Payment: "Bank Transfer - Bangkok Bank - Shaun Ducker"
- Debit: ฿100
- Credit: ฿0

**Calculation:**
```
Current Balance = ฿200 + ฿0 - ฿100 = ฿100 ✅
```

**Expected Result:**
- Balance page should show "Bank Transfer - Bangkok Bank - Shaun Ducker" = ฿100 ✅

---

## Logic Verification

### ✅ **CORRECT Logic:**

1. **Filter by Bank Account** (Line 161):
   ```typescript
   const bankTransactions = transactions.filter(tx => tx.typeOfPayment === bankName);
   ```
   - ✅ Filters transactions by `typeOfPayment` (bank account)
   - ✅ Each bank account tracked separately

2. **Calculate Revenue** (Line 167-170):
   ```typescript
   if (tx.credit > 0) {
     totalRevenues += tx.credit;
   }
   ```
   - ✅ Sums all incoming money (deposits, income)
   - Example: Booking revenue deposited to Bangkok Bank - Shaun

3. **Calculate Expenses** (Line 171-174):
   ```typescript
   if (tx.debit > 0) {
     totalExpenses += tx.debit;
   }
   ```
   - ✅ Sums all outgoing money (payments, expenses)
   - Example: Shaun spends ฿100 on paint from Bangkok Bank

4. **Calculate Current Balance** (Line 177):
   ```typescript
   const currentBalance = uploaded.balance + totalRevenues - totalExpenses;
   ```
   - ✅ Starts with uploaded balance (manual entry from bank statement)
   - ✅ Adds revenue (money coming in)
   - ✅ Subtracts expenses (money going out)
   - ✅ Result = actual current balance

---

## Test Scenarios

### Test Case 1: Expense Only
```
Uploaded Balance: ฿200
Transactions:
  - Debit ฿100 (paint purchase)
  
Result: ฿200 + ฿0 - ฿100 = ฿100 ✅
```

### Test Case 2: Revenue Only
```
Uploaded Balance: ฿200
Transactions:
  - Credit ฿500 (booking payment)
  
Result: ฿200 + ฿500 - ฿0 = ฿700 ✅
```

### Test Case 3: Mixed Transactions
```
Uploaded Balance: ฿1,000
Transactions:
  - Credit ฿2,000 (booking payment)
  - Debit ฿300 (supplies)
  - Debit ฿150 (utilities)
  
Result: ฿1,000 + ฿2,000 - ฿450 = ฿2,550 ✅
```

### Test Case 4: Multiple Bank Accounts
```
Bangkok Bank - Shaun:
  Uploaded: ฿200
  Debit: ฿100
  Result: ฿100 ✅

Bangkok Bank - Maria:
  Uploaded: ฿500
  Debit: ฿50
  Result: ฿450 ✅

Cash:
  Uploaded: ฿300
  Debit: ฿100
  Credit: ฿200
  Result: ฿300 + ฿200 - ฿100 = ฿400 ✅
```

---

## Data Flow

### 1. User Uploads Initial Balance
```
Mobile App → POST /api/balance/save
→ Saves to "Bank & Cash Balance" sheet
→ Row: [timestamp, bankName, balance, note]
```

### 2. User Creates Transaction
```
Mobile App → POST /api/webhook (Apps Script)
→ Transaction saved to "BookMate P&L 2025" sheet
→ Fields: typeOfPayment, debit, credit, etc.
```

### 3. Web App Calculates Balance
```
GET /api/balance/by-property
→ Fetches uploaded balances from sheet
→ Fetches all transactions from inbox
→ Groups by typeOfPayment
→ Calculates: uploaded + revenue - expenses
→ Returns current balance
```

---

## Potential Issues to Check

### ❓ Issue 1: Transaction Filtering
**Question**: Are transactions correctly filtered by `typeOfPayment`?

**Verification Needed**:
- Check if `typeOfPayment` field matches bank names exactly
- Example: Does transaction have `typeOfPayment: "Bank Transfer - Bangkok Bank - Shaun Ducker"`?

**Test**: Let's verify the actual data structure

### ❓ Issue 2: Debit/Credit Assignment
**Question**: Are debits and credits correctly assigned?

**Current Logic**:
- `tx.credit > 0` → Revenue (money IN)
- `tx.debit > 0` → Expense (money OUT)

**Expected Behavior**:
- Expense transaction → `debit: 100, credit: 0`
- Revenue transaction → `debit: 0, credit: 100`

**Test**: Need to verify Apps Script assigns these correctly

### ❓ Issue 3: Bank Name Matching
**Question**: Do uploaded balance bank names match typeOfPayment values?

**Example**:
```
Uploaded Balance Sheet:
  bankName: "Bank Transfer - Bangkok Bank - Shaun Ducker"
  
Transaction:
  typeOfPayment: "Bank Transfer - Bangkok Bank - Shaun Ducker"
  
Match: ✅ Exact string match required
```

**Potential Problem**: Typos, extra spaces, different formatting

---

## Recommended Tests

### Test 1: Check Transaction Data Structure
Run this to see actual transaction data:
```bash
curl -X POST http://localhost:3000/api/inbox \
  -H "Content-Type: application/json" \
  | jq '.data[0]'
```

Expected output:
```json
{
  "day": "3",
  "month": "November",
  "year": "2025",
  "property": "Shaun Ducker - Personal",
  "typeOfOperation": "Exp - Construction - Paint",
  "typeOfPayment": "Bank Transfer - Bangkok Bank - Shaun Ducker",
  "detail": "Paint supplies",
  "ref": "INV-001",
  "debit": 100,
  "credit": 0
}
```

### Test 2: Check Balance Calculation
```bash
curl -X POST http://localhost:3000/api/balance/by-property \
  | jq '.propertyBalances'
```

Expected output:
```json
[
  {
    "property": "Bank Transfer - Bangkok Bank - Shaun Ducker",
    "balance": 100,
    "uploadedBalance": 200,
    "totalRevenue": 0,
    "totalExpense": 100,
    "transactionCount": 1
  }
]
```

### Test 3: Verify Bank Name Consistency
Check if bank names match between:
1. Balance upload sheet
2. Transaction typeOfPayment
3. Available banks in options.json

---

## Summary

### ✅ **Logic is CORRECT**

The formula `Current Balance = Uploaded Balance + Revenue - Expenses` is mathematically correct for bank account tracking.

### ⚠️ **Need to Verify**

1. **Data Structure**: Confirm transactions have correct `typeOfPayment` values
2. **Name Matching**: Ensure bank names match exactly between sheets
3. **Debit/Credit**: Verify Apps Script assigns these correctly

### 🔧 **Next Steps**

1. Run actual data test to see if it works in practice
2. Check for name mismatches
3. Verify debit/credit assignment in Apps Script
4. Test with real transaction data

---

## Conclusion

**The balance calculation logic is 100% correct** ✅

If balances are showing incorrectly, the issue is likely:
- Bank name mismatch between upload and transactions
- Incorrect debit/credit values in transactions
- Missing or incorrect `typeOfPayment` field

Would you like me to:
1. Test with actual data to find the issue?
2. Add more detailed logging?
3. Create a balance reconciliation report?
