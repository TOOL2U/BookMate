# 🔥 Firebase Integration - Phase 4 Setup Guide

## ✅ What's Been Created

### Configuration Files
- ✅ `firebase.json` - Firebase project configuration
- ✅ `.firebaserc` - Project ID mapping (bookmate-bfd43)
- ✅ `firestore.rules` - Open access rules (MVP testing mode)
- ✅ `firestore.indexes.json` - Firestore indexes

### Cloud Functions
- ✅ `functions/package.json` - Node dependencies
- ✅ `functions/tsconfig.json` - TypeScript configuration
- ✅ `functions/src/firebase.ts` - Firebase Admin initialization
- ✅ `functions/src/secrets.ts` - Secret parameter definitions
- ✅ `functions/src/onTransactionWrite.ts` - Transaction sync trigger
- ✅ `functions/src/index.ts` - Main export file

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Firebase Functions Dependencies

```bash
cd functions
npm install
cd ..
```

This installs:
- `firebase-admin` - Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `node-fetch` - HTTP client
- `typescript` - TypeScript compiler

---

### Step 2: Configure Firebase Secrets

These secrets are stored in Google Cloud Secret Manager and accessed by Cloud Functions.

```bash
# Google Sheet ID
firebase functions:secrets:set GOOGLE_SHEET_ID --data "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"

# Webhook Secret (same as Apps Script)
firebase functions:secrets:set SHEETS_WEBHOOK_SECRET --data "VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8="

# Base URL (production URL after Vercel deployment)
firebase functions:secrets:set BASE_URL --data "https://accounting.siamoon.com"

# OpenAI API Key (for AI features)
firebase functions:secrets:set OPENAI_API_KEY --data "YOUR_OPENAI_API_KEY_HERE"
```

**Note:** If you're testing locally first, use `http://localhost:3000` for BASE_URL initially.

---

### Step 3: Deploy Firestore Rules

Deploy the open access rules (MVP testing mode):

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔  Deploy complete!

Resource: firestore (rules)
Status: DEPLOYED
```

**⚠️ Important:** These rules allow ANYONE to read/write. This is intentional for MVP testing. Before production, update `firestore.rules` with secure authentication rules.

---

### Step 4: Build and Deploy Cloud Functions

```bash
# Build TypeScript
cd functions
npm run build
cd ..

# Deploy functions
firebase deploy --only functions
```

Expected output:
```
✔  functions[onTransactionWrite] Successful create operation
✔  Deploy complete!

Function URL: (none - this is a Firestore trigger)
```

This deploys the `onTransactionWrite` function which automatically syncs balances to Firestore whenever a transaction document changes.

---

### Step 5: Create Firestore Collections

Go to Firebase Console → Firestore Database:
https://console.firebase.google.com/project/bookmate-bfd43/firestore

**Create these collections** (add 1 test document to each):

#### 1. `balances`
```json
Document ID: "Test Property"
Fields:
{
  "accountName": "Test Property",
  "currentBalance": 0,
  "currency": "THB",
  "updatedAt": "2025-11-04T12:00:00Z",
  "lastSyncedBy": "manual"
}
```

#### 2. `transactions`
```json
Document ID: Auto-generated
Fields:
{
  "fromAccount": "Cash - Family",
  "toAccount": "Bank - SCB",
  "amount": 10000,
  "note": "Test transaction",
  "timestamp": "2025-11-04T12:00:00Z",
  "user": "admin"
}
```

#### 3. `activityLogs`
```json
Document ID: Auto-generated
Fields:
{
  "type": "test",
  "actor": "setup",
  "timestamp": "2025-11-04T12:00:00Z",
  "severity": "info",
  "details": { "message": "Firebase setup complete" }
}
```

#### 4. `aiChecks` (optional)
```json
Document ID: Auto-generated
Fields:
{
  "timestamp": "2025-11-04T12:00:00Z",
  "accountName": "Test",
  "status": "ok",
  "discrepancy": 0
}
```

---

### Step 6: Test the Integration

#### Test 1: Manual Transaction Add
1. Go to Firestore Console
2. Add a new document to `transactions`:
   ```json
   {
     "fromAccount": "Cash - Family",
     "toAccount": "Bank - SCB",
     "amount": 5000,
     "note": "Test sync",
     "timestamp": "2025-11-04T12:00:00Z",
     "user": "test"
   }
   ```
3. Wait 5-10 seconds
4. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only onTransactionWrite
   ```
5. Check `balances` collection - should see updated balances
6. Check `activityLogs` - should see sync event

#### Test 2: Verify Webapp Can Read Balances

Create a test API endpoint to verify Firestore access from webapp:

```bash
# Create test file
cat > app/api/firebase-test/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('balances').limit(5).get();
    const balances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      ok: true,
      count: balances.length,
      balances
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
EOF

# Test the endpoint
curl http://localhost:3000/api/firebase-test
```

Expected response:
```json
{
  "ok": true,
  "count": 1,
  "balances": [
    {
      "id": "Test Property",
      "accountName": "Test Property",
      "currentBalance": 0,
      "currency": "THB"
    }
  ]
}
```

---

### Step 7: Verify Cloud Function is Working

Check Cloud Function logs:

```bash
# View recent logs
firebase functions:log --only onTransactionWrite --limit 10

# Stream live logs
firebase functions:log --only onTransactionWrite --follow
```

