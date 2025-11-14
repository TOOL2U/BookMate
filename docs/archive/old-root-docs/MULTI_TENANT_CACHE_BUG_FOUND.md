# 🔴 CRITICAL: Multi-Tenant Cache Bug Found!

## 🎯 Root Cause Identified

**Problem:** API caches are **NOT isolated by user** - they're shared globally!

### The Bug

Multiple API routes use **global in-memory caches** that are keyed **only** by data type (month, period, etc.) but **NOT by user/spreadsheet**:

#### Example from `/app/api/balance/route.ts`:
```typescript
const balanceCache = new Map<string, BalanceCacheEntry>();  // ❌ Global cache!

function getCachedBalance(month: string): any | null {
  const cached = balanceCache.get(month);  // ❌ Keyed by MONTH only
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.data;  // ❌ Returns ANYONE's data for this month!
  }
  return null;
}
```

**What happens:**
1. Admin (shaun@siamoon.com) visits Balance page → Data cached with key `"2024-11"`
2. New user (tommy@gmail.com) visits Balance page → Gets admin's cached data! ❌
3. Balance API doesn't fetch new user's spreadsheet because cache is "fresh"

---

## 🔍 Affected APIs

All these routes have the SAME bug:

### 1. `/app/api/balance/route.ts`
```typescript
const balanceCache = new Map<string, BalanceCacheEntry>();
// Cache key: month only (e.g., "2024-11")
// ❌ Should be: `${spreadsheetId}:${month}`
```

### 2. `/app/api/pnl/route.ts`
```typescript
let cache: CachedData | null = null;
// Cache: Single global object
// ❌ Should be: Map keyed by spreadsheetId
```

### 3. `/app/api/inbox/route.ts`
```typescript
let cache: {
  data: any[];
  timestamp: number;
} | null = null;
// Cache: Single global object
// ❌ Should be: Map keyed by spreadsheetId
```

### 4. Other APIs
Search results show similar patterns in:
- `/app/api/pnl/overhead-expenses/route.ts`
- `/app/api/pnl/property-person/route.ts`
- Potentially others

---

## 🧪 Why It Works Locally

**Localhost behavior:**
- You're the ONLY user testing
- Cache is cleared on each server restart (dev mode restarts often)
- No concurrent users to trigger cross-contamination

**Production (Vercel) behavior:**
- Serverless functions stay "warm" for minutes
- Cache persists across multiple requests
- Multiple users share the SAME Node.js instance
- Cache cross-contamination happens!

---

## ✅ The Fix

### Strategy: Make cache keys user-specific

Change cache keys from:
```typescript
❌ "2024-11"           → Anyone's data for Nov 2024
❌ null (single object) → Anyone's data
```

To:
```typescript
✅ "spreadsheetId123:2024-11" → SPECIFIC user's data for Nov 2024
✅ Map<spreadsheetId, data>   → Per-user cache
```

---

## 🛠️ Implementation

### Fix 1: Balance API Cache

**Before:**
```typescript
const balanceCache = new Map<string, BalanceCacheEntry>();

function getCachedBalance(month: string): any | null {
  const cached = balanceCache.get(month);
  // ...
}

function setCachedBalance(month: string, data: any): void {
  balanceCache.set(month, { data, timestamp: Date.now() });
}
```

**After:**
```typescript
const balanceCache = new Map<string, BalanceCacheEntry>();

function getCachedBalance(spreadsheetId: string, month: string): any | null {
  const cacheKey = `${spreadsheetId}:${month}`;  // ✅ User-specific key
  const cached = balanceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedBalance(spreadsheetId: string, month: string, data: any): void {
  const cacheKey = `${spreadsheetId}:${month}`;  // ✅ User-specific key
  balanceCache.set(cacheKey, { data, timestamp: Date.now() });
}
```

**Usage in handler:**
```typescript
async function balanceHandler(req: NextRequest) {
  const month = (url.searchParams.get('month') || 'ALL').toUpperCase();
  const spreadsheetId = await getSpreadsheetId(req);  // Get FIRST
  
  // Check cache with user-specific key
  if (!skipCache) {
    const cached = getCachedBalance(spreadsheetId, month);  // ✅ Pass both
    if (cached) {
      console.log(`✅ Returning cached data for ${spreadsheetId}:${month}`);
      return NextResponse.json(cached);
    }
  }
  
  // ... fetch data ...
  
  // Save to cache with user-specific key
  setCachedBalance(spreadsheetId, month, result);  // ✅ Pass both
}
```

