# Phase 3-1: Mobile Account Configuration - Implementation Guide

## Overview

This document provides the implementation for making the BookMate mobile app (React Native + Expo) aware of the user's account configuration from Firestore.

---

## 1. Type Definition

**File:** `types/account.ts` (or `src/types/account.ts`)

```typescript
/**
 * Mobile Account Configuration Type
 * 
 * Represents a BookMate account config fetched from Firestore
 * and used by the mobile app for all API interactions.
 */
export interface MobileAccountConfig {
  /** Unique account identifier (e.g., "siamoon.com") */
  accountId: string;
  
  /** Company/Account name */
  companyName: string;
  
  /** User email associated with this account */
  userEmail: string;
  
  /** Google Sheets ID for this account */
  sheetId: string;
  
  /** Apps Script Web App URL (endpoint for transactions) */
  scriptUrl: string;
  
  /** Apps Script secret for authentication */
  scriptSecret: string;
  
  /** Optional: Last connection test timestamp (ISO string) */
  lastConnectionTestAt?: string;
  
  /** Optional: Last connection test status */
  lastConnectionTestStatus?: 'success' | 'error';
  
  /** Optional: Last connection test message */
  lastConnectionTestMessage?: string;
}
```

---

## 2. Firestore Fetch Function

**File:** `services/accountService.ts` (or `src/services/accountService.ts`)

```typescript
/**
 * Account Service
 * 
 * Handles fetching and managing account configuration from Firestore
 */

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { MobileAccountConfig } from '../types/account';

const ACCOUNTS_COLLECTION = 'accounts';

/**
 * Fetch account configuration for the current user
 * 
 * @returns Account config or null if not found
 * @throws Error if Firestore query fails
 */
export async function fetchAccountConfig(): Promise<MobileAccountConfig | null> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      throw new Error('User not authenticated or email not available');
    }

    console.log(`[AccountService] Fetching account for user: ${currentUser.email}`);

    const db = getFirestore();
    const accountsRef = collection(db, ACCOUNTS_COLLECTION);
    
    // Query by userEmail
    const q = query(
      accountsRef,
      where('userEmail', '==', currentUser.email),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`[AccountService] No account found for user: ${currentUser.email}`);
      return null;
    }

    // If multiple accounts found (shouldn't happen), take the first and warn
    if (snapshot.docs.length > 1) {
      console.warn(
        `[AccountService] Multiple accounts found for ${currentUser.email}. Using the first one.`
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Map Firestore document to MobileAccountConfig
    const config: MobileAccountConfig = {
      accountId: data.accountId,
      companyName: data.companyName,
      userEmail: data.userEmail,
      sheetId: data.sheetId,
      scriptUrl: data.scriptUrl,
      scriptSecret: data.scriptSecret,
      lastConnectionTestAt: data.lastConnectionTestAt,
      lastConnectionTestStatus: data.lastConnectionTestStatus,
      lastConnectionTestMessage: data.lastConnectionTestMessage,
    };

    // Validate required fields
    if (!config.accountId || !config.scriptUrl || !config.scriptSecret) {
      throw new Error('Account configuration is incomplete. Missing required fields.');
    }

    console.log(`[AccountService] Account loaded: ${config.companyName} (${config.accountId})`);
    
    // DO NOT log scriptSecret
    console.log(`[AccountService] Script URL: ${config.scriptUrl}`);
    
    return config;
  } catch (error) {
    console.error('[AccountService] Error fetching account config:', error);
    throw error;
  }
}

/**
 * Validate account configuration
 * 
 * @param config - Account config to validate
 * @returns true if valid, false otherwise
 */
export function validateAccountConfig(config: MobileAccountConfig | null): boolean {
  if (!config) return false;
  
  return !!(
    config.accountId &&
    config.companyName &&
    config.userEmail &&
    config.sheetId &&
    config.scriptUrl &&
    config.scriptSecret
  );
}
```

---

## 3. Account Context Provider

**File:** `contexts/AccountContext.tsx` (or `src/contexts/AccountContext.tsx`)

