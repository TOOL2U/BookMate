# ✅ OFFICIAL DECISION: Use `/api/options` as Standard Endpoint

**Decision Date**: November 4, 2025  
**Decision By**: Product Owner + Technical Lead  
**Status**: APPROVED ✅

---

## 📋 The Decision

**Standard Endpoint**: `/api/options`

**Rationale**:
- ✅ Pulls live data from Google Sheets "Lists" blocks — the same blocks used by P&L formulas
- ✅ Returns monthly and yearly values for each payment type (needed for charts, analytics, and totals)
- ✅ Combines revenues and expenses under one key (`typeOfOperations`), simplifying dropdowns and lookups
- ✅ Includes metadata such as source, cached status, and updated timestamp
- ✅ Matches intended backend design: fetches from 17 ranges across Lists!H:I:J, Lists!M:N:O, Lists!R:S:T, and Lists!W:X:Y

---

## 🎯 Action Items

### For Web Team
- [x] `/api/options` is already live and working
- [x] Balance page already uses `/api/options`
- [x] Settings page already uses `/api/options`
- [ ] Update any remaining pages using `/api/categories/all` to use `/api/options`
- [ ] Deprecate `/api/categories/all` endpoint (or keep for backward compatibility)
- [ ] Update all internal documentation

### For Mobile Team
**Required Changes**:

1. **Update Endpoint URL**
   ```typescript
   // OLD
   const response = await fetch('/api/categories/all');
   
   // NEW
   const response = await fetch('/api/options');
   ```

2. **Update Field Names** (add 's' for plural)
   ```typescript
   // OLD
   const payments = data.data.typeOfPayment;
   const operations = data.data.typeOfOperation;
   
   // NEW
   const payments = data.data.typeOfPayments;
   const operations = data.data.typeOfOperations;
   ```

3. **Extract Payment Names from Objects**
   ```typescript
   // OLD - simple string array
   const bankNames = data.data.typeOfPayment;
   // ["Cash", "Bank Transfer - Bangkok Bank"]
   
   // NEW - extract from objects
   const bankNames = data.data.typeOfPayments.map(payment => payment.name);
   // Extract from: [{ name: "Cash", monthly: [...], yearTotal: 0 }]
   ```

4. **Handle Combined Operations** (if needed separated)
   ```typescript
   // The new endpoint combines revenues + expenses
   const allOperations = data.data.typeOfOperations;
   // ["Revenue - Sales", "Revenue - Commission", "EXP - Utilities - Gas", ...]
   
   // If you need them separated, filter by prefix:
   const revenues = allOperations.filter(op => op.startsWith('Revenue'));
   const expenses = allOperations.filter(op => op.startsWith('EXP'));
   ```

5. **Optional: Use Monthly Payment Data for Analytics**
   ```typescript
   // NEW capability - payment tracking over time
   const cashPayment = data.data.typeOfPayments.find(p => p.name === "Cash - Family");
   
   console.log(cashPayment.monthly);     // [12000, 9500, 10000, ...] - 12 months
   console.log(cashPayment.yearTotal);   // 135000 - sum of all months
   
   // Use for charts, analytics, trend graphs
   ```

---

## 📊 Response Format Reference

### `/api/options` Official Response Structure

```json
{
  "ok": true,
  "source": "google_sheets_lists",
  "cached": false,
  "updatedAt": "2025-11-04T10:30:00.000Z",
  "data": {
    "properties": [
      "Sia Moon - Land - General",
      "Alesia House",
      "Lanna House",
      "Parents House",
      "Shaun Ducker - Personal",
      "Maria Ren - Personal",
      "Family"
    ],
    "typeOfOperations": [
      "Revenue - Commision",
      "Revenue - Sales",
      "Revenue - Services",
      "Revenue - Rental Income",
      "EXP - Utilities - Gas",
      "EXP - Utilities - Water",
      "EXP - Utilities  - Electricity",
      "EXP - Administration & General - License & Certificates",
      "EXP - Construction - Structure",
      "EXP - Construction - Overheads/General/Unclassified",
      "EXP - HR - Employees Salaries",
      "EXP - Construction - Electric Supplies",
      "EXP - Construction - Wall",
      "EXP - Administration & General - Legal",
      "EXP - Administration & General - Professional fees",
      "EXP - Administration & General - Office supplies",
      "EXP - Administration & General  - Subscription, Software & Membership",
      "EXP - Windows, Doors, Locks & Hardware",
      "EXP - Repairs & Maintenance  - Furniture & Decorative Items",
      "EXP - Repairs & Maintenance  - Waste removal",
      "EXP - Repairs & Maintenance - Tools & Equipment",
      "EXP - Repairs & Maintenance - Painting & Decoration",
      "EXP - Repairs & Maintenance - Electrical & Mechanical",
      "EXP - Repairs & Maintenance - Landscaping",
      "EXP - Sales & Marketing -  Professional Marketing Services",
      "EXP - Appliances & Electronics",
      "EXP - Other Expenses",
      "EXP - Personal - Massage",
      "EXP - Household - Alcohol",
      "EXP - Household - Groceries",
      "EXP - Household - Nappies",
      "EXP - Household - Toiletries"
    ],
    "typeOfPayments": [
      {
        "name": "Bank Transfer - Bangkok Bank - Shaun Ducker",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank Transfer - Bangkok Bank - Maria Ren",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Bank transfer - Krung Thai Bank - Family Account",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash - Family",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      },
      {
        "name": "Cash - Alesia",
        "monthly": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "yearTotal": 0
      }
    ]
  }
}
```

