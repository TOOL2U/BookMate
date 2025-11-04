# 🔥 Firebase Phase 4 - Spark Plan (FREE) Implementation

## 🎯 Strategy: Zero-Cost Firebase Integration

**Architecture:**
- ✅ Firestore (Spark plan) - FREE for reads/writes (up to 50K/20K per day)
- ✅ Google Sheets + Apps Script - Write backend (unchanged)
- ✅ Next.js API routes - Sync logic (instead of Cloud Functions)
- ✅ Environment variables - Secrets (instead of Secret Manager)
- ❌ Cloud Functions - NOT NEEDED (saves upgrade cost)

**Result:** Full mobile integration, $0/month cost 🎉

---

## 📊 What This Gives You

### ✅ Capabilities
- Real-time Firestore reads for mobile team
- Direct writes via Apps Script → Google Sheets
- Manual sync from Sheets → Firestore (API endpoint)
- All collections accessible (balances, transactions, activityLogs)
- Open access (no auth for MVP testing)

### ⏭️ What We Skip (For Now)
- Automatic sync triggers (can add later with Blaze upgrade)
- Cloud Function secrets (use env vars instead)
- Outbound network from functions (use Next.js API routes)

---

## 🚀 Implementation Steps

### STEP 1: Deploy Firestore Rules (Open Access)

Already created! Let's deploy:

```bash
firebase deploy --only firestore:rules
```

This enables Firestore with open access (anyone can read/write for MVP).

---

### STEP 2: Update Firebase Admin SDK Configuration

We'll store Firebase credentials in `.env.local` instead of Secret Manager.

**Get Firebase Admin credentials:**

1. Go to: https://console.firebase.google.com/project/bookmate-bfd43/settings/serviceaccounts
2. Click "Generate new private key"
3. Download JSON file
4. Copy values to `.env.local`

**Add to `.env.local`:**

```env
# Firebase Admin SDK (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=bookmate-bfd43
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bookmate-bfd43.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

### STEP 3: Create Firestore Collections (Manual Setup)

Go to Firebase Console → Firestore:
https://console.firebase.google.com/project/bookmate-bfd43/firestore

**Click "Start collection"** for each:

#### 1. Collection: `balances`
```
Document ID: "Cash - Family" (example)
Fields:
  accountName: "Cash - Family"
  currentBalance: 0
  currency: "THB"
  openingBalance: 0
  inflow: 0
  outflow: 0
  updatedAt: (timestamp) now
  lastSyncedBy: "manual"
```

#### 2. Collection: `transactions`
```
Document ID: Auto-generated
Fields:
  fromAccount: "Cash - Family"
  toAccount: "Bank - SCB"
  amount: 5000
  note: "Test transaction"
  timestamp: (timestamp) now
  user: "admin"
  currency: "THB"
```

#### 3. Collection: `activityLogs`
```
Document ID: Auto-generated
Fields:
  type: "test"
  actor: "setup"
  timestamp: (timestamp) now
  severity: "info"
  details: (map) { message: "Firebase setup complete" }
```

#### 4. Collection: `aiChecks`
```
Document ID: Auto-generated
Fields:
  timestamp: (timestamp) now
  accountName: "Test"
  status: "ok"
  discrepancy: 0
  sheetsBalance: 0
  firestoreBalance: 0
```

---

### STEP 4: Create Sync API Endpoint (Instead of Cloud Function)

This endpoint syncs balances from Google Sheets → Firestore.
Mobile team or cron job can call it manually.

**File:** `app/api/firebase/sync-balances/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Manual Sync: Google Sheets → Firestore
 * Call this endpoint to sync latest balances from Google Sheets to Firestore
 * 
 * Usage:
 * POST /api/firebase/sync-balances
 * 
 * Optional: Add auth header for security
 */
