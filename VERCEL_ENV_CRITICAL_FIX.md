# 🚨 CRITICAL FIX: Google Credentials Environment Variable

## Root Cause Found

The Vercel logs revealed the **actual problem** preventing live Google Sheets data:

```
[OPTIONS] google-credentials.json not found; falling back to config-only for payments
```

### What Was Wrong

1. **Code was looking for a file**: `/config/google-credentials.json`
2. **File doesn't exist in production** (and shouldn't - sensitive credentials)
3. **Fallback to static config** meant NO live Google Sheets data
4. **Cache-busting headers were never sent** because Google Sheets API wasn't called at all

### What Was Fixed

**Commit**: `8d71cb9`

Changed `/app/api/options/route.ts` from:
```typescript
// OLD: Read credentials from file
const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
if (!fs.existsSync(credentialsPath)) {
  console.warn('[OPTIONS] google-credentials.json not found; falling back to config-only for payments');
} else {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  // ...
}
```

To:
```typescript
// NEW: Use environment variable (like other routes)
const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (!credentialsJson) {
  console.warn('[OPTIONS] GOOGLE_SERVICE_ACCOUNT_KEY not found; falling back to config-only for payments');
} else {
  const credentials = JSON.parse(credentialsJson);
  // ...
}
```

## Verification Checklist

### ✅ Local Environment
- `.env.local` contains: `GOOGLE_SERVICE_ACCOUNT_KEY`
- Environment variable is set correctly
- Code compiles without errors

### 🔄 Vercel Environment (YOU NEED TO VERIFY)

**Check Vercel Dashboard** → Project Settings → Environment Variables

Required variables:
1. ✅ `GOOGLE_SHEET_ID` = `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
2. ⚠️ `GOOGLE_SERVICE_ACCOUNT_KEY` = <JSON content from accounting-buddy-476114-82555a53603b.json>

**To set GOOGLE_SERVICE_ACCOUNT_KEY in Vercel:**

1. Open `accounting-buddy-476114-82555a53603b.json` locally
2. Copy the **entire JSON content** (should be one line or minified)
3. Go to Vercel Dashboard → BookMate Project → Settings → Environment Variables
4. Add/Update: `GOOGLE_SERVICE_ACCOUNT_KEY`
5. Paste the JSON content as the value
6. Set for: **Production**, **Preview**, and **Development**
7. Save and **Redeploy** (or wait for automatic deployment)

## Testing After Fix

Once deployed (commit `8d71cb9` + environment variable set):

```bash
# Test 1: Should NO LONGER see the error
# Look for this in Vercel logs - it should be GONE:
# ❌ [OPTIONS] google-credentials.json not found

# Test 2: Verify live data
curl -s "https://accounting.siamoon.com/api/options" | jq '.metadata'
# Expected:
# {
#   "totalProperties": 7,    # Not 8
#   "totalOperations": 32,   # Not 34
#   "totalPayments": 6,      # This is correct
#   "totalRevenues": 4       # Not 0
# }

# Test 3: Verify no test entries
curl -s "https://accounting.siamoon.com/api/options" | jq '.data.properties[]'
# Should NOT include "3"

curl -s "https://accounting.siamoon.com/api/options" | jq '.data.typeOfPayment[]'
# Should NOT include "4"

# Test 4: Verify cache-busting works
# 1. Make a change in Google Sheets (add/remove entry)
# 2. Immediately test:
curl -s "https://accounting.siamoon.com/api/options" | jq '.metadata'
# Should reflect change within seconds, not 5-10 minutes
```

## Timeline

1. **12:23 - 12:38 UTC**: Multiple requests showing error in Vercel logs
2. **12:40 UTC**: Root cause identified via log analysis
3. **12:42 UTC**: Fix committed (`8d71cb9`)
4. **Next**: Verify `GOOGLE_SERVICE_ACCOUNT_KEY` in Vercel
5. **Next**: Wait for deployment + test

## Related Issues

- This explains why production showed stale data (8 props, 6 payments)
- This explains why cache-busting didn't work (API wasn't called)
- This explains why local worked (has `.env.local` with correct env var)
- Other routes worked because they already used `process.env.GOOGLE_SERVICE_ACCOUNT_KEY`

## Success Criteria

After Vercel environment variable is set and deployed:

✅ No more "google-credentials.json not found" in logs
✅ Production shows 7 properties (not 8)
✅ Production shows 4 revenues (not 0)  
✅ No test entries ("3", "4") visible
✅ Changes in Google Sheets reflect immediately (cache-busting working)
