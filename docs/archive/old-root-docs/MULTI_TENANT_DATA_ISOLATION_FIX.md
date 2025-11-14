# Multi-Tenant Data Isolation Fix - CRITICAL BUG RESOLVED

## Critical Issue Discovered ⚠️

Maria's account was showing Shaun's data! This was a **critical security and data isolation bug**.

### The Problem:

When Maria logged in to her account, she saw Shaun's expense data:
- EXP - Construction - Structure: ฿106,422
- EXP - Repairs & Maintenance - Furniture: ฿42,529
- etc.

Her spreadsheet showed all zeros, but the dashboard displayed Shaun's data.

### Root Cause:

**Cache was NOT account-specific!** 

The cache keys were based only on data type and period:
```typescript
// WRONG - Same for all users!
const cacheKey = `property-person-${period}`;  
const cacheKey = `overhead-${period}`;
```

**What happened:**
1. Shaun logs in → fetches data → cache stores as `property-person-month`
2. Maria logs in → checks cache → finds `property-person-month` → returns Shaun's data! ❌

### Also Found:

**Endpoints were using environment variables instead of account-specific URLs:**
```typescript
// WRONG - Same Apps Script URL for all users!
const scriptUrl = process.env.SHEETS_WEBHOOK_URL;
const secret = process.env.SHEETS_WEBHOOK_SECRET;
```

This meant all users would hit the same Google Sheet!

## Fixes Applied

### 1. Property/Person Endpoint ✅

**File:** `/app/api/pnl/property-person/route.ts`

**Changes:**
- ✅ Added `getAccountFromSession()` to get user's account
- ✅ Cache keys now include `accountId`: `property-person-${accountId}-${period}`
- ✅ Uses account-specific `appsScriptUrl` and `webhookSecret`
- ✅ Each user's data is cached separately

**Before:**
```typescript
async function fetchPropertyPersonData(period: string) {
  const scriptUrl = process.env.SHEETS_WEBHOOK_URL;  // ❌ Same for all
  const secret = process.env.SHEETS_WEBHOOK_SECRET;  // ❌ Same for all
  const cacheKey = `property-person-${period}`;      // ❌ Shared cache
}
```

**After:**
```typescript
async function fetchPropertyPersonData(
  scriptUrl: string,      // ✅ Account-specific
  secret: string,         // ✅ Account-specific
  period: string,
  accountId: string       // ✅ For cache isolation
) {
  // Uses account's Apps Script URL
  const cacheKey = `property-person-${accountId}-${period}`;  // ✅ Isolated
}
```

### 2. Overhead Expenses Endpoint ✅

**File:** `/app/api/pnl/overhead-expenses/route.ts`

**Same fixes applied:**
- ✅ Added `getAccountFromSession()`
- ✅ Cache keys include `accountId`: `overhead-${accountId}-${period}`
- ✅ Uses account-specific URLs and secrets
- ✅ Data isolation per user

### 3. Updated Cache Strategy

**New cache structure:**
```typescript
const cache = new Map<string, CachedData>();

// Cache keys now include accountId
`property-person-${accountId}-${period}`  // e.g., "property-person-abc123-month"
`overhead-${accountId}-${period}`          // e.g., "overhead-abc123-month"
```

**Benefits:**
- ✅ Each user has their own cache entries
- ✅ No data leakage between accounts
- ✅ Cache still reduces API calls
- ✅ Automatic cache isolation

## Security Impact

### Before Fix:
- ❌ **Data Leakage**: Users could see other users' data
- ❌ **Privacy Violation**: Sensitive financial data exposed
- ❌ **Compliance Issue**: Failed data isolation requirements

### After Fix:
- ✅ **Data Isolation**: Each user sees only their data
- ✅ **Privacy Protected**: No cross-account data access
- ✅ **Compliance Met**: Proper multi-tenant separation

## Testing Results

### Shaun's Account:
- Email: shaun@siamoon.com
- Shows: Sia Moon Company Limited data
- Cache key: `property-person-sia-moon-month`

### Maria's Account:
- Email: maria@siamoon.com  
- Shows: Alesia House Company Ltd data (all zeros as expected)
- Cache key: `property-person-alesia-house-month`

✅ **No data cross-contamination!**

## Other Endpoints Already Fixed

These endpoints were already using account-specific data:
- ✅ `/api/pnl` - Main P&L data
- ✅ `/api/balance` - Bank balances
- ✅ `/api/inbox` - Activity feed

## What We Learned

### Multi-Tenant Best Practices:

1. **Never use global environment variables for user-specific data**
   ```typescript
   // ❌ BAD
   const url = process.env.USER_SPECIFIC_URL;
   
   // ✅ GOOD
   const account = await getAccountFromSession();
   const url = account.appsScriptUrl;
   ```

2. **Always include user/account ID in cache keys**
   ```typescript
   // ❌ BAD
   const cacheKey = `data-${period}`;
   
   // ✅ GOOD
   const cacheKey = `data-${accountId}-${period}`;
   ```

3. **Authenticate and get account for EVERY API call**
   ```typescript
   // ✅ Always do this
   const account = await getAccountFromSession();
   if (!account) return 401;
   ```

4. **Test with multiple users immediately**
   - Don't just test with one account
   - Verify data isolation between accounts
   - Check cache doesn't leak data

## Migration Notes

### Environment Variables (DEPRECATED):
These are no longer used for multi-tenant endpoints:
- ~~`SHEETS_WEBHOOK_URL`~~ - Use `account.appsScriptUrl` instead
- ~~`SHEETS_WEBHOOK_SECRET`~~ - Use `account.webhookSecret` instead

### New Pattern:
```typescript
// 1. Get account from session
const account = await getAccountFromSession();

// 2. Use account-specific config
const response = await fetch(account.appsScriptUrl, {
  body: JSON.stringify({
    action: 'getData',
    secret: account.webhookSecret,
  })
});

// 3. Cache with account isolation
const cacheKey = `data-${account.accountId}-${period}`;
cache.set(cacheKey, data);
```

## Status: RESOLVED ✅

- ✅ Data isolation implemented
- ✅ Account-specific caching
- ✅ Security vulnerability closed
- ✅ Tested with multiple accounts
- ✅ No data leakage

**Maria can now safely use her account without seeing Shaun's data!**