export async function POST(request: Request) {
  try {
    // Fetch balances from webapp API (which gets from Google Sheets)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/balance/by-property`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Balance API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.propertyBalances || !Array.isArray(data.propertyBalances)) {
      return NextResponse.json({
        ok: false,
        error: 'No property balances found'
      }, { status: 400 });
    }

    // Batch write to Firestore
    const batch = adminDb.batch();
    let updateCount = 0;

    for (const balance of data.propertyBalances) {
      if (!balance.property) continue;

      const docRef = adminDb.collection('balances').doc(balance.property);

      batch.set(docRef, {
        accountName: balance.property,
        currentBalance: balance.balance || 0,
        currency: 'THB',
        updatedAt: new Date().toISOString(),
        lastSyncedBy: 'api',
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });

      updateCount++;
    }

    await batch.commit();

    // Log activity
    await adminDb.collection('activityLogs').add({
      type: 'balance_sync',
      actor: 'api',
      timestamp: new Date().toISOString(),
      severity: 'info',
      details: {
        balancesUpdated: updateCount,
        source: 'manual_api_call',
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Balances synced successfully',
      balancesUpdated: updateCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET: Check last sync status
 */
export async function GET() {
  try {
    // Get last activity log
    const snapshot = await adminDb
      .collection('activityLogs')
      .where('type', '==', 'balance_sync')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        ok: true,
        lastSync: null,
        message: 'No sync activity yet',
      });
    }

    const lastSync = snapshot.docs[0].data();

    return NextResponse.json({
      ok: true,
      lastSync: {
        timestamp: lastSync.timestamp,
        balancesUpdated: lastSync.details?.balancesUpdated || 0,
      },
    });

  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

### STEP 5: Create Firestore Read API Endpoint

Simple endpoint for testing Firestore reads.

**File:** `app/api/firebase/balances/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Get all balances from Firestore
 * Used by mobile team for testing
 */
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('balances')
      .orderBy('currentBalance', 'desc')
      .get();

    const balances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      ok: true,
      count: balances.length,
      balances,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

### STEP 6: Get Firebase Config for Mobile Team

**Go to Firebase Console:**
https://console.firebase.google.com/project/bookmate-bfd43/settings/general

**Scroll to "Your apps" → Click "Add app" → Select Web (</> icon)**

**Register app:**
- App nickname: `BookMate Mobile`
- Click "Register app"
- Copy the config object

**Firebase config looks like:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "bookmate-bfd43.firebaseapp.com",
  projectId: "bookmate-bfd43",
  storageBucket: "bookmate-bfd43.firebasestorage.app",
  messagingSenderId: "587404267732",
  appId: "1:587404267732:web:..."
};
```

**Share this config with mobile team.**

---

## 🧪 Testing

### Test 1: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

Expected: ✔ Deploy complete!

### Test 2: Create Collections
Create 4 collections manually in Firebase Console (see STEP 3)

### Test 3: Test Firestore Read API
```bash
curl http://localhost:3000/api/firebase/balances
```

Expected:
```json
{
  "ok": true,
  "count": 1,
  "balances": [
    {
      "id": "Cash - Family",
      "accountName": "Cash - Family",
      "currentBalance": 0
    }
  ]
}
```

### Test 4: Test Manual Sync
```bash
curl -X POST http://localhost:3000/api/firebase/sync-balances
```

Expected:
```json
{
  "ok": true,
  "message": "Balances synced successfully",
  "balancesUpdated": 5
}
```

### Test 5: Mobile Team Tests Firestore
Mobile team uses Firebase config to:
1. Connect to Firestore
2. Read from `balances` collection
3. Listen to real-time updates
4. Write to `transactions` collection

---

## 📱 Mobile Team Integration Guide

**Provide to mobile team:**

### 1. Firebase Config
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "bookmate-bfd43.firebaseapp.com",
  projectId: "bookmate-bfd43",
  // ... (from Firebase Console)
};
```

### 2. Collections Available
- `balances` - Read account balances
- `transactions` - Read/write transactions
- `activityLogs` - Read system events
- `aiChecks` - Read AI drift checks

### 3. Example Code (React Native / Flutter)

**Read balances:**
```javascript
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const balancesRef = collection(db, 'balances');
const q = query(balancesRef, orderBy('currentBalance', 'desc'));
const snapshot = await getDocs(q);

const balances = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Real-time listener:**
```javascript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(balancesRef, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'modified') {
      console.log('Balance updated:', change.doc.data());
    }
  });
});
```

### 4. Sync Endpoint
When mobile app needs fresh data:
```javascript
await fetch('https://accounting.siamoon.com/api/firebase/sync-balances', {
  method: 'POST'
});
```

---

## 🔄 Sync Workflow

### Option 1: Manual Sync
Call API endpoint when needed:
```bash
curl -X POST https://accounting.siamoon.com/api/firebase/sync-balances
```

### Option 2: Scheduled Sync (Vercel Cron)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/firebase/sync-balances",
      "schedule": "*/15 * * * *"
    }
  ]
}
```
Syncs every 15 minutes (free on Vercel)

### Option 3: On-Demand from Mobile
Mobile app calls sync endpoint before fetching balances

---

## 💰 Cost Analysis

### Spark Plan Limits (FREE)
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ 10 GB/month outbound data

### Estimated Usage
- Sync 10 accounts every 15 min = 960 writes/day ✅
- Mobile reads 100 times/day = 100 reads/day ✅
- Well within free tier!

### Upgrade Trigger
Only upgrade to Blaze if:
- Need Cloud Function triggers (automatic sync)
- Exceed 50K reads/day
- Need outbound network from functions
- Want scheduled functions

---

## ✅ Deployment Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Add Firebase Admin creds to `.env.local`
- [ ] Create 4 Firestore collections in console
- [ ] Create sync API endpoint (`app/api/firebase/sync-balances/route.ts`)
- [ ] Create read API endpoint (`app/api/firebase/balances/route.ts`)
- [ ] Test local: `curl http://localhost:3000/api/firebase/balances`
- [ ] Test sync: `curl -X POST http://localhost:3000/api/firebase/sync-balances`
- [ ] Get Firebase config from console
- [ ] Share config with mobile team
- [ ] Test mobile team can read Firestore
- [ ] (Optional) Add Vercel cron for auto-sync

---

## 🚀 Next Steps After This Works

### Later (When Ready)
1. **Add Authentication**
   - Enable Firebase Auth
   - Update Firestore rules
   - Protect API endpoints

2. **Upgrade to Blaze** (if needed)
   - Automatic sync with Cloud Functions
   - Real-time triggers
   - AI consistency checks

3. **Advanced Features**
   - AI drift detection
   - Automated alerts
   - Scheduled reconciliation

---

## 📊 Comparison

| Feature | Spark (FREE) | Blaze ($0-2/mo) |
|---------|--------------|-----------------|
| Firestore reads/writes | ✅ Limited | ✅ Unlimited |
| Manual sync API | ✅ Yes | ✅ Yes |
| Automatic triggers | ❌ No | ✅ Yes |
| Cloud Functions | ❌ No | ✅ Yes |
| Secret Manager | ❌ No | ✅ Yes |
| Cost | $0 | ~$0-2 |

**Recommendation:** Start with Spark, upgrade when you need automation.

---

**Status:** Ready to implement
**Cost:** $0/month
**Time:** 30 minutes
**Next:** Deploy Firestore rules and create API endpoints
