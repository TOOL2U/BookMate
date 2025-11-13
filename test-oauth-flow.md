# Testing OAuth Flow Locally

## Current Status
✅ User registration works locally
✅ User login works locally
⏳ Spreadsheet creation requires OAuth flow

## To Test Spreadsheet Creation:

### Option 1: Manual OAuth Flow (RECOMMENDED)
1. Start local dev server: `npm run dev`
2. Open browser to: http://localhost:3000
3. Register/Login with test user
4. Click "Connect Google Sheets" or visit the OAuth URL from registration response
5. Complete Google OAuth authorization
6. Spreadsheet will be automatically created
7. Check user profile to see spreadsheetId populated

### Option 2: Direct API Test (Requires Valid OAuth Token)
If you have a valid Google OAuth access token, you can test directly:

```bash
curl -X POST http://localhost:3000/api/auth/google/provision \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "994be26e-d03a-431e-a8b2-8645e2c3c7ee",
    "accessToken": "YOUR_GOOGLE_ACCESS_TOKEN"
  }'
```

### OAuth Authorization URLs:
- Test User 1: http://localhost:3000/api/auth/google/authorize?userId=994be26e-d03a-431e-a8b2-8645e2c3c7ee&returnUrl=/dashboard
- Test User 2: http://localhost:3000/api/auth/google/authorize?userId=872e613a-b646-45a3-a814-23a44d704c76&returnUrl=/dashboard

## Next Steps for Full Testing:
1. Open one of the OAuth URLs above in a browser
2. Sign in with your Google account
3. Authorize the app to access Google Sheets
4. The callback will automatically create the spreadsheet
5. Check the user's profile to verify spreadsheetId is set

## Verifying Spreadsheet After OAuth:
```bash
# Check Test User 1
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>" | jq '.user | {email, spreadsheetId, spreadsheetUrl}'
```
