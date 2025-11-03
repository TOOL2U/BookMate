# 🚨 URGENT: Mobile App Balance API Update Required

**To**: Mobile App Development Team  
**From**: Shaun Ducker (Web App Team)  
**Date**: November 3, 2025  
**Priority**: HIGH  
**Issue**: Mobile app showing incorrect balances

---

## 🔴 Problem

The mobile app is currently displaying **incorrect bank balances** because it's not using the correct API endpoint from Vercel.

---

## ✅ Solution: Update to Correct Balance API

### **NEW Endpoint (Use This):**

```
POST https://accounting-buddy-74d39irgs-tool2us-projects.vercel.app/api/balance/by-property
```

**Method**: `POST` or `GET` (both work)  
**Headers**: 
```json
{
  "Content-Type": "application/json"
}
```

**Request Body** (for POST):
```json
{}
```
*(Empty object is fine - no parameters needed)*

---

## 📊 Response Format

The API returns **calculated balances** (not just uploaded balances):

```json
{
  "ok": true,
  "success": true,
  "propertyBalances": [
    {
      "property": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "balance": 100,                    // ← USE THIS (current calculated balance)
      "uploadedBalance": 200,             // Initial balance from last upload
      "uploadedDate": "2025-11-01T10:00:00Z",
      "totalRevenue": 0,                  // Total money IN since upload
      "totalExpense": 100,                // Total money OUT since upload
      "transactionCount": 1,              // Number of transactions
      "variance": -100                    // Change since upload (balance - uploadedBalance)
    },
    {
      "property": "Cash",
      "balance": 450,
      "uploadedBalance": 500,
      "uploadedDate": "2025-11-01T10:00:00Z",
      "totalRevenue": 0,
      "totalExpense": 50,
      "transactionCount": 1,
      "variance": -50
    }
  ],
  "summary": {
    "totalBalance": 550,                  // Sum of all bank balances
    "totalRevenue": 0,
    "totalExpense": 150,
    "propertyCount": 2,
    "transactionCount": 2
  },
  "timestamp": "2025-11-03T07:44:00Z"
}
```

---

## 🎯 What to Display in Mobile App

### For Each Bank Account:

**Display**: `propertyBalances[i].balance` ← **This is the CURRENT calculated balance**

**Example**:
```
Bangkok Bank - Shaun Ducker
Balance: ฿100
```

**NOT** `uploadedBalance` (that's the old starting balance)

---

## 🔧 How This Works (Backend Logic)

The API automatically calculates running balances:

```
Current Balance = Uploaded Balance + Total Revenue - Total Expenses
```

**Example**:
```
User uploads: ฿200 (starting balance)
User spends: ฿100 (expense transaction)

Calculated balance = ฿200 + ฿0 - ฿100 = ฿100 ✅
```

**This means balances update automatically as transactions are added!**

---

## 📱 Mobile App Code Example

### Before (Wrong ❌):
```javascript
// DON'T DO THIS
const balance = response.uploadedBalance; // ❌ Old balance, doesn't update
```

### After (Correct ✅):
```javascript
// DO THIS
const balance = response.propertyBalances[0].balance; // ✅ Current calculated balance
```

---

## 🔍 Full Implementation Example

```javascript
// Fetch balances from Vercel
async function fetchBalances() {
  try {
    const response = await fetch(
      'https://accounting-buddy-74d39irgs-tool2us-projects.vercel.app/api/balance/by-property',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body is fine
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Balance API error:', data.error);
      return;
    }

    // Loop through each bank account
    data.propertyBalances.forEach((bank) => {
      console.log(`${bank.property}: ฿${bank.balance.toLocaleString()}`);
      
      // Display in your UI:
      // - bank.property = Bank name
      // - bank.balance = Current balance (use this!)
      // - bank.totalExpense = Total spent
      // - bank.totalRevenue = Total earned
      // - bank.transactionCount = Number of transactions
    });

    // Show total across all accounts
    console.log(`Total Balance: ฿${data.summary.totalBalance.toLocaleString()}`);

  } catch (error) {
    console.error('Failed to fetch balances:', error);
  }
}
```

---

## 🏦 Available Bank Accounts

The API returns balances for these accounts:
1. `Bank Transfer - Bangkok Bank - Shaun Ducker`
2. `Bank Transfer - Bangkok Bank - Maria Ren`
3. `Bank transfer - Krung Thai Bank - Family Account`
4. `Cash`

**Match these EXACTLY** when filtering or displaying.

---

## ⚡ Performance & Caching

- **Cache**: 30 seconds server-side
- **Response Time**: ~200-500ms
- **Max Duration**: 30 seconds (plenty of time)
- **CORS Enabled**: ✅ Mobile app can call directly

---

## 🧪 Testing the Endpoint

### Test with cURL:
```bash
curl -X POST \
  https://accounting-buddy-74d39irgs-tool2us-projects.vercel.app/api/balance/by-property \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected Response:
```json
{
  "ok": true,
  "propertyBalances": [
    {
      "property": "Bank Transfer - Bangkok Bank - Shaun Ducker",
      "balance": 100,
      "uploadedBalance": 200,
      ...
    }
  ]
}
```

---

## ❌ Common Mistakes to Avoid

### 1. Using Wrong Field ❌
```javascript
// WRONG - This doesn't update with transactions
const balance = bank.uploadedBalance; 
```

### 2. Using Old Endpoint ❌
```javascript
// WRONG - Old endpoint, may not exist
fetch('/api/balance/get')
```

### 3. Not Handling Response Format ❌
```javascript
// WRONG - Need to access propertyBalances array
const balance = response.balance; // undefined!
```

---

## ✅ Correct Implementation Checklist

- [ ] Update API endpoint URL to `/api/balance/by-property`
- [ ] Use `POST` or `GET` method
- [ ] Access `data.propertyBalances` array
- [ ] Display `bank.balance` (not `uploadedBalance`)
- [ ] Handle `data.ok` for error checking
- [ ] Test with real data
- [ ] Verify balances update after creating transactions

---

## 🔗 Related Endpoints (For Reference)

### Balance Upload (when user submits new balance):
```
POST /api/balance/save
Body: {
  "bankName": "Bank Transfer - Bangkok Bank - Shaun Ducker",
  "balance": 200,
  "note": "Monthly statement"
}
```

### Get All Transactions (if needed):
```
POST /api/inbox
```

---

## 📞 Contact & Support

**Questions?** Contact:
- Shaun Ducker (Web App Team Lead)
- Email: [your-email]
- Slack: @shaun

**API Documentation**: 
- See `BALANCE_AUDIT_COMPLETE.md` in web app repo
- Full technical details in `BALANCE_100_PERCENT_VERIFICATION.md`

---

## 🎯 Summary (TL;DR)

1. **Use**: `POST /api/balance/by-property`
2. **Get**: `response.propertyBalances[i].balance`
3. **Display**: Current calculated balance (auto-updates with transactions)
4. **Test**: curl command above to verify

**This endpoint is LIVE and ready to use!** ✅

---

**Please confirm receipt and estimated time to implement.**

Thank you! 🙏
