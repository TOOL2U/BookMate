# Frontend Authentication Fix - Manual Steps

## Problem
All settings components and the activity page are making API requests WITHOUT the Authorization header, causing "No authorization token provided" errors.

## Solution
Add the Authorization header to ALL fetch requests in these files:
- `components/settings/ExpenseCategoryManager.tsx`
- `components/settings/RevenueManager.tsx`
- `components/settings/PaymentTypeManager.tsx`
- `app/activity/page.tsx`

## Changes Needed

### Step 1: Add Helper Function to Each Component

Add this helper function at the top of each component (after the state declarations):

```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authorization token found. Please login again.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
```

### Step 2: Update All Fetch Calls

#### Pattern 1: GET Requests (Read operations)
**Before:**
```typescript
const res = await fetch('/api/categories/expenses');
```

**After:**
```typescript
const res = await fetch('/api/categories/expenses', {
  headers: getAuthHeaders()
});
```

#### Pattern 2: POST Requests (Write operations)
**Before:**
```typescript
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'add', newValue: 'test' }),
});
```

**After:**
```typescript
const res = await fetch('/api/categories/expenses', {
  method: 'POST',
  headers: getAuthHeaders(),
  body: JSON.stringify({ action: 'add', newValue: 'test' }),
});
```

#### Pattern 3: DELETE Requests
**Before:**
```typescript
const res = await fetch('/api/inbox', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rowNumber: 123 }),
});
```

**After:**
```typescript
const res = await fetch('/api/inbox', {
  method: 'DELETE',
  headers: getAuthHeaders(),
  body: JSON.stringify({ rowNumber: 123 }),
});
```

## Automated Fix (Recommended)

I've already updated `PropertyManager.tsx` to use the helper functions from `@/lib/api/client`.

You can apply the same pattern to the other files by:

1. Adding this import at the top:
```typescript
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '@/lib/api/client';
```

2. Replacing fetch calls:
- `fetch('/api/...') ` → `fetchWithAuth('/api/...')`
- `fetch('/api/...', { method: 'POST', ... })` → `postWithAuth('/api/...', bodyData)`
- `fetch('/api/...', { method: 'DELETE', ... })` → `deleteWithAuth('/api/...', bodyData)`

## Files to Update

### 1. ExpenseCategoryManager.tsx
- Line ~24: Add helper function
- Find all `await fetch(` calls (4 total)
- Add `headers: getAuthHeaders()` to each

### 2. RevenueManager.tsx
- Line ~24: Add helper function
- Find all `await fetch(` calls (4 total)
- Add `headers: getAuthHeaders()` to each

### 3. PaymentTypeManager.tsx
- Line ~24: Add helper function
- Find all `await fetch(` calls (4 total)
- Add `headers: getAuthHeaders()` to each

### 4. app/activity/page.tsx
- Line ~50: Add helper function (inside fetchReceipts function)
- Find all `await fetch(` calls (2 total: GET and DELETE)
- Add `headers: getAuthHeaders()` to each

## Quick Test

After making changes:
1. Logout and login again
2. Navigate to `/settings`
3. Components should load without "No authorization token" errors
4. Navigate to `/activity`
5. Activity feed should load without errors

## Alternative: Use the Auth Helper Library

The cleanest solution is to use the helpers I created in `lib/api/client.ts`:

```typescript
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '@/lib/api/client';

// GET request
const res = await fetchWithAuth('/api/categories/expenses');

// POST request  
const res = await postWithAuth('/api/categories/expenses', { 
  action: 'add',
  newValue: 'New Category' 
});

// DELETE request
const res = await deleteWithAuth('/api/inbox', { rowNumber: 123 });
```

This automatically handles:
- Getting token from localStorage
- Adding Authorization header
- Adding Content-Type header
- Error handling if no token found

## Status

- ✅ PropertyManager.tsx - DONE (using auth helpers)
- ⏳ ExpenseCategoryManager.tsx - NEEDS UPDATE
- ⏳ RevenueManager.tsx - NEEDS UPDATE
- ⏳ PaymentTypeManager.tsx - NEEDS UPDATE
- ⏳ app/activity/page.tsx - NEEDS UPDATE
