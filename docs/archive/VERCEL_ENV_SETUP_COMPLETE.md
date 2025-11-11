# Vercel Environment Variable Setup - Complete Guide

## Summary

Your BookMate app uses **TWO separate credential systems**:

1. **Firebase Admin SDK** (Firestore) - for share links, reports storage
2. **Google Sheets API** - for reading/writing spreadsheet data

## ✅ Build Status

**Build is succeeding** - The warnings about `google-credentials.json` are **expected and harmless**:
- These are compile-time warnings for `require()` statements
- At runtime, the code checks for the file and falls back to env vars
- In production (Vercel), the env var is used
- In local dev, you can use either the file OR env var

**No code changes needed** - Your existing code is correct!

## 🔧 Required Environment Variables in Vercel

### Firebase Admin SDK (Firestore)

These are for accessing Firestore (share links, activity logs, etc.):

```
FIREBASE_ADMIN_PROJECT_ID=bookmate-bfd43
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN...
```

**Source**: Use the values from `NEW_VERCEL_KEY.txt` (already prepared)

### Google Sheets API

This is for reading/writing your Google Sheets:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"bookmate-bfd43",...}
```

**Source**: Use the **entire JSON from** `bookmate-bfd43-firebase-adminsdk-fbsvc-7fdcc88f27.json` as a **single-line string**.

To create the single-line JSON:

```bash
cat bookmate-bfd43-firebase-adminsdk-fbsvc-7fdcc88f27.json | jq -c .
```

Or manually: Copy the entire JSON file content and remove all newlines/formatting.

### Other Required Variables

```
GOOGLE_SHEET_ID=<your-sheet-id>
```

## 📋 Step-by-Step Vercel Setup

1. **Go to**: https://vercel.com/tool2us-projects/bookmate/settings/environment-variables

2. **Add/Update Firebase Variables**:
   - `FIREBASE_ADMIN_PROJECT_ID` → `bookmate-bfd43`
   - `FIREBASE_ADMIN_CLIENT_EMAIL` → `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`
   - `FIREBASE_ADMIN_PRIVATE_KEY` → Open `NEW_VERCEL_KEY.txt`, select all, copy, paste

3. **Add/Update Google Sheets Variable**:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` → Run the `jq` command above or manually format the JSON as single line

4. **Set Environment**: Production (and optionally Preview/Development)

5. **Redeploy**: Go to deployments → Click latest → Redeploy

## 🔍 How to Verify

After deployment:

1. **Check build logs**: No more "Module not found: google-credentials.json" warnings ✅
2. **Test share links**: Create a report → Generate share link → Should work without Firestore errors ✅
3. **Test categories**: Settings → Manage properties/payments → Should load without errors ✅

## 🔐 Security Note

⚠️ **IMPORTANT**: The private key in this chat is now exposed. After setup, **rotate the service account key**:

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=bookmate-bfd43
2. Find: `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`
3. Click → "Keys" tab → "Add Key" → "Create new key" → JSON
4. Download the new key
5. Update both Vercel env vars with new values
6. Delete the old key in Google Cloud Console

## 📝 Code Pattern

Your Firebase admin initialization (already correct):

```typescript
// lib/firebase/admin.ts
import { initializeApp, cert } from 'firebase-admin/app';

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});
```

Your Google Sheets pattern (in all category routes):

```typescript
function getCredentials() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not found');
  }
  return JSON.parse(serviceAccountKey);
}
```

## ✨ What This Fixes

1. ⚠️ Build warnings about `google-credentials.json` are harmless (compile-time only, runtime falls back to env vars)
2. ✅ No more runtime errors about "illegal characters" in Firestore paths
3. ✅ Share links will work (Firestore access fixed)
4. ✅ Category management will work (Google Sheets access fixed)
5. ✅ Proper separation of Firebase vs Google Sheets credentials
6. ✅ Local dev still works with `config/google-credentials.json` file

## 🚀 Next Steps

1. Commit and push these code changes
2. Update Vercel environment variables as described above
3. Redeploy
4. Test all features
5. Rotate the service account key for security

---

**Last Updated**: November 10, 2025  
**Status**: Ready for deployment
