# 🏦 Balance Management - Testing & Verification Guide

## Overview

This document provides comprehensive testing procedures for the Balance Management system, which tracks cash and bank account balances with automatic reconciliation against transactions.

## System Architecture

### **Data Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    BALANCE MANAGEMENT FLOW                   │
└─────────────────────────────────────────────────────────────┘

1. UPLOAD BALANCE (Manual or OCR)
   ↓
   User enters balance → /api/balance/save → Google Sheets
   ↓
   Saved to "Bank & Cash Balance" sheet
   ↓
   Columns: [timestamp, bankName, balance, note]

2. FETCH BALANCES
   ↓
   /api/balance/by-property → Google Sheets API
   ↓
   Gets latest balance for each bank
   ↓
   Fetches all transactions from /api/inbox
   ↓
   Calculates: currentBalance = uploadedBalance + revenue - expenses

3. DISPLAY & RECONCILIATION
   ↓
   Balance page shows:
   - Current running balance (auto-calculated)
   - Last uploaded balance
   - Total revenue since upload
   - Total expenses since upload
   - Variance (difference)
   - Transaction count
```

## API Endpoints

### **1. POST /api/balance/save**

**Purpose:** Save a new balance entry to Google Sheets

**Request Body:**
```json
{
  "bankName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
  "balance": 50000,
  "note": "Monthly balance update"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Balance saved successfully",
  "savedData": {
    "bankName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
    "balance": 50000
  }
}
```

**Google Sheets Action:** `balancesAppend`

**Sheet Structure:**
- Sheet Name: `Bank & Cash Balance`
- Columns: `timestamp | bankName | balance | note`

---

### **2. POST /api/balance/ocr**

**Purpose:** Extract balance from bank statement screenshot using OCR

**Request:** Multipart form data with image file

**Response:**
```json
{
  "ok": true,
  "bankBalance": 50000,
  "balances": [
    {
      "bankName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "balance": 50000
    }
  ],
  "rawText": "Bangkok Bank\nAvailable Balance\n50,000.00 THB",
  "sourceLine": "50,000.00",
  "confidence": "high"
}
```

**Features:**
- Uses Google Cloud Vision API for text extraction
- Detects bank name from text (Bangkok Bank, Kasikorn, SCB, etc.)
- Parses balance amounts with comma separators
- Returns both legacy format (`bankBalance`) and new format (`balances` array)

---

### **3. POST /api/balance/by-property**

**Purpose:** Calculate running balances for all banks/cash accounts

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "ok": true,
  "success": true,
  "propertyBalances": [
    {
      "property": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "balance": 48500,
      "uploadedBalance": 50000,
      "uploadedDate": "2025-11-01T10:00:00.000Z",
      "totalRevenue": 5000,
      "totalExpense": 6500,
      "transactionCount": 8,
      "variance": -1500
    }
  ],
  "summary": {
    "totalBalance": 125000,
    "totalRevenue": 15000,
    "totalExpense": 20000,
    "propertyCount": 5,
    "transactionCount": 13
  },
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

**Calculation Logic:**
```
currentBalance = uploadedBalance + totalRevenue - totalExpense
variance = currentBalance - uploadedBalance
```

**Caching:** 30 seconds in-memory cache

---

### **4. POST /api/balance/get**

**Purpose:** Get latest balance entries from Google Sheets (raw data)

**Request Body:**
```json
{
  "action": "balancesGetLatest",
  "secret": "..."
}
```

**Response:**
```json
{
  "ok": true,
  "balances": [
    {
      "bankName": "Cash",
      "balance": 15000,
      "timestamp": "2025-11-01T10:00:00.000Z",
      "note": "Monthly cash count"
    }
  ],
  "reconcile": {
    "totalUploaded": 150000,
    "totalCurrent": 125000,
    "difference": -25000
  }
}
```

**Google Sheets Action:** `balancesGetLatest`

**Caching:** 30 seconds in-memory cache

---

## Testing Procedures

### **Test 1: Manual Balance Entry**

**Steps:**
1. Navigate to http://localhost:3002/balance
2. Click "Update Balances" button
3. Select "Manual Entry" method
4. Enter new balance for each account
5. Add optional note
6. Click "Save Balances"

**Expected Results:**
- ✅ Success message appears
- ✅ Balance page refreshes with new data
- ✅ Google Sheets "Bank & Cash Balance" tab shows new row
- ✅ Timestamp is current
- ✅ All fields are populated correctly

**Verification:**
```bash
# Check Google Sheets directly
# Open: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
# Tab: "Bank & Cash Balance"
# Verify: New row with timestamp, bankName, balance, note
```

---

### **Test 2: OCR Balance Extraction**

**Steps:**
1. Navigate to http://localhost:3002/balance
2. Click "Update Balances" button
3. Select "Upload Screenshot" method
4. Upload bank statement image (JPG/PNG)
5. Wait for OCR processing
6. Verify extracted balances are correct
7. Adjust if needed
8. Click "Save Balances"

**Expected Results:**
- ✅ Image uploads successfully
- ✅ OCR extracts text from image
- ✅ Balance amount is detected and parsed
- ✅ Bank name is detected (if present in image)
- ✅ Balance fields are pre-filled
- ✅ User can edit before saving
- ✅ Save works correctly

**Test Images:**
- Bangkok Bank statement screenshot
- Kasikorn Bank mobile app screenshot
- Cash count photo with amount visible

**Verification:**
```bash
# Test OCR endpoint directly
curl -X POST http://localhost:3002/api/balance/ocr \
  -F "file=@test-bank-statement.jpg"

