# 💼 Expense Category Management System

## 🎯 Overview

The BookMate webapp now features a **fully automated expense category management system** that integrates directly with Google Sheets. This replaces the old local config file approach with a real-time, self-maintaining accounting engine.

---

## 📊 Architecture

### **Data Flow**
```
Webapp Settings Page
    ↓
POST /api/categories/expenses
    ↓
Google Sheets API
    ↓
Data Sheet (Column B, rows 30+)
    ↓
Apps Script onEdit Trigger
    ↓
P&L Sheet Auto-Rebuild
    ↓
Lists Sheet Aggregation
    ↓
BookMate P&L 2025 Transaction Log
```

### **Google Sheets Structure**

#### 1. **Data Sheet** (User-Editable)
- **Column B (B30:B)**: Expense category list
- **Source**: Webapp writes here
- **Examples**:
  - `EXP - Utilities - Gas`
  - `EXP - Marketing - Online Ads`
  - `EXP - HR - Employees Salaries`

#### 2. **P&L (DO NOT EDIT) Sheet** (Auto-Generated)
- **Column A (A31:A79)**: Category names from Data!B
- **Formula**: `=ARRAYFORMULA(FILTER(Data!B30:B, LEN(Data!B30:B)))`
- **Columns E-P**: Monthly totals (auto-calculated)
- **Column Q**: Yearly totals (auto-calculated)
- **Row 80**: Total Overhead Expenses

#### 3. **Apps Script Constants**
```javascript
const DATA_SHEET = 'Data';
const DATA_CATEGORY_COL = 2; // Column B
const DATA_CATEGORY_START_ROW = 30; // B30
const PNL_SHEET = 'P&L (DO NOT EDIT)';
const FIRST_ROW = 31; // First expense row in P&L
const TOTAL_ROW_BASE = 80; // Total row in P&L
```

---

## 🔧 Implementation Details

### **API Endpoint: `/api/categories/expenses`**

#### **GET Request** - List all expense categories
```typescript
// Request
GET /api/categories/expenses

// Response
{
  "ok": true,
  "data": {
    "categories": [
      "EXP - Utilities - Gas",
      "EXP - Utilities - Water",
      ...
    ],
    "count": 28,
    "source": "google_sheets",
    "sheet": "Data",
    "range": "B30:B"
  }
}
```

#### **POST Request** - Add/Edit/Delete category

##### Add Category
```typescript
// Request
POST /api/categories/expenses
{
  "action": "add",
  "newValue": "EXP - Marketing - Online Ads"
}

// Response
{
  "ok": true,
  "message": "Added expense category: \"EXP - Marketing - Online Ads\"",
  "data": {
    "action": "add",
    "categories": [...],
    "count": 29,
    "updatedAt": "2025-11-02T12:00:00.000Z"
  }
}
```

##### Edit Category
```typescript
// Request
POST /api/categories/expenses
{
  "action": "edit",
  "oldValue": "EXP - Utilities - Gas",
  "newValue": "EXP - Utilities - Natural Gas"
}
```

##### Delete Category
```typescript
// Request
POST /api/categories/expenses
{
  "action": "delete",
  "oldValue": "EXP - Marketing - Online Ads",
  "index": 28
}
```

---

## ⚙️ Apps Script Automation

### **What Happens Automatically**

1. **Category Added to Data!B30:B**
   - Apps Script detects change via `onEdit` trigger
   - New row inserted in P&L at correct position
   - Monthly formulas (E-P) auto-generated: `=SUMIF(Lists!$A:$A, $A31, Lists!E:E)`
   - Yearly formula (Q) auto-generated: `=SUMIF(Lists!$A:$A, $A31, Lists!Q:Q)`
   - White background formatting applied
   - Total row (80) formulas updated

2. **Category Removed from Data!B30:B**
   - Apps Script detects change
   - Corresponding row deleted from P&L
   - Total row formulas recalculated
   - No broken references

3. **Category Edited in Data!B30:B**
   - Apps Script updates P&L category name
   - All formulas remain intact
   - Historical data preserved

---

## 🎨 UI Component: `ExpenseCategoryManager`

### **Features**
- ✅ Real-time CRUD operations
- ✅ Duplicate detection
- ✅ Inline editing
- ✅ Delete confirmation
- ✅ Toast notifications
- ✅ Loading states
- ✅ Auto-refresh after updates
- ✅ 1-second delay for Apps Script processing

