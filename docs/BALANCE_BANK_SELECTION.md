# 🏦 Balance Bank Selection Feature

**Date:** November 1, 2025  
**Status:** ✅ **COMPLETE**

---

## Overview

Added bank selection functionality to the balance update modal, allowing users to select which specific banks they want to update for both manual entry and OCR upload methods.

---

## Problem Solved

**User Request:**
> "i am still unable to select a bank or cash in the manual entry or upload screen shot. i should be able to select which bank i want to update or upload screenshot to"

**Previous Behavior:**
- ❌ All banks were shown but couldn't be individually selected
- ❌ OCR upload didn't specify which bank the screenshot was for
- ❌ Manual entry updated all banks at once
- ❌ No way to update just one or two specific banks

**New Behavior:**
- ✅ Checkboxes for each bank in manual entry mode
- ✅ Dropdown selector for bank in OCR upload mode
- ✅ Select All / Deselect All buttons
- ✅ Visual feedback showing selected banks
- ✅ Save button shows count of selected banks
- ✅ Only selected banks are saved to Google Sheets

---

## Features Implemented

### **1. Manual Entry Mode** 📝

#### **Bank Selection Checkboxes**
- Each bank row now has a checkbox in the first column
- Click checkbox to select/deselect individual banks
- Selected banks have blue border and background highlight
- Visual distinction between selected and unselected banks

#### **Select All / Deselect All Buttons**
- Quick action buttons in the header
- "Select All" - selects all available banks
- "Deselect All" - clears all selections
- Shows count: "X of Y selected"

#### **Visual Feedback**
- Selected banks: Blue border (2px), blue background, shadow glow
- Unselected banks: Gray border, gray background
- Hover effect on all banks

#### **Updated Table Layout**
```
| Select | Account Name | Previous | New Balance | Note |
|   ☑️   |   🏦 Bank   |  ฿1,000  |   [input]   | [...] |
```

**Column Distribution:**
- Select: 1/12 (8%)
- Account Name: 4/12 (33%)
- Previous Balance: 2/12 (17%)
- New Balance: 4/12 (33%)
- Note: 1/12 (8%)

---

### **2. OCR Upload Mode** 📸

#### **Bank Dropdown Selector**
- Dropdown appears above the upload area
- Shows all available banks with icons (💵 for cash, 🏦 for banks)
- User must select a bank before uploading
- Upload button is disabled until bank is selected
- Shows confirmation message when bank is selected

#### **Upload Flow**
1. User selects bank from dropdown
2. Confirmation message appears: "✓ Selected: [Bank Name]"
3. Upload button becomes enabled
4. User uploads screenshot
5. OCR extracts balance
6. Balance is assigned to the selected bank
7. Success message shows: "✓ Balance extracted: ฿X for [Bank Name]"

#### **Validation**
- Cannot upload without selecting a bank
- Warning message: "⚠️ Please select a bank account first"
- Upload button is visually disabled (opacity 50%)

---

### **3. Save Functionality** 💾

#### **Updated Save Logic**
```typescript
// Only save banks that are:
// 1. Selected by the user
// 2. Have a new balance value entered
// 3. Balance is different from previous balance

const updatedBalances = newBalances.filter(nb => {
  const isSelected = selectedBanks.includes(nb.bankName);
  const oldBalance = balances.find(b => b.bankName === nb.bankName)?.uploadedBalance || 0;
  const hasNewValue = nb.balance > 0 && nb.balance !== oldBalance;
  return isSelected && hasNewValue;
});
```

#### **Save Button States**
- **Disabled:** No banks selected
  - Text: "Select Banks to Save"
  - Opacity: 50%
  - Cursor: not-allowed

- **Enabled:** Banks selected with new values
  - Text: "Save X Selected Bank(s)"
  - Gradient background
  - Shadow glow effect

- **Loading:** Saving in progress
  - Text: "Saving..."
  - Spinning icon
  - Disabled state

#### **Validation Messages**
- No banks selected: "Please select at least one bank and enter a new balance value."
- No new values: Same message as above
- Success: Standard success message

---

## Code Changes

### **New State Variables**

```typescript
const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
```

Tracks which banks are currently selected for update.

---

### **New Functions**

