# 🚀 Production Deployment Checklist (Option A - Original Setup)

## ✅ Step 1: Share Google Sheet with Service Account

**Sheet URL**: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit

**Service Account Email**:
```
accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
```

**Instructions**:
1. Click "Share" button in Google Sheet
2. Paste the service account email above
3. Set permission: **Editor**
4. **Uncheck** "Notify people"
5. Click "Share"

**Status**: [ ] Done

---

## ✅ Step 2: Upload Environment Variables to Vercel

**File to Copy**: `.env.vercel.production`

**Vercel Dashboard**:
https://vercel.com/tool2us-projects/accounting-buddy-app/settings/environment-variables

**Variables to Set**:

### Required (copy from .env.vercel.production):
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` - **ONE LONG LINE** with `\\n` (double-escaped newlines)
- [ ] `GOOGLE_SHEET_ID`
- [ ] `GOOGLE_VISION_KEY`
- [ ] `SHEETS_WEBHOOK_URL`
- [ ] `SHEETS_WEBHOOK_SECRET`
- [ ] `SHEETS_PNL_URL`
- [ ] `SHEETS_BALANCES_GET_URL`
- [ ] `SHEETS_BALANCES_APPEND_URL`
- [ ] `OPENAI_API_KEY`
- [ ] `BASE_URL`
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` - **MULTI-LINE** with real newlines (press Enter)

### ❌ Variables to REMOVE (if present):
- [ ] `GOOGLE_CLIENT_EMAIL` - **DELETE THIS**
- [ ] `GOOGLE_PRIVATE_KEY` - **DELETE THIS**

**Status**: [ ] Done

---

## ✅ Step 3: Trigger Vercel Redeploy

**Option A - Via Dashboard**:
1. Go to: https://vercel.com/tool2us-projects/accounting-buddy-app
2. Click "Deployments" tab
3. Click "..." on latest deployment
4. Click "Redeploy"

**Option B - Via Git Push**:
```bash
git commit --allow-empty -m "Trigger production redeploy with accounting-buddy-476114 credentials"
git push origin main
```

**Status**: [ ] Done

---

## ✅ Step 4: Verify Production Deployment

### Test Endpoints:

**1. Test Sheets Diagnostic**:
```bash
curl -s https://accounting-buddy-app.vercel.app/api/test-sheets | jq .
```
**Expected**: `{ "ok": true, "title": "BookMate P&L 2025" }`

**2. Test Balance API**:
```bash
curl -s https://accounting-buddy-app.vercel.app/api/balance | jq '{ok, dataCount: (.data | length)}'
```
**Expected**: `{ "ok": true, "dataCount": <number> }`

**3. Test Options API**:
```bash
curl -s https://accounting-buddy-app.vercel.app/api/options | jq '{ok, properties: (.data.properties | length)}'
```
**Expected**: `{ "ok": true, "properties": <number> }`

**4. Test P&L API**:
```bash
curl -s https://accounting-buddy-app.vercel.app/api/pnl | jq '{ok, monthsCount: (.months | length)}'
```
**Expected**: `{ "ok": true, "monthsCount": <number> }`

### Browser Testing:

**5. Balance Page**:
- Go to: https://accounting-buddy-app.vercel.app/balance
- Should load balance data from "Balance Summary" tab
- No errors in console

**6. Dashboard**:
- Go to: https://accounting-buddy-app.vercel.app/dashboard
- Should display overview data
- No errors in console

**Status**: [ ] All tests passing

---

## ✅ Step 5: Notify PM

Once all tests pass, send confirmation:

```
✅ Production deployment complete (Option A)
✅ Using accounting-buddy-476114 project
✅ All API endpoints working
✅ Balance page loading live data
✅ Ready for Phase 2 migration planning
```

**Status**: [ ] Done

---

## 📋 Quick Reference

**Service Account**: accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com
**Google Cloud Project**: accounting-buddy-476114  
**Firebase Project**: accounting-buddy-476114 (same project)  
**Vercel Project**: accounting-buddy-app  
**Production URL**: https://accounting-buddy-app.vercel.app

**Environment File**: `.env.vercel.production` (this workspace)

---

## ⏭️ Phase 2 (Next Sprint)

**Goal**: Migrate to unified `bookmate-bfd43` service account

**Tasks**:
1. Refactor all routes to use `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`
2. Update environment variables in Vercel
3. Share Google Sheet with `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`
4. Enable Google Sheets API in `bookmate-bfd43` project
5. Test and deploy
6. Remove `GOOGLE_SERVICE_ACCOUNT_KEY` permanently

**Time Estimate**: 1-2 hours for complete migration