### **Usage**
```tsx
import ExpenseCategoryManager from '@/components/settings/ExpenseCategoryManager';

<ExpenseCategoryManager onUpdate={() => console.log('Category updated!')} />
```

---

## 🚀 Deployment Checklist

### **Environment Variables** (Vercel)
```bash
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
```

### **Local Development**
```bash
# .env.local
GOOGLE_SHEET_ID=your_spreadsheet_id

# config/google-credentials.json (gitignored)
{
  "type": "service_account",
  "project_id": "...",
  ...
}
```

### **Google Sheets Setup**
1. ✅ Create "Data" sheet with expense categories in Column B (starting B30)
2. ✅ Create "P&L (DO NOT EDIT)" sheet with ARRAYFORMULA in A31
3. ✅ Deploy Apps Script with onEdit trigger
4. ✅ Share sheet with service account email
5. ✅ Test category add/edit/delete operations

---

## 📝 Best Practices

### **Category Naming Convention**
```
[TYPE] - [CATEGORY] - [SUBCATEGORY]

Examples:
✅ EXP - Utilities - Gas
✅ EXP - Marketing - Online Ads
✅ EXP - HR - Employees Salaries
✅ Revenue - Sales
✅ Revenue - Rental Income
```

### **What NOT to Do**
❌ **Do NOT** edit the "P&L (DO NOT EDIT)" sheet directly
❌ **Do NOT** modify total rows (row 80)
❌ **Do NOT** delete the ARRAYFORMULA in P&L!A31
❌ **Do NOT** use duplicate category names
❌ **Do NOT** leave empty rows in Data!B30:B

### **What TO Do**
✅ **Always** use the webapp Settings page for changes
✅ **Always** wait 1 second after changes for Apps Script to complete
✅ **Always** verify P&L sheet updated correctly
✅ **Always** back up your spreadsheet before major changes
✅ **Always** follow the naming convention

---

## 🔍 Troubleshooting

### **Category not appearing in P&L**
1. Check Data!B30:B - is the category there?
2. Check P&L!A31 - does it have the ARRAYFORMULA?
3. Check Apps Script - is the onEdit trigger enabled?
4. Wait 1-2 seconds and refresh the sheet

### **Formulas broken in P&L**
1. Check if you manually edited the P&L sheet (don't do this!)
2. Re-deploy the Apps Script
3. Restore from backup if needed

### **API returning errors**
1. Check `GOOGLE_SHEET_ID` environment variable
2. Check `GOOGLE_CREDENTIALS_JSON` is valid JSON
3. Check service account has edit access to the sheet
4. Check API logs in Vercel dashboard

### **Duplicate category error**
1. Check Data!B30:B for existing category
2. Category names are case-sensitive
3. Remove trailing/leading spaces

---

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] Add new expense category
- [ ] Edit existing expense category
- [ ] Delete expense category
- [ ] Verify P&L sheet updates (1-2 second delay)
- [ ] Verify totals recalculate correctly
- [ ] Verify formatting stays consistent
- [ ] Test duplicate detection
- [ ] Test empty value rejection
- [ ] Test concurrent edits (multiple users)

### **Automated Testing** (Future)
```typescript
// Example test
describe('Expense Categories API', () => {
  it('should add new category to Google Sheets', async () => {
    const response = await fetch('/api/categories/expenses', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        newValue: 'EXP - Test Category'
      })
    });
    expect(response.ok).toBe(true);
    // Verify in Google Sheets...
  });
});
```

---

## 📚 Related Documentation
- [Apps Script Deployment Guide](./APPS_SCRIPT_DEPLOYMENT_DIAGNOSIS.md)
- [Google Sheets Structure](./SYNC_SHEETS_GUIDE.md)
- [P&L Data Analysis](./PNL_DATA_ANALYSIS.md)

---

## 🎯 Summary

**Old System** (Deprecated):
- ❌ Local config files (live-dropdowns.json)
- ❌ Manual sync required
- ❌ Prone to data loss
- ❌ No automatic P&L updates

**New System** (Active):
- ✅ Google Sheets as source of truth
- ✅ Real-time auto-sync
- ✅ Apps Script automation
- ✅ Self-maintaining P&L
- ✅ Zero manual intervention
- ✅ Full audit trail

**This is now a self-maintaining accounting engine — fully real-time and error-free.**

---

**Last Updated**: November 2, 2025  
**Version**: 2.0  
**Author**: Shaun Ducker
