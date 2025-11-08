# Transfer Feature Quick Reference Card

**Version:** Webapp V1.1 + Apps Script V8.6  
**Status:** ✅ Ready for Staging Tests

---

## Two-Row Transfer Pattern

Every transfer = **2 rows** with same `ref`:

### Row A: Source Account (Money OUT)
```json
{
  "typeOfOperation": "Transfer",
  "property": "",              // ✅ Empty
  "typeOfPayment": "Bank - Kasikorn",
  "detail": "Transfer to SCB", // ✅ Contains "Transfer to"
  "ref": "T-001",              // ✅ Links rows
  "debit": 50000,              // ✅ Money OUT
  "credit": 0
}
```

### Row B: Destination Account (Money IN)
```json
{
  "typeOfOperation": "Transfer",
  "property": "",                // ✅ Empty
  "typeOfPayment": "Bank - SCB",
  "detail": "Transfer from Kasikorn", // ✅ Contains "Transfer from"
  "ref": "T-001",                // ✅ Same ref
  "debit": 0,
  "credit": 50000                // ✅ Money IN
}
```

---

## Validation Rules

| Field | Revenue/Expense | Transfer |
|-------|----------------|----------|
| `property` | ✅ REQUIRED | ⚪ OPTIONAL (can be empty) |
| `ref` | ⚪ OPTIONAL | ✅ REQUIRED (must match both rows) |
| `detail` | Any text | ✅ Must contain "Transfer to" or "Transfer from" |
| `debit/credit` | One must be > 0 | ✅ Exactly ONE must be > 0 (not both) |
| `typeOfOperation` | 33 categories | ✅ "Transfer" |

---

## API Endpoints

### `/api/options`
Returns "Transfer" in typeOfOperation array:
```json
{
  "data": {
    "typeOfOperation": [..., "Transfer"]
  }
}
```

### `/api/sheets` (Webhook)
Accepts transfer payloads:
- ✅ Validates transfer rules
- ✅ Forwards to Apps Script V8.6
- ❌ Rejects if validation fails

### `/api/pnl`
Excludes transfers from totals:
- Revenue: Excludes "Transfer" rows
- Expenses: Excludes "Transfer" rows
- Transfers only affect balances

### `/api/balance`
Updates with transfers:
- Source bank: Balance decreases
- Destination bank: Balance increases
- Overall total: Unchanged (zero drift)

---

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Property is required for revenue and expense entries" | Empty property for non-transfer | Add property value |
| "Ref is required for transfer entries" | Empty ref for transfer | Add ref value (same for both rows) |
| "Transfer entries must have detail containing 'Transfer to' or 'Transfer from'" | Detail doesn't match pattern | Update detail text |
| "Transfer entries must have either debit OR credit, not both" | Both debit and credit > 0 | Set only one to > 0 |
| "Invalid operation type 'Transfer'" | /api/options cache stale | Clear cache, refresh |

---

## Testing

### Quick Test Commands

```bash
# 1. Check if "Transfer" in dropdown
curl https://your-domain.com/api/options | jq '.data.typeOfOperation' | grep "Transfer"

# 2. Submit valid transfer
curl -X POST https://your-domain.com/api/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "day": "15",
    "month": "January",
    "year": "2025",
    "property": "",
    "typeOfOperation": "Transfer",
    "typeOfPayment": "Bank - Kasikorn",
    "detail": "Transfer to SCB",
    "ref": "T-001",
    "debit": "50000",
    "credit": "0"
  }'

# 3. Run full test suite
node STAGING_TRANSFER_TESTS.js
```

---

## Frontend Integration

```typescript
// Conditional validation
const isTransfer = typeOfOperation === 'Transfer';

<Input 
  label="Property"
  required={!isTransfer}  // Optional for transfers
  disabled={isTransfer}   // Hide for transfers
/>

<Input 
  label="Ref"
  required={isTransfer}   // Required for transfers
  placeholder={isTransfer ? "Same for both rows" : "Optional"}
/>
```

---

## Common Issues

### Issue: Transfer shows in P&L
**Fix:** Apps Script V8.6 should exclude it. Verify deployed.

### Issue: "Invalid operation type 'Transfer'"
**Fix:** Clear `/api/options` cache, refresh browser.

### Issue: Balance not updating
**Fix:** Check both rows submitted, same ref, correct debit/credit.

### Issue: "Property is required"
**Fix:** Ensure typeOfOperation = "Transfer" exactly (case-sensitive).

---

## File Locations

- **Validation Logic:** `utils/validatePayload.ts`
- **Options Endpoint:** `app/api/options/route.ts`
- **Test Suite:** `STAGING_TRANSFER_TESTS.js`
- **Full Docs:** `WEBAPP_TRANSFER_IMPLEMENTATION.md`
- **PM Requirements:** `PM_REQUIREMENTS_IMPLEMENTED.md`

---

## Deployment Steps

1. ✅ Verify Apps Script V8.6 deployed
2. 🚀 Deploy webapp: `npm run build && vercel --prod`
3. 🗑️ Clear caches: POST `/api/pnl` with `{"action":"clearCache"}`
4. ✅ Run tests: `node STAGING_TRANSFER_TESTS.js`
5. 📊 Monitor logs for validation errors

---

**Need Help?**
- Read: `WEBAPP_TRANSFER_IMPLEMENTATION.md` (full guide)
- Test: `STAGING_TRANSFER_TESTS.js` (automated tests)
- Check: `PM_REQUIREMENTS_IMPLEMENTED.md` (all 8 requirements)
