# CRITICAL FIX: API Endpoint 404 Errors

## URGENT ISSUE RESOLVED ✅

### Problem
Dashboard was throwing 404 errors:
```
API Error: 404 Not Found
at fetchAPI (lib/api.ts:95:13)
at async fetchDashboardData (lib/api.ts:168:67)
```

### Root Cause
**WRONG API ENDPOINTS** - I created fictional endpoints that don't exist!

**What I incorrectly created in `lib/api.ts`:**
```typescript
fetchOverheadCategories() → '/overhead-categories'  ❌ DOESN'T EXIST
fetchPropertyCategories() → '/property-categories'  ❌ DOESN'T EXIST
```

**Actual endpoints from original code:**
```typescript
'/api/pnl/overhead-expenses?period=month'  ✅ EXISTS
'/api/pnl/property-person?period=month'    ✅ EXISTS
```

### The Fix

**Updated `lib/api.ts`:**

```typescript
// BEFORE (WRONG) ❌
export async function fetchOverheadCategories(): Promise<OverheadCategory[]> {
  return fetchAPI<OverheadCategory[]>('/overhead-categories');
}

export async function fetchPropertyCategories(): Promise<PropertyCategory[]> {
  return fetchAPI<PropertyCategory[]>('/property-categories');
}

// AFTER (CORRECT) ✅
export async function fetchOverheadCategories(): Promise<OverheadCategory[]> {
  const response = await fetchAPI<{ ok: boolean; data: { items: OverheadCategory[] } }>('/pnl/overhead-expenses?period=month');
  return response.data.items;
}

export async function fetchPropertyCategories(): Promise<PropertyCategory[]> {
  const response = await fetchAPI<{ ok: boolean; data: { items: PropertyCategory[] } }>('/pnl/property-person?period=month');
  return response.data.items;
}
```

### Verification

**Checked git history:**
```bash
git show 7a24566:app/dashboard/page.tsx
```

**Original working code fetched:**
```javascript
fetch('/api/pnl/overhead-expenses?period=month')
fetch('/api/pnl/property-person?period=month')
```

**Actual API files that exist:**
```
✅ app/api/pnl/overhead-expenses/route.ts
✅ app/api/pnl/property-person/route.ts
❌ app/api/overhead-categories/route.ts (DOESN'T EXIST)
❌ app/api/property-categories/route.ts (DOESN'T EXIST)
```

### Why This Happened

During the React Query refactoring, I created the API layer without checking the actual endpoint paths in the codebase. I assumed endpoint names that seemed logical but didn't verify against:
1. The original working code
2. The actual API route files
3. The git history

### Lesson Learned

✅ **ALWAYS verify API endpoints before creating abstraction layers**
✅ **Check git history for working implementation**
✅ **Verify actual route files exist in app/api/**
✅ **Test immediately after creating new API functions**

### Status
✅ **FIXED** - Dashboard will now load without 404 errors
✅ All pages verified error-free:
  - Dashboard: ✅
  - P&L: ✅
  - Balance: ✅

### Files Modified
- `lib/api.ts` - Fixed `fetchOverheadCategories()` and `fetchPropertyCategories()`

---
**Fixed:** $(date)
**Severity:** CRITICAL
**Impact:** Dashboard completely broken → Now working