#### **1. toggleBankSelection**
```typescript
const toggleBankSelection = (bankName: string) => {
  setSelectedBanks(prev => {
    if (prev.includes(bankName)) {
      return prev.filter(b => b !== bankName);
    } else {
      return [...prev, bankName];
    }
  });
};
```

Toggles individual bank selection on/off.

#### **2. selectAllBanks**
```typescript
const selectAllBanks = () => {
  setSelectedBanks(newBalances.map(b => b.bankName));
};
```

Selects all available banks at once.

#### **3. deselectAllBanks**
```typescript
const deselectAllBanks = () => {
  setSelectedBanks([]);
};
```

Clears all bank selections.

---

### **Updated Functions**

#### **1. handleFileUpload**
**Changes:**
- Added bank selection validation
- Uses selected bank from dropdown
- Updates only the selected bank's balance
- Shows success message with bank name

**Before:**
```typescript
// Tried to match OCR result to all banks
const updatedBalances = newBalances.map(nb => {
  const ocrBalance = data.balances.find((b: any) => 
    b.bankName.toLowerCase().includes(nb.bankName.toLowerCase())
  );
  return ocrBalance ? { ...nb, balance: ocrBalance.balance } : nb;
});
```

**After:**
```typescript
// Check if bank is selected
if (selectedBanks.length === 0) {
  alert('Please select a bank account first');
  return;
}

// Update only the selected bank
const selectedBankName = selectedBanks[0];
const updatedBalances = newBalances.map(nb => {
  if (nb.bankName === selectedBankName) {
    return { ...nb, balance: data.bankBalance };
  }
  return nb;
});
```

#### **2. handleSaveBalances**
**Changes:**
- Filters by selected banks
- Validates selection before saving
- Updated error message

**Before:**
```typescript
const updatedBalances = newBalances.filter(nb => {
  const oldBalance = balances.find(b => b.bankName === nb.bankName)?.uploadedBalance || 0;
  return nb.balance > 0 && nb.balance !== oldBalance;
});
```

**After:**
```typescript
const updatedBalances = newBalances.filter(nb => {
  const isSelected = selectedBanks.includes(nb.bankName);
  const oldBalance = balances.find(b => b.bankName === nb.bankName)?.uploadedBalance || 0;
  const hasNewValue = nb.balance > 0 && nb.balance !== oldBalance;
  return isSelected && hasNewValue;
});
```

---

## UI Components

### **Manual Entry Header**

```tsx
<div className="flex items-center justify-between mb-2">
  <h3 className="text-white font-semibold flex items-center gap-2">
    <Wallet className="w-5 h-5 text-blue-400" />
    Select Accounts to Update
  </h3>
  <div className="flex items-center gap-2">
    <button onClick={selectAllBanks} className="text-xs text-blue-400 hover:text-blue-300">
      Select All
    </button>
    <span className="text-slate-600">|</span>
    <button onClick={deselectAllBanks} className="text-xs text-slate-400 hover:text-slate-300">
      Deselect All
    </button>
    <span className="text-slate-600 mx-2">•</span>
    <p className="text-xs text-slate-400">
      {selectedBanks.length} of {newBalances.length} selected
    </p>
  </div>
</div>
```

### **Checkbox Column**

```tsx
<div className="col-span-1 flex items-center justify-center">
  <input
    type="checkbox"
    checked={isSelected}
    onChange={() => toggleBankSelection(entry.bankName)}
    className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-900 checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all"
  />
</div>
```

### **OCR Bank Selector**

```tsx
<div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
  <label className="block text-sm font-semibold text-white mb-3">
    Select Bank Account for this Statement
  </label>
  <select
    value={selectedBanks[0] || ''}
    onChange={(e) => setSelectedBanks(e.target.value ? [e.target.value] : [])}
    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
  >
    <option value="">-- Select a bank account --</option>
    {newBalances.map((entry, index) => {
      const isCash = entry.bankName.toLowerCase().includes('cash');
      return (
        <option key={index} value={entry.bankName}>
          {isCash ? '💵' : '🏦'} {entry.bankName}
        </option>
      );
    })}
  </select>
  {selectedBanks.length > 0 && (
    <p className="text-xs text-blue-400 mt-2">
      ✓ Selected: {selectedBanks[0]}
    </p>
  )}
</div>
```

---

## User Experience Flow

### **Manual Entry Flow**

