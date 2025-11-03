# 📱 Mobile App - Balance API Quick Reference Card

**Production URL**: `https://accounting-buddy-74d39irgs-tool2us-projects.vercel.app`

---

## 🎯 Balance Endpoint

```
POST /api/balance/by-property
```

### Request:
```javascript
fetch('https://accounting-buddy-74d39irgs-tool2us-projects.vercel.app/api/balance/by-property', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
```

### Response:
```javascript
{
  propertyBalances: [
    {
      property: "Bank Transfer - Bangkok Bank - Shaun Ducker",
      balance: 100,              // ← USE THIS
      uploadedBalance: 200,
      totalRevenue: 0,
      totalExpense: 100,
      transactionCount: 1
    }
  ],
  summary: {
    totalBalance: 100
  }
}
```

---

## 💡 Key Points

1. **Use** `balance` field (not `uploadedBalance`)
2. **Auto-updates** as transactions are added
3. **Formula**: `balance = uploadedBalance + revenue - expenses`
4. **Cache**: 30 seconds
5. **CORS**: Enabled ✅

---

## 🐛 If Balances Are Wrong

**Check**:
- Using `balance` field? (not `uploadedBalance`)
- Calling correct endpoint? (`/api/balance/by-property`)
- Response format correct? (`data.propertyBalances[i].balance`)

---

## 📞 Support

See: `MOBILE_TEAM_BALANCE_API_UPDATE.md` for full details

**Questions?** Contact Shaun Ducker