### Data Counts
- **Properties**: 7 items
- **Type of Operations**: 32 items (4 revenues + 28 expenses combined)
- **Type of Payments**: 5 items (each with monthly tracking data)

---

## 📚 Updated Documentation

### For Mobile Team
- Read: `MOBILE_TEAM_DATA_GUIDE.md` - Your primary reference
- Reference: `DATA_SOURCE_CHEATSHEET.md` - Quick lookup
- Deep dive: `DATA_SOURCE_REFERENCE.md` - Complete 400+ line guide

### For Web Team
- All pages should use `/api/options`
- Existing implementations in Balance and Settings pages are correct
- No changes needed for web team

---

## 🗓️ Migration Timeline

### Immediate (Today)
- ✅ Decision documented
- ✅ Mobile team notified
- [ ] Mobile team updates code

### Within 48 Hours
- [ ] Mobile team completes migration
- [ ] Mobile team tests with `/api/options`
- [ ] Confirm all dropdowns working

### Within 1 Week
- [ ] Web team reviews all pages
- [ ] Deprecate `/api/categories/all` endpoint (optional)
- [ ] Update all documentation to reference `/api/options` only

---

## ❓ FAQ

### Q: Can we still use `/api/categories/all`?
**A**: It will remain functional for backward compatibility, but **all new development should use `/api/options`**. We may deprecate `/api/categories/all` in the future.

### Q: Do we need month names?
**A**: `/api/options` doesn't include month names currently. If needed, we can add a `months` field. For now, use hardcoded `["Jan", "Feb", "Mar", ...]` or fetch from P&L!4:4 separately.

### Q: What if we need separated revenues and expenses?
**A**: Filter `typeOfOperations`:
```typescript
const revenues = data.data.typeOfOperations.filter(op => op.startsWith('Revenue'));
const expenses = data.data.typeOfOperations.filter(op => op.startsWith('EXP'));
```

Or we can enhance `/api/options` to include both `typeOfOperations` (combined) AND `revenues`/`expenses` (separated) for flexibility.

### Q: How do we get simple payment names without monthly data?
**A**: Extract from objects:
```typescript
const paymentNames = data.data.typeOfPayments.map(p => p.name);
```

### Q: What Google Sheets ranges does `/api/options` fetch?
**A**: 17 ranges in a single batch request:
- Data!A2:A, Data!B2:B, Data!C2:C, Data!D2:D (category names)
- Lists!H:I:J (Overhead monthly data)
- Lists!M:N:O (Property monthly data)
- Lists!R:S:T (Payment monthly data)
- Lists!W:X:Y (Revenue monthly data)
- 'P&L (DO NOT EDIT)'!4:4 (Month headers)

See `DATA_SOURCE_REFERENCE.md` for complete details.

---

## 🎉 Benefits of This Decision

### For Product
- ✅ Single source of truth for all teams
- ✅ Consistent data across web and mobile apps
- ✅ Future-proof for analytics and reporting
- ✅ Reduces maintenance burden (one endpoint to manage)

### For Development
- ✅ Web team already implemented correctly
- ✅ Mobile team migration is straightforward
- ✅ Comprehensive documentation available
- ✅ Data fetched from same source as P&L formulas

### For Users
- ✅ Real-time data from Google Sheets
- ✅ Consistent dropdowns across all platforms
- ✅ Monthly payment tracking enables better insights
- ✅ No data sync issues between web and mobile

---

## 📞 Support

**Questions about migration?**
- Web Team: Review `DATA_SOURCE_REFERENCE.md`
- Mobile Team: Review `MOBILE_TEAM_DATA_GUIDE.md`
- Technical issues: Check `endpoint-comparison-results/` folder

**Need help?**
- Contact technical lead or product owner
- Reference this decision document
- Test with comparison script: `./compare-endpoints.sh`

---

**Status**: ✅ APPROVED AND ACTIVE  
**Last Updated**: November 4, 2025  
**Next Review**: After mobile team completes migration