# Expected response:
# {
#   "ok": true,
#   "balances": [{"bankName": "...", "balance": 50000}],
#   "rawText": "...",
#   "confidence": "high"
# }
```

---

### **Test 3: Running Balance Calculation**

**Steps:**
1. Note current uploaded balance for a bank (e.g., Bangkok Bank = ฿50,000)
2. Add a revenue transaction via mobile app (e.g., +฿5,000)
3. Add an expense transaction via mobile app (e.g., -฿2,000)
4. Refresh balance page
5. Verify running balance calculation

**Expected Results:**
- ✅ Uploaded Balance: ฿50,000
- ✅ Total Revenue: ฿5,000
- ✅ Total Expense: ฿2,000
- ✅ Current Balance: ฿53,000 (50,000 + 5,000 - 2,000)
- ✅ Variance: +฿3,000
- ✅ Transaction Count: 2

**Verification:**
```bash
# Call running balance API
curl -X POST http://localhost:3002/api/balance/by-property \
  -H "Content-Type: application/json" \
  -d '{}'

# Check response for correct calculations
```

---

### **Test 4: Reconciliation Accuracy**

**Steps:**
1. Upload balances for all accounts (e.g., 5 banks)
2. Add multiple transactions across different banks
3. Open "Update Balances" modal
4. Enter new actual balances from bank statements
5. Review reconciliation summary

**Expected Results:**
- ✅ Previous Total shows sum of uploaded balances
- ✅ Revenue shows sum of all credit transactions
- ✅ Expenses shows sum of all debit transactions
- ✅ Expected New Total = Previous + Revenue - Expenses
- ✅ Actual New Total = Sum of entered balances
- ✅ Difference = Actual - Expected
- ✅ If difference < ฿1, shows "100% Money Tracked!"
- ✅ If difference > ฿1, shows percentage and missing/extra amount

**Verification:**
```
Example:
Previous Total: ฿150,000
+ Revenue: ฿25,000
- Expenses: ฿30,000
= Expected: ฿145,000