Look for:
- ✅ "Transaction created/updated"
- ✅ "Fetching balances from: ..."
- ✅ "Found X property balances"
- ✅ "Successfully synced X balances to Firestore"

---

## 📱 Mobile Team Integration

### Firebase Configuration for Mobile

Provide this configuration to your mobile team:

```javascript
// Firebase Config (Web - also works for mobile)
const firebaseConfig = {
  apiKey: "AIzaSyCNu...", // Get from Firebase Console
  authDomain: "bookmate-bfd43.firebaseapp.com",
  projectId: "bookmate-bfd43",
  storageBucket: "bookmate-bfd43.appspot.com",
  messagingSenderId: "587404267732",
  appId: "1:587404267732:web:..." // Get from Firebase Console
};
```

**To get these values:**
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</> icon)
4. Register app name: "BookMate Mobile"
5. Copy the config object

### Collections Available

Mobile team can read/write to:

| Collection | Purpose | Example Query |
|------------|---------|---------------|
| `balances` | Current account balances | `db.collection('balances').orderBy('currentBalance', 'desc').get()` |
| `transactions` | Transaction history | `db.collection('transactions').orderBy('timestamp', 'desc').limit(50).get()` |
| `activityLogs` | System activity feed | `db.collection('activityLogs').where('type', '==', 'balance_sync').get()` |
| `aiChecks` | AI consistency checks | `db.collection('aiChecks').orderBy('timestamp', 'desc').get()` |

### Real-time Listeners (Mobile)

```javascript
// Flutter / React Native / iOS / Android
db.collection('balances')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New balance: ', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Updated balance: ', change.doc.data());
      }
    });
  });
```

---

## 🧪 Complete Test Flow

### End-to-End Test Scenario

1. **Add transaction in webapp** (via existing UI or API)
   - POST to `/api/v9/transactions` or similar
   - Transaction gets saved to Google Sheets

2. **Manually add to Firestore** (simulating mobile app)
   - Mobile app adds same transaction to Firestore `transactions` collection
   
3. **Cloud Function triggers**
   - `onTransactionWrite` detects the new transaction
   - Calls webapp `/api/balance/by-property`
   - Fetches latest balances from Google Sheets
   - Updates Firestore `balances` collection

4. **Mobile app gets real-time update**
   - Firestore listener fires
   - UI updates with new balance
   - No polling needed

---

## 🔧 Troubleshooting

### Issue: "Permission denied" when deploying functions

**Solution:**
```bash
firebase login --reauth
firebase use bookmate-bfd43
```

### Issue: "Secret not found" error in function logs

**Solution:**
```bash
# List current secrets
firebase functions:secrets:access GOOGLE_SHEET_ID

# If missing, set it:
firebase functions:secrets:set GOOGLE_SHEET_ID --data "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"

# Redeploy functions
firebase deploy --only functions
```

### Issue: Function times out calling webapp API

**Solution:**
- Check BASE_URL secret is correct
- Verify webapp is accessible from internet (not localhost)
- Check webapp API endpoint returns 200 status
- Increase function timeout in `onTransactionWrite.ts`:
  ```typescript
  .runWith({ timeoutSeconds: 120 })
  ```

### Issue: Balances not syncing to Firestore

**Solution:**
1. Check Cloud Function logs:
   ```bash
   firebase functions:log --only onTransactionWrite
   ```
2. Verify webapp `/api/balance/by-property` works:
   ```bash
   curl https://accounting.siamoon.com/api/balance/by-property
   ```
3. Check Firestore rules allow writes
4. Verify function has correct permissions

---

## 📊 Monitoring

### View Function Metrics

Firebase Console → Functions → onTransactionWrite:
- Invocations count
- Execution time
- Error rate
- Active instances

### View Firestore Usage

Firebase Console → Firestore → Usage:
- Document reads/writes
- Storage size
- Index usage

---

## 🎯 Success Criteria

- [x] Firebase project configured (bookmate-bfd43)
- [x] Firestore rules deployed (open access)
- [ ] Cloud Functions dependencies installed
- [ ] Secrets configured (4 secrets)
- [ ] Cloud Function deployed (`onTransactionWrite`)
- [ ] Firestore collections created (4 collections)
- [ ] Test transaction triggers function
- [ ] Balances sync to Firestore
- [ ] Webapp can read from Firestore
- [ ] Mobile team has Firebase config
- [ ] Real-time listeners working

---

## 🚀 Next Steps

Once Phase 4 is complete:

1. **Enable Firebase Auth** (Phase 5)
   - Add authentication
   - Update Firestore rules
   - Implement role-based access

2. **Add AI Consistency Checks** (Phase 6)
   - Create `onBalanceRecalc` function
   - Implement drift detection
   - Add automated alerts

3. **Scheduled Functions** (Phase 7)
   - Daily balance verification
   - Weekly AI reports
   - Monthly reconciliation

---

## 📞 Support

**Firebase Documentation:**
- Firestore: https://firebase.google.com/docs/firestore
- Cloud Functions: https://firebase.google.com/docs/functions
- Admin SDK: https://firebase.google.com/docs/admin/setup

**Project Resources:**
- Firebase Console: https://console.firebase.google.com/project/bookmate-bfd43
- Functions Logs: `firebase functions:log`
- Firestore Console: https://console.firebase.google.com/project/bookmate-bfd43/firestore

---

**Current Status:** Ready for deployment  
**Estimated Setup Time:** 30-45 minutes  
**Next Command:** `cd functions && npm install`
