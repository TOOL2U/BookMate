# SPREADSHEET TEMPLATE SHARING FIX

## ISSUE IDENTIFIED ✅

Vercel production is using a **different service account** than local development.

### Service Accounts

**Local Development:**
- Email: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
- Project: `accounting-buddy-476114`

**Vercel Production (CURRENT):**
- Email: `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`
- Project: `bookmate-bfd43`
- ⚠️ This is the Firebase Admin SDK service account

## IMMEDIATE FIX REQUIRED

### Option 1: Share Template with Vercel Service Account (QUICK FIX)

1. **Open the master template:**
   ```
   https://docs.google.com/spreadsheets/d/1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU/edit
   ```

2. **Click "Share" and add THIS email:**
   ```
   firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com
   ```

3. **Give "Editor" permission**

4. **Test registration again** - no redeployment needed!

### Option 2: Update Vercel to Use Correct Service Account (BETTER FIX)

```bash
# Remove old service account
vercel env rm GOOGLE_SERVICE_ACCOUNT_KEY production

# Add the correct one
cat config/google-credentials.json | vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production

# Redeploy
vercel --prod --yes
```

Then the template only needs to be shared with:
```
accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
```

## Recommendation

**I recommend Option 1 (quick fix) for now:**
- No redeployment needed
- Faster to test
- Can switch to Option 2 later if needed

The Firebase service account (`firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`) might already be set up with other permissions and integrations, so it may be better to keep using it.

## Testing After Fix

```bash
# Register a new test user
curl -X POST "https://accounting.siamoon.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "finaltest@example.com",
    "password": "TestUser2025!",
    "name": "Final Test"
  }' | jq '.user.spreadsheetId'

# Should output a spreadsheet ID, not null
```

---

**Action Required:** Share template with `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`