Actual New Total: ฿145,000
Difference: ฿0
Status: ✓ 100% Money Tracked!
```

---

### **Test 5: Multi-Bank Support**

**Steps:**
1. Upload balances for multiple banks:
   - Cash
   - Bank Transfer - Bangkok Bank - Shaun Ducker
   - Kasikorn Bank
   - SCB Bank
   - Krungsri Bank
2. Add transactions using different payment methods
3. Verify each bank tracks independently

**Expected Results:**
- ✅ Each bank has separate balance tracking
- ✅ Transactions are matched to correct bank via `typeOfPayment` field
- ✅ Running balances calculate correctly per bank
- ✅ Total balance = sum of all banks
- ✅ Cash vs Bank breakdown is accurate

---

### **Test 6: Error Handling**

**Test Cases:**

**6.1 Invalid File Upload**
- Upload non-image file (PDF, TXT)
- Expected: Error message "Invalid file type"

**6.2 File Too Large**
- Upload image > 10MB
- Expected: Error message "File too large"

**6.3 No Text in Image**
- Upload blank image
- Expected: Error message "No text found in image"

**6.4 No Balance Detected**
- Upload image with text but no numbers
- Expected: Error message "Could not detect a balance amount"

**6.5 Missing Required Fields**
- Try to save without entering balance
- Expected: Error message "No balances have been updated"

**6.6 Network Error**
- Disconnect internet
- Try to save balance
- Expected: Error message "Network error"

---

## Integration Testing

### **Test 7: End-to-End Flow**

**Scenario:** Monthly balance reconciliation

**Steps:**
1. **Day 1:** Upload starting balances for all accounts
2. **Days 2-30:** Add various transactions via mobile app
3. **Day 31:** Take screenshots of all bank statements
4. **Day 31:** Upload screenshots via OCR
5. **Day 31:** Review reconciliation
6. **Day 31:** Save new balances

**Expected Results:**
- ✅ All balances save correctly
- ✅ Transactions are tracked accurately
- ✅ OCR extracts balances correctly
- ✅ Reconciliation shows 100% tracking (or identifies discrepancies)
- ✅ New balances become starting point for next month
- ✅ Historical data is preserved in Google Sheets

---

## Performance Testing

### **Test 8: Load Testing**

**Metrics to Monitor:**
- API response time for `/api/balance/by-property`
- Google Sheets API latency
- OCR processing time
- Cache hit rate

**Benchmarks:**
- Balance calculation: < 5 seconds
- OCR processing: < 10 seconds
- Cache hit: < 100ms
- Google Sheets fetch: < 3 seconds

---

## Data Verification

### **Test 9: Google Sheets Integration**

**Verification Steps:**

1. **Check Sheet Structure:**
   - Open Google Sheets
   - Navigate to "Bank & Cash Balance" tab
   - Verify columns: timestamp | bankName | balance | note

2. **Check Data Integrity:**
   - All timestamps are valid ISO 8601 format
   - All bankNames match dropdown options
   - All balances are positive numbers
   - Notes are optional strings

3. **Check Apps Script:**
   - Open Apps Script editor
   - Verify `handleBalancesAppend` function exists
   - Verify `handleBalancesGetLatest` function exists
   - Test functions manually

**Apps Script Test:**
```javascript
// Run in Apps Script editor
function testBalanceAppend() {
  const testPayload = {
    action: 'balancesAppend',
    secret: 'VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=',
    bankName: 'Test Bank',
    balance: 5000,
    note: 'Test entry'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const response = doPost(mockEvent);
  Logger.log(response.getContent());
}
```

---

## Troubleshooting

### **Common Issues**

**Issue 1: "Balance service not configured"**
- **Cause:** Missing environment variables
- **Fix:** Check `.env.local` for `SHEETS_BALANCES_APPEND_URL` and `SHEETS_WEBHOOK_SECRET`

**Issue 2: "Failed to save balance to Google Sheets"**
- **Cause:** Apps Script not deployed or wrong URL
- **Fix:** Redeploy Apps Script and update webhook URL

**Issue 3: "OCR service not configured"**
- **Cause:** Missing `GOOGLE_VISION_KEY`
- **Fix:** Add Google Cloud Vision API key to `.env.local`

**Issue 4: Running balance not updating**
- **Cause:** Cache not clearing or transactions not syncing
- **Fix:** Wait 30 seconds for cache to expire or restart server

**Issue 5: Reconciliation shows large difference**
- **Cause:** Missing transactions or incorrect balance entry
- **Fix:** Review transaction history and verify uploaded balances

---

## Success Criteria

### **✅ All Tests Pass When:**

1. **Manual Entry Works:**
   - Can enter balances for all accounts
   - Saves to Google Sheets correctly
   - Updates display immediately

2. **OCR Works:**
   - Extracts text from images
   - Detects bank names
   - Parses balance amounts
   - Handles errors gracefully

3. **Running Balance Works:**
   - Calculates correctly
   - Matches manual calculations
   - Updates with new transactions
   - Shows variance accurately

4. **Reconciliation Works:**
   - Shows all components (previous, revenue, expenses, expected, actual)
   - Calculates difference correctly
   - Shows 100% when balanced
   - Shows percentage when unbalanced

5. **Multi-Bank Works:**
   - Tracks each bank independently
   - Matches transactions correctly
   - Calculates totals correctly
   - Displays breakdown accurately

6. **Error Handling Works:**
   - Shows clear error messages
   - Doesn't crash on invalid input
   - Recovers gracefully
   - Logs errors for debugging

---

## Maintenance

### **Regular Checks:**

- **Weekly:** Verify balance calculations match bank statements
- **Monthly:** Review reconciliation accuracy
- **Quarterly:** Check Google Sheets data integrity
- **Yearly:** Audit historical balance data

### **Monitoring:**

- API response times
- Error rates
- Cache hit rates
- Google Sheets quota usage
- OCR API usage

---

**Last Updated:** November 1, 2025  
**Version:** 1.0  
**Status:** ✅ All systems operational