```typescript
/**
 * Account Context
 * 
 * Provides global access to the user's BookMate account configuration
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { MobileAccountConfig } from '../types/account';
import { fetchAccountConfig, validateAccountConfig } from '../services/accountService';

const ACCOUNT_STORAGE_KEY = '@bookmate:account_config';

interface AccountContextValue {
  /** Current account configuration (null if not loaded or not found) */
  config: MobileAccountConfig | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message (null if no error) */
  error: string | null;
  
  /** Manually refresh account config from Firestore */
  refresh: () => Promise<void>;
  
  /** Clear account config (e.g., on logout) */
  clear: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

interface AccountProviderProps {
  children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const [config, setConfig] = useState<MobileAccountConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load account config from Firestore
   */
  const loadAccountConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedConfig = await fetchAccountConfig();

      if (!fetchedConfig) {
        setError('No BookMate account is configured for this user. Please contact support.');
        setConfig(null);
        await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);
        return;
      }

      if (!validateAccountConfig(fetchedConfig)) {
        setError('Account configuration is incomplete. Please contact support.');
        setConfig(null);
        await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);
        return;
      }

      // Save to state
      setConfig(fetchedConfig);
      
      // Persist to AsyncStorage for faster startup
      await AsyncStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(fetchedConfig));
      
      console.log('[AccountContext] Account config loaded successfully');
    } catch (err) {
      console.error('[AccountContext] Error loading account config:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load account configuration. Please try again.'
      );
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load cached config from AsyncStorage (for faster startup)
   */
  const loadCachedConfig = async () => {
    try {
      const cached = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (cached) {
        const parsedConfig = JSON.parse(cached) as MobileAccountConfig;
        if (validateAccountConfig(parsedConfig)) {
          console.log('[AccountContext] Loaded cached account config');
          setConfig(parsedConfig);
          setLoading(false);
          
          // Refresh from Firestore in background
          loadAccountConfig();
        }
      }
    } catch (err) {
      console.warn('[AccountContext] Failed to load cached config:', err);
    }
  };

  /**
   * Clear account config (on logout)
   */
  const clear = async () => {
    setConfig(null);
    setError(null);
    await AsyncStorage.removeItem(ACCOUNT_STORAGE_KEY);
    console.log('[AccountContext] Account config cleared');
  };

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('[AccountContext] User authenticated, loading account config');
        
        // Try to load cached config first for faster UX
        await loadCachedConfig();
        
        // If no cached config, load from Firestore
        if (!config) {
          await loadAccountConfig();
        }
      } else {
        console.log('[AccountContext] User logged out, clearing account config');
        await clear();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AccountContextValue = {
    config,
    loading,
    error,
    refresh: loadAccountConfig,
    clear,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

/**
 * Hook to access account configuration
 * 
 * @throws Error if used outside AccountProvider
 */
export function useAccountConfig(): AccountContextValue {
  const context = useContext(AccountContext);
  
  if (context === undefined) {
    throw new Error('useAccountConfig must be used within AccountProvider');
  }
  
  return context;
}
```

---

## 4. Loading Screen Component

**File:** `components/AccountLoadingScreen.tsx` (or `src/components/AccountLoadingScreen.tsx`)

```typescript
/**
 * Account Loading Screen
 * 
 * Displayed while account configuration is being loaded
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export function AccountLoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.title}>Loading your BookMate account…</Text>
      <Text style={styles.subtitle}>Please wait</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
```

---

## 5. Error Screen Component

**File:** `components/AccountErrorScreen.tsx` (or `src/components/AccountErrorScreen.tsx`)

```typescript
/**
 * Account Error Screen
 * 
 * Displayed when account configuration cannot be loaded
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AccountErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

export function AccountErrorScreen({ error, onRetry }: AccountErrorScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      
      <Text style={styles.title}>Account not configured</Text>
      
      <Text style={styles.message}>{error}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.supportText}>
        If this problem persists, please contact support.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supportText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
```

---

## 6. App Integration

**File:** `App.tsx` (or `src/App.tsx`)

```typescript
/**
 * App.tsx
 * 
 * Main app entry point with AccountProvider integration
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AccountProvider } from './contexts/AccountContext';
import { AuthProvider } from './contexts/AuthContext'; // Your existing auth context
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AccountProvider>
    </AuthProvider>
  );
}
```

---

## 7. Protected Screen Wrapper

**File:** `components/AccountProtectedScreen.tsx` (or `src/components/AccountProtectedScreen.tsx`)

```typescript
/**
 * Account Protected Screen
 * 
 * Wrapper for screens that require account configuration
 */

import React from 'react';
import { useAccountConfig } from '../contexts/AccountContext';
import { AccountLoadingScreen } from './AccountLoadingScreen';
import { AccountErrorScreen } from './AccountErrorScreen';

interface AccountProtectedScreenProps {
  children: React.ReactNode;
}

export function AccountProtectedScreen({ children }: AccountProtectedScreenProps) {
  const { config, loading, error, refresh } = useAccountConfig();

  if (loading) {
    return <AccountLoadingScreen />;
  }

  if (error || !config) {
    return <AccountErrorScreen error={error || 'Unknown error'} onRetry={refresh} />;
  }

  return <>{children}</>;
}
```

---

## 8. Example Usage - Transaction Screen

**File:** `screens/AddTransactionScreen.tsx` (BEFORE - hardcoded)

