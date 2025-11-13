# 🔐 Quick Fix: Add Authentication to Frontend Components

## Problem
Settings components and Activity page can't access API because they're missing the Authorization header.

## Solution (Use VS Code Find & Replace)

### Step 1: Open VS Code Find & Replace
- Press `Cmd + Shift + H` (Mac) or `Ctrl + Shift + H` (Windows/Linux)
- Enable "Use Regular Expression" (icon: `.*`)
- Set "files to include": `components/settings/*.tsx,app/activity/page.tsx`

### Step 2: Add Import Statement

**Find:**
```
import.*from 'lucide-react';
```

**Replace with:**
```
$&
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '@/lib/api/client';
```

Click "Replace All" → This adds the import after lucide-react imports

### Step 3: Fix GET Requests

**Find:**
```regex
const res = await fetch\('(/api/[^']+)'\);
```

**Replace with:**
```
const res = await fetchWithAuth('$1');
```

Click "Replace All" → This fixes all GET requests

### Step 4: Fix POST Requests (Part 1 - Add Method)

**Find:**
```regex
const res = await fetch\('(/api/[^']+)',\s*\{[\s\S]*?method:\s*'POST',[\s\S]*?body:\s*JSON\.stringify\((\{[^}]+\})\),?\s*\}\);
```

This is complex, so let's do it manually for each file...

## Manual Approach (Simpler!)

For each file, make these changes:

### Files to Update:
1. `components/settings/ExpenseCategoryManager.tsx`
2. `components/settings/RevenueManager.tsx`
3. `components/settings/PaymentTypeManager.tsx`  
4. `app/activity/page.tsx`

### Changes for Each File:

#### 1. Add Import (after lucide-react import)
```typescript
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '@/lib/api/client';
```

#### 2. Update the `fetchCategories`/`fetchProperties`/`fetchReceipts` function:

**Change this:**
```typescript
const res = await fetch('/api/categories/expenses');
```

**To this:**
```typescript
const res = await fetchWithAuth('/api/categories/expenses');
```

#### 3. Update all POST requests (add, edit, delete actions):

**Change this:**
```typescript
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    newValue: value
  }),
});
```

**To this:**
```typescript
const res = await postWithAuth('/api/categories/expenses', {
  action: 'add',
  newValue: value
});
```

#### 4. Update DELETE requests (activity page only):

**Change this:**
```typescript
const response = await fetch('/api/inbox', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rowNumber: receipt.rowNumber }),
});
```

**To this:**
```typescript
const response = await deleteWithAuth('/api/inbox', {
  rowNumber: receipt.rowNumber
});
```

##  Exact Line-by-Line Changes

### ExpenseCategoryManager.tsx

**Line 4 - Add after lucide import:**
```typescript
import { fetchWithAuth, postWithAuth } from '@/lib/api/client';
```

**Line ~24 - Update fetch function:**
```typescript
// OLD:
const res = await fetch('/api/categories/expenses');

// NEW:
const res = await fetchWithAuth('/api/categories/expenses');
```

**Line ~65 - Update add function:**
```typescript
// OLD:
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'edit', oldValue, newValue: editValue.trim(), index: editingIndex }),
});

// NEW:
const res = await postWithAuth('/api/categories/expenses', {
  action: 'edit',
  oldValue,
  newValue: editValue.trim(),
  index: editingIndex
});
```

**Line ~100 - Update delete function:**
```typescript
// OLD:
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'delete', oldValue: value, index }),
});

// NEW:
const res = await postWithAuth('/api/categories/expenses', {
  action: 'delete',
  oldValue: value,
  index
});
```

**Line ~147 - Update add new function:**
```typescript
// OLD:
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'add', newValue: newValue.trim() }),
});

// NEW:
const res = await postWithAuth('/api/categories/expenses', {
  action: 'add',
  newValue: newValue.trim()
});
```

### RevenueManager.tsx
- Same pattern as ExpenseCategoryManager
- Change `/api/categories/expenses` to `/api/categories/revenues`
- 4 fetch calls total (1 GET, 3 POST)

### PaymentTypeManager.tsx
- Same pattern as ExpenseCategoryManager
- Change `/api/categories/expenses` to `/api/categories/payments`
- 4 fetch calls total (1 GET, 3 POST)

### app/activity/page.tsx

**Add import:**
```typescript
import { fetchWithAuth, deleteWithAuth } from '@/lib/api/client';
```

**Line ~57 - Update GET:**
```typescript
// OLD:
const response = await fetch('/api/inbox');

// NEW:
const response = await fetchWithAuth('/api/inbox');
```

**Line ~104 - Update DELETE:**
```typescript
// OLD:
const response = await fetch('/api/inbox', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rowNumber: receipt.rowNumber }),
});

// NEW:
const response = await deleteWithAuth('/api/inbox', {
  rowNumber: receipt.rowNumber
});
```

## Test After Changes

1. **Logout** (clears any cached state)
2. **Login** again (gets fresh token)
3. Navigate to `/settings` - should load without "No authorization token" error
4. Navigate to `/activity` - should load receipts
5. Try editing a category - should work

## Files Already Fixed
- ✅ `components/settings/PropertyManager.tsx` - DONE
- ✅ `lib/api/client.ts` - Helper functions created

## Files Needing Updates
- ⏳ `components/settings/ExpenseCategoryManager.tsx`
- ⏳ `components/settings/RevenueManager.tsx`
- ⏳ `components/settings/PaymentTypeManager.tsx`
- ⏳ `app/activity/page.tsx`

## Estimated Time
- 5-10 minutes if done manually
- Property Manager can be used as reference

Let me know if you want me to create a script to automate this, or if you prefer to do it manually using find/replace in your editor!
