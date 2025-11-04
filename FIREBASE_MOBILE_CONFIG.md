# Firebase Configuration for Mobile Team

## 📱 Firebase SDK Configuration

Share this configuration with your mobile development team to connect to Firestore.

### Web/React Native Configuration

```javascript
// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bookmate-bfd43",
  appId: "1:587404267732:web:71dc5aac898838f5aaab41",
  storageBucket: "bookmate-bfd43.firebasestorage.app",
  apiKey: "AIzaSyCHwsaPkzH0ZSfZq3VWPa0NJ-IhS3ynzsk",
  authDomain: "bookmate-bfd43.firebaseapp.com",
  messagingSenderId: "587404267732",
  measurementId: "G-SE3FMGGD4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
```

## 📊 Firestore Collections

### 1. `balances` Collection

**Purpose:** Real-time account balances for all properties

**Document ID:** Account name (e.g., "Property A - Main Account")

**Schema:**
```javascript
{
  accountName: string,        // "Property A - Main Account"
  currentBalance: number,      // 5000.00
  lastUpdated: timestamp,      // Auto-generated server timestamp
  transactions: number,        // Total transaction count
  propertyId: string,          // Property identifier
  accountType: string,         // "checking", "savings", etc.
  metadata: {
    createdBy: string,
    version: string
  }
}
```

**Example Query:**
```javascript
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Get all balances, ordered by current balance (highest first)
const q = query(
  collection(db, 'balances'),
  orderBy('currentBalance', 'desc')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const balances = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log('Balances:', balances);
});
```

### 2. `transactions` Collection

**Purpose:** Transaction history across all accounts

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  accountName: string,         // "Property A - Main Account"
  amount: number,              // 1500.00 (positive or negative)
  type: string,                // "income" or "expense"
  category: string,            // "rent", "utilities", "maintenance", etc.
  description: string,         // Transaction description
  date: timestamp,             // Transaction date
  createdAt: timestamp,        // When added to Firestore
  processedBy: string,         // "user", "ai", "sync"
  confidence: number,          // 0.0 - 1.0 (AI confidence)
  status: string              // "completed", "pending", "failed"
}
```

**Example Query:**
```javascript
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

// Get recent transactions for a specific account
const q = query(
  collection(db, 'transactions'),
  where('accountName', '==', 'Property A - Main Account'),
  orderBy('date', 'desc'),
  limit(50)
);

const snapshot = await getDocs(q);
const transactions = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### 3. `activityLogs` Collection

**Purpose:** System activity and audit trail

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  action: string,              // "sync_completed", "balance_updated", etc.
  timestamp: timestamp,        // Server timestamp
  details: object,             // Action-specific details
  userId: string,              // User or "system"
  status: string              // "success", "error", "warning"
}
```

### 4. `aiChecks` Collection

**Purpose:** AI verification and drift detection logs

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  checkType: string,           // "balance_verification", "anomaly_detection"
  timestamp: timestamp,        // When check was performed
  accountName: string,         // Account being checked
  expectedBalance: number,     // Expected value
  actualBalance: number,       // Actual value
  drift: number,              // Difference (expected - actual)
  status: string,             // "passed", "failed", "warning"
  confidence: number,         // 0.0 - 1.0
  metadata: object            // Additional context
}
```

## 🔄 Manual Sync API

Since we're using the Spark (free) plan, syncing from Google Sheets to Firestore is **manual** via API endpoint.

### Trigger Sync

```bash
# From your webapp (when deployed)
curl -X POST https://your-app.vercel.app/api/firebase/sync-balances

# Local development
curl -X POST http://localhost:3000/api/firebase/sync-balances
```

**Response:**
```json
{
  "ok": true,
  "message": "Balances synced successfully",
  "balancesUpdated": 15,
  "timestamp": "2025-11-04T10:30:00Z"
}
```

### Check Last Sync

```bash
curl http://localhost:3000/api/firebase/sync-balances
```

**Response:**
```json
{
  "ok": true,
  "lastSync": {
    "timestamp": "2025-11-04T10:30:00Z",
    "balancesUpdated": 15,
    "status": "success"
  }
}
```

## 📖 Usage Examples

### Real-time Balance Updates

```javascript
import { doc, onSnapshot } from 'firebase/firestore';

// Listen to a specific account balance
const accountRef = doc(db, 'balances', 'Property A - Main Account');
const unsubscribe = onSnapshot(accountRef, (doc) => {
  if (doc.exists()) {
    console.log('Current balance:', doc.data().currentBalance);
  }
});

// Don't forget to unsubscribe when done
// unsubscribe();
```

### Add Transaction

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const newTransaction = {
  accountName: 'Property A - Main Account',
  amount: 250.00,
  type: 'expense',
  category: 'maintenance',
  description: 'Plumbing repair',
  date: new Date(),
  createdAt: serverTimestamp(),
  processedBy: 'mobile-app',
  confidence: 1.0,
  status: 'completed'
};

const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
console.log('Transaction added with ID:', docRef.id);
```

### Query by Date Range

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

// Get transactions from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const q = query(
  collection(db, 'transactions'),
  where('date', '>=', thirtyDaysAgo),
  orderBy('date', 'desc')
);

const snapshot = await getDocs(q);
const recentTransactions = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

## 🔐 Security Rules (Current: Open Access - MVP Only)

**⚠️ IMPORTANT:** Current Firestore rules allow open read/write access for MVP testing.

**Before production, update rules in `firestore.rules` to:**
- Require authentication
- Implement proper user permissions
- Validate data schemas

```javascript
// Example production rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /balances/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /transactions/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📦 Install Firebase SDK

### React Native
```bash
npm install firebase
# or
yarn add firebase
```

### Flutter
```yaml
dependencies:
  firebase_core: ^2.24.0
  cloud_firestore: ^4.13.0
```

## 🔗 Useful Links

- **Firebase Console:** https://console.firebase.google.com/project/bookmate-bfd43
- **Firestore Data:** https://console.firebase.google.com/project/bookmate-bfd43/firestore
- **Project Settings:** https://console.firebase.google.com/project/bookmate-bfd43/settings/general

## 🚀 Next Steps

1. **Install Firebase SDK** in your mobile app
2. **Copy the config** above into your app
3. **Test reading balances** from Firestore
4. **Test real-time listeners** for live updates
5. **Trigger manual sync** when you need fresh data from Google Sheets

## 💡 Tips

- Use real-time listeners (`onSnapshot`) for live data updates
- Implement offline persistence for better UX:
  ```javascript
  import { enableIndexedDbPersistence } from 'firebase/firestore';
  enableIndexedDbPersistence(db);
  ```
- Call the sync API endpoint periodically (e.g., on app launch) to keep data fresh
- Monitor Firestore usage in Firebase Console to stay within free tier limits

## 📊 Spark Plan Limits (FREE)

- 50,000 reads/day
- 20,000 writes/day  
- 1 GB storage
- 10 GB/month network egress

These limits are more than sufficient for MVP testing and early production use.

---

**Questions?** Contact the webapp team or check `FIREBASE_SPARK_IMPLEMENTATION.md` for more details.