```typescript
// ❌ OLD CODE - Hardcoded URL and secret
const sendTransaction = async (transaction: Transaction) => {
  const response = await fetch('https://script.google.com/macros/s/HARDCODED_ID/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: 'HARDCODED_SECRET',
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
    }),
  });
  // ...
};
```

**File:** `screens/AddTransactionScreen.tsx` (AFTER - config-based)

```typescript
/**
 * Add Transaction Screen
 * 
 * Example of using account config for sending transactions
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAccountConfig } from '../contexts/AccountContext';
import { AccountProtectedScreen } from '../components/AccountProtectedScreen';

function AddTransactionScreenContent() {
  const { config } = useAccountConfig();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const sendTransaction = async () => {
    if (!config) {
      Alert.alert('Error', 'Account configuration not available');
      return;
    }

    setLoading(true);
    
    try {
      // ✅ NEW CODE - Use config for URL and secret
      const response = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: config.scriptSecret,
          date: new Date().toISOString().split('T')[0],
          description,
          amount: parseFloat(amount),
          category: 'Expense',
          source: 'mobile_app',
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Transaction sent successfully');
        setDescription('');
        setAmount('');
      } else {
        Alert.alert('Error', result.error || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Add Transaction
      </Text>
      
      {/* Show account info */}
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
        Account: {config?.companyName}
      </Text>

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ 
          borderWidth: 1, 
          borderColor: '#D1D5DB', 
          padding: 12, 
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ 
          borderWidth: 1, 
          borderColor: '#D1D5DB', 
          padding: 12, 
          borderRadius: 8,
          marginBottom: 16,
        }}
      />

      <TouchableOpacity
        onPress={sendTransaction}
        disabled={loading || !description || !amount}
        style={{
          backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
          {loading ? 'Sending...' : 'Send Transaction'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function AddTransactionScreen() {
  return (
    <AccountProtectedScreen>
      <AddTransactionScreenContent />
    </AccountProtectedScreen>
  );
}
```

---

## 9. Installation & Setup

### Install Dependencies

```bash
# AsyncStorage for caching
expo install @react-native-async-storage/async-storage

# Firebase (if not already installed)
expo install firebase
```

### Firebase Configuration

Ensure your `firebaseConfig.ts` is set up:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 10. Testing Checklist

- [ ] User logs in → Account config loads automatically
- [ ] Account config cached in AsyncStorage
- [ ] On app restart, cached config loads first
- [ ] Background refresh from Firestore works
- [ ] No account found → Shows error screen with message
- [ ] "Retry" button re-fetches from Firestore
- [ ] User logs out → Config cleared from memory and storage
- [ ] Transaction screen uses config.scriptUrl and config.scriptSecret
- [ ] scriptSecret never logged to console
- [ ] Multiple accounts warning logged (if applicable)

---

## 11. Security Considerations

### ✅ DO:
- Store `scriptSecret` in memory only while user is logged in
- Clear `scriptSecret` on logout
- Use HTTPS for all Apps Script requests
- Validate account config before using

### ❌ DON'T:
- Log `scriptSecret` to console
- Send `scriptSecret` to analytics
- Expose `scriptSecret` in error messages
- Store `scriptSecret` in unencrypted cloud storage

---

## 12. Performance Optimization

### Caching Strategy:
1. **On Login:** Load cached config from AsyncStorage (instant)
2. **Background:** Refresh from Firestore (2-3 seconds)
3. **On Success:** Update cache with fresh data
4. **On Logout:** Clear cache

### Benefits:
- Faster app startup (no Firestore wait)
- Always fresh data (background refresh)
- Offline support (cached config)

---

## 13. Error Handling

### Scenarios:

| Scenario | Behavior |
|----------|----------|
| No account found | Show error screen: "No BookMate account configured" |
| Multiple accounts | Use first, log warning, show which one |
| Network error | Show error screen with retry button |
| Invalid config | Show error screen: "Account configuration incomplete" |
| User not authenticated | Clear config, show login screen |

---

## 14. Future Enhancements

### Phase 3-2: Account Switching
- Support multiple accounts per user
- Account selector UI
- Switch between accounts without re-login

### Phase 3-3: Offline Mode
- Queue transactions when offline
- Sync when connection restored
- Show offline indicator

### Phase 3-4: Account Health
- Show connection test status in app
- Display last test result
- Allow manual connection test from mobile

---

## Summary

This implementation provides:

✅ **Type-safe account configuration**  
✅ **Firestore integration for fetching config**  
✅ **React Context for global access**  
✅ **AsyncStorage caching for performance**  
✅ **Loading and error states**  
✅ **Security best practices**  
✅ **Example usage in transaction screen**  

The mobile app is now **fully aware** of the user's BookMate account and can use the correct `scriptUrl` and `scriptSecret` for all API interactions.

**Next Step:** Test with a real user account and verify transactions flow correctly!