---

### Fix 2: P&L API Cache

**Before:**
```typescript
let cache: CachedData | null = null;

// In handler:
if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
  return cache.data;  // ❌ Anyone's data
}
```

**After:**
```typescript
const pnlCache = new Map<string, CachedData>();  // ✅ Map instead of single object

// In handler:
const spreadsheetId = await getSpreadsheetId(request);
const cached = pnlCache.get(spreadsheetId);  // ✅ User-specific

if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
  return cached.data;  // ✅ THIS user's data
}

// ... fetch data ...

pnlCache.set(spreadsheetId, { data, timestamp: now });  // ✅ Store per user
```

---

### Fix 3: Inbox API Cache

**Before:**
```typescript
let cache: {
  data: any[];
  timestamp: number;
} | null = null;

// In handler:
if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
  return cache.data;  // ❌ Anyone's data
}
```

**After:**
```typescript
const inboxCache = new Map<string, { data: any[]; timestamp: number }>();  // ✅ Map

// In handler:
const spreadsheetId = await getSpreadsheetId(request);
const cached = inboxCache.get(spreadsheetId);  // ✅ User-specific

if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
  return cached.data;  // ✅ THIS user's data
}

// ... fetch data ...

inboxCache.set(spreadsheetId, { data, timestamp: now });  // ✅ Store per user
```

---

## 📋 Files to Update

Priority order:

1. **HIGH PRIORITY** (Dashboard, P&L, Activity pages affected):
   - ✅ `/app/api/pnl/route.ts`
   - ✅ `/app/api/inbox/route.ts`
   - ✅ `/app/api/balance/route.ts`

2. **MEDIUM PRIORITY** (Other data endpoints):
   - `/app/api/pnl/overhead-expenses/route.ts`
   - `/app/api/pnl/property-person/route.ts`
   - Any other routes with global caches

---

## 🧪 Testing Plan

### Test 1: Two Users in Production

1. **Admin** (shaun@siamoon.com):
   - Login
   - Visit Dashboard → Note admin's revenue value
   - Visit P&L → Note admin's data
   - Visit Activity → Note admin's transactions

2. **New User** (tommy@gmail.com):
   - Login in DIFFERENT browser/incognito
   - Visit Dashboard → Should see EMPTY/different data (not admin's)
   - Visit P&L → Should see EMPTY/different data
   - Visit Activity → Should see EMPTY/different data

3. **Verify**:
   - Check Vercel logs for both users
   - Confirm different spreadsheetIds in cache keys
   - No cross-contamination

---

## 🎯 Why Balance Page Works

**Balance page uses different API flow:**
- Might have its own fetch logic
- Could be client-side cached differently
- Or just got lucky with cache timing

But P&L, Dashboard, and Activity all use the buggy cached APIs.

---

## 📊 Expected Behavior After Fix

### Before Fix:
```
User 1 (admin): Visit Dashboard → Cache: "pnl" → Admin's data stored
User 2 (tommy): Visit Dashboard → Cache: "pnl" → Returns admin's data! ❌
```

### After Fix:
```
User 1 (admin): Visit Dashboard → Cache: "spreadsheet123:pnl" → Admin's data stored
User 2 (tommy): Visit Dashboard → Cache: "spreadsheet456:pnl" → Cache miss → Fetches Tommy's data ✅
```

---

## 🚀 Next Steps

1. **Fix the 3 high-priority APIs** (pnl, inbox, balance)
2. **Deploy to production**
3. **Test with two users concurrently**
4. **Monitor Vercel logs** for cache behavior
5. **Verify isolation** with different data

---

## 💡 Long-term Solution

Consider using a proper cache store:
- **Vercel KV** (Redis) - per-user cache with TTL
- **Upstash Redis** - serverless-friendly
- **In-memory Map** (current) - works but needs user-specific keys

For now, fixing the cache keys is the **quickest solution** that solves the immediate problem.

---

## TL;DR

**Problem:** API caches are global, not per-user  
**Impact:** New users see admin's data due to cache cross-contamination  
**Fix:** Change cache keys from `"month"` to `"spreadsheetId:month"`  
**Files:** 3 critical routes (pnl, inbox, balance)  
**Status:** Ready to fix! 🔧
