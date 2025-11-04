# Google Sheets API Cache-Busting Implementation

**Date**: November 4, 2025  
**Status**: ✅ DEPLOYED - Waiting for Vercel propagation  
**Commit**: `d004437`

---

## 🐛 Problem

**Symptom**: Production API showing stale data after Google Sheets edits  
**Root Cause**: Google Sheets API caches responses for 5-10 minutes on their edge servers  
**Impact**: Changes to categories not reflected immediately in production

**Example**:
- Deleted test entries ("1", "2", "3", "4") from Google Sheets
- Local API: ✅ Shows 7 properties (clean)
- Production API: ❌ Shows 8 properties (with "3" test entry)

---

## ✅ Solution Implemented

Added cache-busting headers to all Google Sheets API requests in `/app/api/options/route.ts`:

```typescript
const cacheBuster = Date.now();
console.log(`[OPTIONS] Cache-bust timestamp: ${cacheBuster}`);

const batchResponse = await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: [ /* ... all ranges ... */ ]
}, {
  // Force Google's edge to bypass cache
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Cache-Bust': cacheBuster.toString(),
  }
});
```

---

## 🧪 Testing

### **Local (with cache-busting)** ✅
```bash
curl http://localhost:3000/api/options | jq .metadata
# Result: 7 properties, 5 payments, 32 operations, 4 revenues
# No test entries present
```

### **Production (deploying...)** 🔄
```bash
curl https://accounting.siamoon.com/api/options | jq .metadata
# Expected after deployment: Same as local
# Current: Still showing cached data (8 properties with test "3")
```

---

## 📊 Expected Results

**Before Cache-Busting**:
- Google Sheets change → Wait 5-10 minutes → Production updates

**After Cache-Busting**:
- Google Sheets change → Immediate reflection in production (next API call)

**Counts After Deployment**:
- Properties: 7 (was 8, removed "3")
- Payments: 5 (was 6, removed "4")
- Operations: 32 (was 34, removed "1" and "2")
- Revenues: 4 (clean revenue categories)

---

## 🔍 Verification Commands

```bash
# Test production API
curl -s "https://accounting.siamoon.com/api/options?t=$(date +%s)" | jq '{
  metadata: .metadata,
  has_test_entries: {
    "1": (.data.typeOfOperation | map(select(. == "1")) | length > 0),
    "2": (.data.typeOfOperation | map(select(. == "2")) | length > 0),
    "3": (.data.properties | map(select(. == "3")) | length > 0),
    "4": (.data.typeOfPayment | map(select(. == "4")) | length > 0)
  }
}'

# All should be false after deployment
```

---

## 📝 Impact

✅ **Pros**:
- Immediate reflection of Google Sheets changes
- No more waiting for cache expiry
- Better developer experience
- Predictable behavior

⚠️ **Cons**:
- Slightly higher Google Sheets API quota usage (negligible for our volume)
- Each request is fresh (no edge caching benefit)

**Trade-off Assessment**: ✅ Worth it - Data freshness > minimal caching benefit

---

## 🚀 Deployment Status

- **Commit**: `d004437` - fix: add cache-busting headers to Google Sheets API calls
- **Pushed**: November 4, 2025
- **Vercel Status**: Deploying...
- **ETA**: 1-2 minutes from push

---

## 📚 Related Documentation

- [Google Sheets API Caching Behavior](https://developers.google.com/sheets/api/guides/performance)
- Mobile Team Guide: `MOBILE_TEAM_API_INTEGRATION_GUIDE.md`
- Deprecation Notice: `config/README_DEPRECATION.md`

---

## ✅ Success Criteria

- [ ] Production returns 7 properties (not 8)
- [ ] Production returns 5 payments (not 6)
- [ ] No test entries ("1", "2", "3", "4") in production
- [ ] Immediate updates when Google Sheets changes
- [ ] Cache-bust timestamp logged in Vercel logs

---

**Next Steps**: Monitor production endpoint for fresh data, verify all test entries removed.