1. User clicks "Update Balances" button
2. Modal opens with "Manual Entry" selected by default
3. User sees all banks with checkboxes (none selected)
4. User can:
   - Click individual checkboxes to select specific banks
   - Click "Select All" to select all banks
   - Click "Deselect All" to clear selections
5. Selected banks highlight with blue border
6. User enters new balance values for selected banks
7. Save button shows: "Save X Selected Bank(s)"
8. User clicks Save
9. Only selected banks with new values are saved to Google Sheets

### **OCR Upload Flow**

1. User clicks "Update Balances" button
2. Modal opens, user selects "Upload Screenshot" method
3. Dropdown appears: "Select Bank Account for this Statement"
4. User selects a bank from dropdown
5. Confirmation message: "✓ Selected: [Bank Name]"
6. Upload button becomes enabled
7. User clicks "Choose Bank Statement" and selects image
8. OCR processes image and extracts balance
9. Success message: "✓ Balance extracted: ฿X for [Bank Name]"
10. Balance is filled in for the selected bank
11. User can review and click Save
12. Selected bank's balance is saved to Google Sheets

---

## Testing

**Test URL:** http://localhost:3001/balance

### **Manual Entry Tests**

1. ✅ Click checkbox - bank should highlight with blue border
2. ✅ Click "Select All" - all banks should be selected
3. ✅ Click "Deselect All" - all selections should clear
4. ✅ Select 2 banks, enter values, save - only those 2 should save
5. ✅ Try to save with no banks selected - should show error
6. ✅ Counter shows correct "X of Y selected"

### **OCR Upload Tests**

1. ✅ Upload button disabled when no bank selected
2. ✅ Select bank from dropdown - upload button enables
3. ✅ Upload image - balance assigned to correct bank
4. ✅ Success message shows correct bank name
5. ✅ Try to upload without selecting bank - shows warning

### **Save Tests**

1. ✅ Save button disabled when no banks selected
2. ✅ Save button text updates based on selection count
3. ✅ Only selected banks with new values are saved
4. ✅ Validation message appears for invalid states

---

## Files Modified

**app/balance/page.tsx**
- Added `selectedBanks` state
- Added `toggleBankSelection`, `selectAllBanks`, `deselectAllBanks` functions
- Updated `handleFileUpload` to use selected bank
- Updated `handleSaveBalances` to filter by selected banks
- Added checkboxes to manual entry table
- Added bank dropdown to OCR upload section
- Updated table column layout (added Select column)
- Updated save button text and disabled logic

---

## Visual Design

### **Selected Bank Row**
- Border: 2px solid blue-500/50
- Background: blue-500/10
- Shadow: blue-500/10 glow
- Checkbox: Blue checkmark

### **Unselected Bank Row**
- Border: 1px solid slate-700/30
- Background: slate-800/50
- Hover: slate-800/70
- Checkbox: Empty

### **Checkbox Styling**
- Size: 20x20px (w-5 h-5)
- Border: 2px slate-600
- Background: slate-900
- Checked: blue-600 background and border
- Focus: Blue ring

### **Dropdown Styling**
- Full width
- Padding: 12px 16px
- Background: slate-800
- Border: slate-600
- Focus: Blue border + ring
- Icons: 💵 for cash, 🏦 for banks

---

## Benefits

✅ **User Control** - Users can now update specific banks instead of all at once  
✅ **OCR Accuracy** - Users specify which bank the screenshot is for  
✅ **Flexibility** - Can update 1 bank or all banks as needed  
✅ **Visual Feedback** - Clear indication of which banks are selected  
✅ **Validation** - Prevents accidental saves without selection  
✅ **Efficiency** - Select All/Deselect All for quick actions  
✅ **Clarity** - Save button shows exactly what will be saved  

---

## Next Steps (Future Enhancements)

1. **Remember Last Selection** - Save selected banks to localStorage
2. **Bulk Actions** - Select all cash accounts or all bank accounts
3. **Keyboard Shortcuts** - Space to toggle, Ctrl+A to select all
4. **Multi-Bank OCR** - Upload one screenshot, extract multiple balances
5. **Bank Grouping** - Group by account type (Cash, Checking, Savings)
6. **Quick Filters** - "Show only selected" toggle

---

**Last Updated:** November 1, 2025  
**Status:** ✅ **PRODUCTION READY**  
**User Request:** FULFILLED ✓

