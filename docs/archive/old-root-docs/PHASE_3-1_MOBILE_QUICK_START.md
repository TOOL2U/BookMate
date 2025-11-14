# Mobile Integration Quick Start

## 🎯 Goal
Make the BookMate mobile app use the correct account configuration (URL, secret) for each user instead of hardcoded values.

## 📦 What You Get

1. **Type Definition** - `MobileAccountConfig` interface
2. **Fetch Function** - `fetchAccountConfig()` from Firestore
3. **React Context** - `AccountProvider` + `useAccountConfig()` hook
4. **UI Components** - Loading and error screens
5. **Example Usage** - How to update existing transaction code

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Dependencies

```bash
expo install @react-native-async-storage/async-storage
```

### Step 2: Add Files

Copy these files into your project:

```
src/
├── types/
│   └── account.ts                    # MobileAccountConfig type
├── services/
│   └── accountService.ts             # fetchAccountConfig()
├── contexts/
│   └── AccountContext.tsx            # AccountProvider + hook
└── components/
    ├── AccountLoadingScreen.tsx      # Loading UI
    ├── AccountErrorScreen.tsx        # Error UI
    └── AccountProtectedScreen.tsx    # Wrapper component
```

### Step 3: Wrap Your App

```typescript
// App.tsx
import { AccountProvider } from './contexts/AccountContext';

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>  {/* ← Add this */}
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AccountProvider>
    </AuthProvider>
  );
}
```

### Step 4: Protect Your Screens

```typescript
// Any screen that needs account config
import { AccountProtectedScreen } from '../components/AccountProtectedScreen';

export function TransactionScreen() {
  return (
    <AccountProtectedScreen>
      <TransactionScreenContent />
    </AccountProtectedScreen>
  );
}
```

### Step 5: Use the Config

```typescript
// Inside your screen component
import { useAccountConfig } from '../contexts/AccountContext';

function TransactionScreenContent() {
  const { config } = useAccountConfig();
  
  // Use config.scriptUrl and config.scriptSecret
  const sendTransaction = async () => {
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        secret: config.scriptSecret,
        // ... your transaction data
      }),
    });
  };
}
```

## 🔄 How It Works

```
User logs in
     ↓
AccountProvider listens to auth state
     ↓
Fetches account from Firestore (by userEmail)
     ↓
Stores in React Context + AsyncStorage
     ↓
All screens use useAccountConfig() hook
     ↓
Transactions sent to correct scriptUrl with correct scriptSecret
```

## 📱 User Experience

### Success Flow
```
1. User logs in
2. App shows: "Loading your BookMate account…" (1-2 seconds)
3. Account loads successfully
4. User can add transactions
```

### Error Flow
```
1. User logs in
2. App shows: "Loading your BookMate account…"
3. No account found in Firestore
4. App shows: "Account not configured. Please contact support."
5. User can tap "Retry" button
```

## 🔧 Update Existing Code

### Before (Hardcoded)
```typescript
const SCRIPT_URL = 'https://script.google.com/macros/s/ABC123/exec';
const SCRIPT_SECRET = 'my-secret-key';

fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    secret: SCRIPT_SECRET,
    // ...
  }),
});
```

### After (Config-based)
```typescript
import { useAccountConfig } from '../contexts/AccountContext';

const { config } = useAccountConfig();

fetch(config.scriptUrl, {
  method: 'POST',
  body: JSON.stringify({
    secret: config.scriptSecret,
    // ...
  }),
});
```

## ✅ Testing Checklist

- [ ] User logs in → Config loads
- [ ] Transaction sent to correct URL
- [ ] Secret authenticates correctly
- [ ] Cached config loads on app restart
- [ ] Error screen shows if no account
- [ ] Retry button works
- [ ] Config cleared on logout

## 🔒 Security

✅ **DO:**
- Use config.scriptSecret from context
- Clear on logout
- Cache in AsyncStorage

❌ **DON'T:**
- Log scriptSecret to console
- Hardcode URLs or secrets
- Expose secret in error messages

## 📊 Account Config Fields

```typescript
{
  accountId: "siamoon.com",
  companyName: "Siamoon Properties",
  userEmail: "user@example.com",
  sheetId: "1ABC...XYZ",
  scriptUrl: "https://script.google.com/macros/s/ABC123/exec",
  scriptSecret: "super-secret-key-123",
  lastConnectionTestAt: "2025-01-01T10:00:00Z",
  lastConnectionTestStatus: "success",
  lastConnectionTestMessage: "Connection successful"
}
```

## 🎨 UI States

### Loading
```
┌──────────────────────────┐
│          🔄              │
│ Loading your BookMate    │
│ account…                 │
│                          │
│ Please wait              │
└──────────────────────────┘
```

### Error
```
┌──────────────────────────┐
│          ⚠️              │
│ Account not configured   │
│                          │
│ No BookMate account is   │
│ configured for this user.│
│ Please contact support.  │
│                          │
│      [ Retry ]           │
│                          │
│ If this problem persists,│
│ please contact support.  │
└──────────────────────────┘
```

### Success
```
┌──────────────────────────┐
│ Add Transaction          │
│ Account: Siamoon Props   │
│                          │
│ Description: [______]    │
│ Amount: [______]         │
│                          │
│ [ Send Transaction ]     │
└──────────────────────────┘
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "No account found" | Check user's email matches Firestore account.userEmail |
| "Account incomplete" | Ensure scriptUrl and scriptSecret are set in Firestore |
| Config not loading | Check Firebase permissions, verify Firestore rules |
| Cached config stale | Config refreshes automatically in background |

## 📚 API Reference

### Hook
```typescript
const { config, loading, error, refresh, clear } = useAccountConfig();
```

### Config Type
```typescript
interface MobileAccountConfig {
  accountId: string;
  companyName: string;
  userEmail: string;
  sheetId: string;
  scriptUrl: string;
  scriptSecret: string;
  lastConnectionTestAt?: string;
  lastConnectionTestStatus?: 'success' | 'error';
  lastConnectionTestMessage?: string;
}
```

### Fetch Function
```typescript
async function fetchAccountConfig(): Promise<MobileAccountConfig | null>
```

## 🎯 Next Steps

After implementing Phase 3-1:

1. **Test with real users** - Verify config loads correctly
2. **Monitor errors** - Check Firestore permissions
3. **Optimize caching** - Adjust AsyncStorage strategy if needed
4. **Phase 3-2** - Add account switching (multiple accounts per user)
5. **Phase 3-3** - Add offline transaction queue

## 📞 Support

If you encounter issues:

1. Check console logs for `[AccountService]` and `[AccountContext]` messages
2. Verify Firestore has an account document for the user's email
3. Check Firebase Auth user.email is not null
4. Ensure Firestore rules allow reading `accounts` collection

---

**Ready to implement?** Follow the 5 steps above and refer to `PHASE_3-1_MOBILE_ACCOUNT_CONFIG.md` for full code examples!
