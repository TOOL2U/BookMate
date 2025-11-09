# Balance Page Cache Fix - November 9, 2025

## 🐛 Problem

The balance page was showing **stale/cached data** on local development but correct data on Vercel production.

### Symptoms:
- **Vercel (Production):** ✅ Shows correct, up-to-date balances
- **Local Dev:** ❌ Shows old/cached balances
- **Issue:** Data was being cached in-memory by the API for 60 seconds
- **Root Cause:** Local Next.js dev server keeps running, so cache persists across page refreshes

---

## ✅ Solution

### 1. Added Cache-Busting to Balance API Call

**File:** `app/balance/page.tsx`

**Before:**
```typescript
const res = await fetch('/api/balance?month=ALL');
```

**After:**
```typescript
const res = await fetch(`/api/balance?month=ALL&t=${Date.now()}`);
```

The `?t=${Date.now()}` parameter forces a fresh API call every time.

---

### 2. Updated Balance API to Respect Cache-Busting

**File:** `app/api/balance/route.ts`

**Added logic:**
```typescript
const skipCache = url.searchParams.has('t'); // Cache-busting: if ?t= param exists, skip cache

// Check cache first (unless cache-busting param is present)
if (!skipCache) {
  const cached = getCachedBalance(month);
  if (cached) {
    console.log(`✅ [Balance API] Returning cached data for month: ${month}`);
    return NextResponse.json({ ...cached, cached: true });
  }
} else {
  console.log(`🔄 [Balance API] Cache-busting enabled, fetching fresh data for month: ${month}`);
}
```

**How it works:**
- If `?t=` parameter is present → **Skip cache, fetch fresh data**
- If no `?t=` parameter → **Use cache if available (60 seconds)**

---

## 📊 Technical Details

### Balance API Caching Strategy

The balance API uses a 60-second in-memory cache to reduce Google Sheets API calls:

```typescript
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

interface BalanceCacheEntry {
  data: any;
  timestamp: number;
}
const balanceCache = new Map<string, BalanceCacheEntry>();
```

### Why This Happened in Local Dev Only

| Environment | Behavior | Reason |
|-------------|----------|--------|
| **Vercel Production** | ✅ Always fresh | Each request may hit a different serverless function instance |
| **Local Dev** | ❌ Cached | Same Node process runs continuously, cache persists |

### Cache Key Structure

Cache is keyed by `month` parameter:
- `balanceCache.get('ALL')` → All balances
- `balanceCache.get('JAN')` → January balances
- `balanceCache.get('FEB')` → February balances

---

## 🧪 Testing

### Test Cache-Busting Works:

1. **First Request (Fresh Data):**
   ```bash
   curl "http://localhost:3000/api/balance?month=ALL&t=123456"
   ```
   Console output: `🔄 [Balance API] Cache-busting enabled, fetching fresh data for month: ALL`

2. **Second Request (Without Cache-Busting):**
   ```bash
   curl "http://localhost:3000/api/balance?month=ALL"
   ```
   Console output: `✅ [Balance API] Returning cached data for month: ALL`

3. **Third Request (With Cache-Busting Again):**
   ```bash
   curl "http://localhost:3000/api/balance?month=ALL&t=789012"
   ```
   Console output: `🔄 [Balance API] Cache-busting enabled, fetching fresh data for month: ALL`

---

## 🎯 Impact

### Before Fix:
- Users had to wait 60 seconds for updated balances to appear
- Page refreshes showed stale data
- Confusing UX: Vercel showed different data than local dev

### After Fix:
- ✅ Every page load fetches fresh balance data
- ✅ Cache still works for performance (external API calls without `?t=`)
- ✅ Consistent behavior between local dev and production
- ✅ Better developer experience

---

## 🔗 Related Files

- `app/balance/page.tsx` - Balance overview page (adds `?t=` param)
- `app/api/balance/route.ts` - Balance API endpoint (respects cache-busting)
- `components/balance/BalanceTrendChart.tsx` - Balance trend visualization

---

## 📝 Notes

- The cache is still useful for external API calls (mobile app, etc.)
- Web app bypasses cache for better UX
- In production, Vercel's serverless functions naturally reset cache more frequently
- The 60-second cache reduces Google Sheets API quota usage

---

**Status:** ✅ Fixed  
**Date:** November 9, 2025  
**Impact:** High - Affects all balance page data freshness
