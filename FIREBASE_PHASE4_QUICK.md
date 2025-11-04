# 🔥 Firebase Phase 4 - Quick Reference

## 📋 Project Info
- **Project ID:** `bookmate-bfd43`
- **Project Number:** `587404267732`
- **Region:** `us-central1` (default)
- **Mode:** MVP - Open Access (no auth)

## 🚀 Quick Deploy (5 Commands)

```bash
# 1. Set secrets
firebase functions:secrets:set GOOGLE_SHEET_ID --data "1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
firebase functions:secrets:set SHEETS_WEBHOOK_SECRET --data "VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8="
firebase functions:secrets:set BASE_URL --data "https://accounting.siamoon.com"
firebase functions:secrets:set OPENAI_API_KEY --data "sk-proj-..."

# 2. Deploy rules
firebase deploy --only firestore:rules

# 3. Build & deploy functions
cd functions && npm run build && cd ..
firebase deploy --only functions

# 4. View logs
firebase functions:log --only onTransactionWrite
```

## 📂 Firestore Collections

| Collection | Purpose | Fields |
|------------|---------|--------|
| `balances` | Current account balances | accountName, currentBalance, currency, updatedAt |
| `transactions` | Transaction history | fromAccount, toAccount, amount, note, timestamp |
| `activityLogs` | System events | type, actor, timestamp, severity, details |
| `aiChecks` | AI drift detection | accountName, discrepancy, status, timestamp |

## 🔧 Common Commands

```bash
# View function logs
firebase functions:log --only onTransactionWrite

# Stream logs live
firebase functions:log --only onTransactionWrite --follow

# List secrets
firebase functions:secrets:access GOOGLE_SHEET_ID

# Deploy everything
firebase deploy

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy only functions
firebase deploy --only functions

# Check current project
firebase use

# Switch project
firebase use bookmate-bfd43
```

## 📱 Mobile Team Config

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Get from console
  authDomain: "bookmate-bfd43.firebaseapp.com",
  projectId: "bookmate-bfd43",
  storageBucket: "bookmate-bfd43.appspot.com",
  messagingSenderId: "587404267732",
  appId: "1:587404267732:web:..." // Get from console
};
```

**Get config:**
1. https://console.firebase.google.com/project/bookmate-bfd43/settings/general
2. Scroll to "Your apps" → Add app → Web
3. Copy config

## 🧪 Testing

### Test 1: Add Transaction
```javascript
// In Firestore Console
{
  "fromAccount": "Cash - Family",
  "toAccount": "Bank - SCB",
  "amount": 5000,
  "note": "Test",
  "timestamp": "2025-11-04T12:00:00Z",
  "user": "test"
}
```

### Test 2: Check Function Triggered
```bash
firebase functions:log --only onTransactionWrite --limit 5
```

Look for:
- "Transaction created"
- "Fetching balances from: ..."
- "Successfully synced X balances"

### Test 3: Verify Balances Updated
```bash
# Check Firestore Console
# https://console.firebase.google.com/project/bookmate-bfd43/firestore
# Look in 'balances' collection
```

## 🔗 Important URLs

- **Firebase Console:** https://console.firebase.google.com/project/bookmate-bfd43
- **Firestore Database:** https://console.firebase.google.com/project/bookmate-bfd43/firestore
- **Functions Dashboard:** https://console.firebase.google.com/project/bookmate-bfd43/functions
- **Function Logs:** https://console.firebase.google.com/project/bookmate-bfd43/logs
- **Project Settings:** https://console.firebase.google.com/project/bookmate-bfd43/settings/general

## 🆘 Troubleshooting

### Function not triggering
```bash
# Check function deployed
firebase functions:list

# Check logs for errors
firebase functions:log --only onTransactionWrite

# Redeploy
firebase deploy --only functions
```

### Permission errors
```bash
# Re-authenticate
firebase login --reauth

# Check project
firebase use bookmate-bfd43
```

### Secret not found
```bash
# List all secrets
firebase functions:secrets:list

# Set missing secret
firebase functions:secrets:set SECRET_NAME --data "value"

# Redeploy functions
firebase deploy --only functions
```

## 📊 Files Created

```
BookMate-webapp/
├── firebase.json              # Firebase config
├── .firebaserc                # Project mapping
├── firestore.rules            # Security rules (open)
├── firestore.indexes.json     # Firestore indexes
├── FIREBASE_PHASE4_SETUP.md   # Full guide
├── FIREBASE_PHASE4_QUICK.md   # This file
└── functions/
    ├── package.json           # Dependencies
    ├── tsconfig.json          # TypeScript config
    ├── lib/                   # Compiled JS (auto-generated)
    └── src/
        ├── index.ts           # Main export
        ├── firebase.ts        # Admin SDK init
        ├── secrets.ts         # Secret definitions
        └── onTransactionWrite.ts  # Main function
```

## ✅ Deployment Checklist

- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Logged in (`firebase login`)
- [ ] Project selected (`firebase use bookmate-bfd43`)
- [ ] Functions dependencies installed (`cd functions && npm install`)
- [ ] Functions built (`npm run build`)
- [ ] Secrets configured (4 secrets)
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Test transaction added
- [ ] Function logs verified
- [ ] Balances synced to Firestore
- [ ] Mobile team has config

## 🎯 Success Metrics

After deployment:
- ✅ `onTransactionWrite` function visible in console
- ✅ Function triggers on transaction add/update
- ✅ Balances collection updates automatically
- ✅ Activity logs record sync events
- ✅ Mobile team can read Firestore data
- ✅ No authentication required (MVP mode)

---

**Quick Deploy:** `./scripts/deploy-firebase-phase4.sh`
**Full Guide:** `FIREBASE_PHASE4_SETUP.md`
