# Multi-Tenant Testing Guide - V9.1

## ✅ Setup Complete

### Environment Updated:
- **Apps Script URL**: Updated to V9.1 deployment
  - Old: `AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl`
  - New: `AKfycbzPbN6ziXzXzU7mFSl8RkSic47rd_oJnl_k7Xh2nbM40PkcHUg5c_LZY2GyzWxjN5c6`
- **Multi-Spreadsheet Support**: ✅ Enabled in Apps Script V9.1
- **API Routes**: ✅ All updated to pass `spreadsheetId`

## 🧪 Testing Steps

### Step 1: Register a New Test User

1. **Go to**: http://localhost:3000/register
2. **Create account**:
   - Email: `multitenant@test.com`
   - Password: `Test1234!`
   - Name: `Multi Tenant Test`
3. **Watch terminal logs** for:
   ```
   ✅ Spreadsheet auto-created: [NEW_SPREADSHEET_ID]
   ```

### Step 2: Verify User Sees Empty Data

After registration, you should be redirected to the dashboard:

**Expected Results:**
- ✅ **Dashboard shows EMPTY data** (not the original spreadsheet's data)
- ✅ **P&L shows $0** (fresh spreadsheet)
- ✅ **Inbox is empty** (no transactions)
- ✅ **Settings shows empty categories** (will use template defaults)

**Check Terminal Logs:**
```
📊 Using spreadsheet: [USER'S_NEW_SPREADSHEET_ID]
```

### Step 3: Check Different Pages

Navigate through the app and verify the spreadsheet ID in logs:

1. **Dashboard**: `/dashboard`
   - Should see: `📊 Using user's spreadsheet: [USER_ID]`
   
2. **P&L Page**: `/pnl`
   - Should see: `📊 Using spreadsheet: [USER_ID]`
   
3. **Inbox**: `/inbox`
   - Should see: `📊 Using spreadsheet: [USER_ID]`
   
4. **Settings**: `/settings`
   - Should use user's spreadsheet for categories

### Step 4: Add Test Data

1. Go to **Inbox** or **Dashboard**
2. Add a test transaction
3. Verify it appears in the user's spreadsheet (not the original)

### Step 5: Test with Default Spreadsheet (No Auth)

1. **Log out**
2. Try accessing an API endpoint without auth:
   ```bash
   curl http://localhost:3000/api/pnl
   ```
3. **Expected**: Should use default spreadsheet
4. **Terminal should show**:
   ```
   📊 Using default spreadsheet (no user auth or spreadsheet): 1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
   ```

## 🔍 Verification Checklist

- [ ] New user registration creates a spreadsheet
- [ ] User sees their own empty data (not original data)
- [ ] Terminal logs show correct spreadsheet ID for user
- [ ] User can add transactions to their own spreadsheet
- [ ] Unauthenticated requests use default spreadsheet
- [ ] Each user's data is isolated

## 📊 Spreadsheet IDs Reference

- **Default/Original**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- **Template**: `1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU`
- **Shared Drive**: `0ACHIGfT01vYxUk9PVA`
- **Test User (test@gmail.com)**: `1JTppltcgzgVgoZrPwfmTiS2OeT3_1srJSCVbt9gD4gg`

## 🐛 Troubleshooting

### Issue: User sees original data instead of empty data

**Check:**
1. Apps Script logs - is it receiving `spreadsheetId`?
2. API logs - is it sending `spreadsheetId`?
3. Database - does user have `googleSheetId` saved?

**Debug:**
```bash
# Check database
node verify-db-data.mjs

# Check API request
curl -X POST http://localhost:3000/api/pnl \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Issue: Apps Script errors

**Check Apps Script Execution Logs:**
1. Open template spreadsheet
2. Extensions → Apps Script
3. Click "Executions" (clock icon)
4. Look for errors in recent executions

**Common Errors:**
- "Unable to open spreadsheet" → Check service account has access
- "Authorization required" → Check secret matches

## 🚀 Next Steps After Testing

Once multi-tenant is confirmed working:

1. **Update Production** (.env.production.local on Vercel)
   ```bash
   SHEETS_WEBHOOK_URL=https://script.google.com/a/macros/siamoon.com/s/AKfycbzPbN6ziXzXzU7mFSl8RkSic47rd_oJnl_k7Xh2nbM40PkcHUg5c_LZY2GyzWxjN5c6/exec
   SHEETS_PNL_URL=https://script.google.com/a/macros/siamoon.com/s/AKfycbzPbN6ziXzXzU7mFSl8RkSic47rd_oJnl_k7Xh2nbM40PkcHUg5c_LZY2GyzWxjN5c6/exec
   SHEETS_BALANCES_GET_URL=https://script.google.com/a/macros/siamoon.com/s/AKfycbzPbN6ziXzXzU7mFSl8RkSic47rd_oJnl_k7Xh2nbM40PkcHUg5c_LZY2GyzWxjN5c6/exec
   SHEETS_BALANCES_APPEND_URL=https://script.google.com/a/macros/siamoon.com/s/AKfycbzPbN6ziXzXzU7mFSl8RkSic47rd_oJnl_k7Xh2nbM40PkcHUg5c_LZY2GyzWxjN5c6/exec
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Test in Production**
   - Register new user at bookmate.siamoon.com
   - Verify isolation

4. **Update Mobile Team**
   - Share new Apps Script deployment ID
   - Confirm they're using same spreadsheet provisioning logic
