# Phase 3-3: Mobile Connection Status Indicator - Implementation Guide

## Overview

This document provides the implementation for a **read-only connection status indicator** in the mobile app. It displays the backend health check results from the webapp's admin "Test Connection" feature.

---

## 1. Updated Type Definitions

**File:** `types/account.ts` (or `src/types/account.ts`)

**Update the existing `MobileAccountConfig` interface:**

```typescript
/**
 * Mobile Account Configuration
 * 
 * Loaded from Firestore and cached in AsyncStorage
 */
export interface MobileAccountConfig {
  /** Account ID */
  accountId: string;
  
  /** Account name */
  accountName: string;
  
  /** User email */
  userEmail: string;
  
  /** Apps Script endpoint URL */
  scriptUrl: string;
  
  /** Apps Script secret key */
  scriptSecret: string;
  
  /** When account was created */
  createdAt: string;
  
  /** When account was last updated */
  updatedAt: string;
  
  // Connection test results (from webapp admin)
  /** Last connection test timestamp (ISO string) */
  lastConnectionTestAt?: string;
  
  /** Last connection test status */
  lastConnectionTestStatus?: 'success' | 'error';
  
  /** Last connection test message */
  lastConnectionTestMessage?: string;
}
```

---

## 2. Update Account Service

**File:** `services/accountService.ts` (or `src/services/accountService.ts`)

**Update the `fetchAccountConfig` function to include connection test fields:**

```typescript
/**
 * Fetch account configuration from Firestore
 * 
 * @param userEmail - User's email address
 * @returns Account configuration
 */
export async function fetchAccountConfig(
  userEmail: string
): Promise<MobileAccountConfig> {
  const db = getFirestore();
  
  const accountsRef = collection(db, 'accounts');
  const q = query(accountsRef, where('userEmail', '==', userEmail), limit(1));
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('No BookMate account found for this user');
  }
  
  const accountDoc = querySnapshot.docs[0];
  const accountData = accountDoc.data();
  
  // Validate required fields
  if (!accountData.scriptUrl || !accountData.scriptSecret) {
    throw new Error('Account is not properly configured');
  }
  
  // Build config object
  const config: MobileAccountConfig = {
    accountId: accountDoc.id,
    accountName: accountData.accountName || 'My Account',
    userEmail: accountData.userEmail,
    scriptUrl: accountData.scriptUrl,
    scriptSecret: accountData.scriptSecret,
    createdAt: accountData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: accountData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    
    // Connection test fields (NEW)
    lastConnectionTestAt: accountData.lastConnectionTestAt?.toDate?.()?.toISOString(),
    lastConnectionTestStatus: accountData.lastConnectionTestStatus,
    lastConnectionTestMessage: accountData.lastConnectionTestMessage,
  };
  
  return config;
}
```

---

## 3. Time Formatting Utility

**File:** `utils/timeFormat.ts` (or `src/utils/timeFormat.ts`)

```typescript
/**
 * Time Formatting Utilities
 * 
 * Convert dates to human-friendly relative time strings
 */

/**
 * Format a date as relative time
 * 
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "5 minutes ago", "2 days ago")
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) {
    return 'Never';
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) {
      return 'Just now';
    } else if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin === 1) {
      return '1 minute ago';
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHour === 1) {
      return '1 hour ago';
    } else if (diffHour < 24) {
      return `${diffHour} hours ago`;
    } else if (diffDay === 1) {
      return '1 day ago';
    } else if (diffDay < 7) {
      return `${diffDay} days ago`;
    } else if (diffDay < 30) {
      const weeks = Math.floor(diffDay / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDay < 365) {
      const months = Math.floor(diffDay / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffDay / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown';
  }
}

/**
 * Format a date as short datetime
 * 
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Nov 14, 2025 3:45 PM")
 */
export function formatShortDateTime(dateString: string | undefined): string {
  if (!dateString) {
    return 'Never';
  }

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Unknown';
  }
}
```

---

## 4. ConnectionStatusBanner Component

**File:** `components/ConnectionStatusBanner.tsx` (or `src/components/ConnectionStatusBanner.tsx`)

```typescript
/**
 * Connection Status Banner
 * 
 * Displays the backend connection health check status
 * Shows results from webapp admin's "Test Connection" feature
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatRelativeTime } from '../utils/timeFormat';

interface ConnectionStatusBannerProps {
  /** Connection test status */
  status?: 'success' | 'error';
  
  /** Last test timestamp (ISO string) */
  lastTestAt?: string;
  
  /** Connection test message */
  message?: string;
  
  /** Optional custom style */
  style?: any;
}

export function ConnectionStatusBanner({
  status,
  lastTestAt,
  message,
  style,
}: ConnectionStatusBannerProps) {
  // No status and no test - don't show anything
  if (!status && !lastTestAt) {
    return null;
  }

  // No status but has test time - show "never tested"
  if (!status && lastTestAt) {
    return (
      <View style={[styles.banner, styles.bannerInfo, style]}>
        <View style={styles.content}>
          <Text style={styles.iconInfo}>ℹ️</Text>
          <View style={styles.textContainer}>
            <Text style={styles.textInfo}>
              No health check run yet
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const relativeTime = formatRelativeTime(lastTestAt);

  // Success status
  if (status === 'success') {
    return (
      <View style={[styles.banner, styles.bannerSuccess, style]}>
        <View style={styles.content}>
          <Text style={styles.iconSuccess}>✓</Text>
          <View style={styles.textContainer}>
            <Text style={styles.textSuccess}>
              Backend OK
            </Text>
            <Text style={styles.timestamp}>
              Last checked: {relativeTime}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Error status
  if (status === 'error') {
    return (
      <View style={[styles.banner, styles.bannerError, style]}>
        <View style={styles.content}>
          <Text style={styles.iconError}>⚠️</Text>
          <View style={styles.textContainer}>
            <Text style={styles.textError}>
              Connection issue
            </Text>
            {message && (
              <Text style={styles.errorMessage} numberOfLines={2}>
                {message}
              </Text>
            )}
            <Text style={styles.timestamp}>
              Last checked: {relativeTime}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  
  // Success variant (green)
  bannerSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  
  // Error variant (red/orange)
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  
  // Info variant (blue/gray)
  bannerInfo: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  iconSuccess: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  
  iconError: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  
  iconInfo: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  
  textContainer: {
    flex: 1,
  },
  
  textSuccess: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  
  textError: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 2,
  },
  
  textInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  errorMessage: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 4,
  },
  
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
```

---

## 5. Example Integration - Dashboard Screen

**File:** `screens/DashboardScreen.tsx` (or `src/screens/DashboardScreen.tsx`)

```typescript
/**
 * Dashboard Screen
 * 
 * Main screen with connection status indicator
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAccountConfig } from '../contexts/AccountContext';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';

export function DashboardScreen({ navigation }: any) {
  const { config, loading } = useAccountConfig();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          {config?.accountName || 'BookMate Account'}
        </Text>

        {/* Connection Status Banner */}
        <ConnectionStatusBanner
          status={config?.lastConnectionTestStatus}
          lastTestAt={config?.lastConnectionTestAt}
          message={config?.lastConnectionTestMessage}
        />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Text style={styles.actionButtonText}>
              ➕ Add Transaction
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ViewTransactions')}
          >
            <Text style={styles.actionButtonText}>
              📊 View Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionButtonText}>
              📈 View Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{config?.userEmail}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account ID:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {config?.accountId}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
});
```

---

## 6. Alternative Integration - Settings Screen

**File:** `screens/SettingsScreen.tsx` (or `src/screens/SettingsScreen.tsx`)

```typescript
/**
 * Settings Screen
 * 
 * Alternative location for connection status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAccountConfig } from '../contexts/AccountContext';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';
import { formatShortDateTime } from '../utils/timeFormat';

export function SettingsScreen({ navigation }: any) {
  const { config } = useAccountConfig();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{config?.accountName}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{config?.userEmail}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>
                {formatShortDateTime(config?.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Backend Health Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Health</Text>
          
          <ConnectionStatusBanner
            status={config?.lastConnectionTestStatus}
            lastTestAt={config?.lastConnectionTestAt}
            message={config?.lastConnectionTestMessage}
          />
          
          <Text style={styles.helpText}>
            The connection status is checked by your account administrator.
            If you see an error, please contact your admin or check back later.
          </Text>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

---

## 7. Visual States

### No Test Run Yet
```
┌──────────────────────────────────────┐
│ ℹ️  No health check run yet          │
└──────────────────────────────────────┘
Gray background, subtle
```

### Success
```
┌──────────────────────────────────────┐
│ ✓  Backend OK                        │
│    Last checked: 5 minutes ago       │
└──────────────────────────────────────┘
Green background (#D1FAE5)
```

### Error
```
┌──────────────────────────────────────┐
│ ⚠️  Connection issue                  │
│    Request timeout after 10 seconds  │
│    Last checked: 2 hours ago         │
└──────────────────────────────────────┘
Red/orange background (#FEE2E2)
```

---

## 8. Data Flow

```
┌─────────────────┐
│  Webapp Admin   │
│                 │
│  1. Clicks      │
│     "Test       │
│     Connection" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Firestore     │
│   (accounts)    │
│                 │
│  Updates:       │
│  - lastTest...  │
│  - status       │
│  - message      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mobile App     │
│                 │
│  2. Fetches     │
│     account     │
│     config      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AccountContext │
│                 │
│  3. Exposes     │
│     test fields │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Connection     │
│  StatusBanner   │
│                 │
│  4. Displays    │
│     to user     │
└─────────────────┘
```

---

## 9. Implementation Checklist

- [ ] **Step 1:** Add connection test fields to `MobileAccountConfig` type
- [ ] **Step 2:** Update `fetchAccountConfig()` to include new fields
- [ ] **Step 3:** Create `utils/timeFormat.ts` with relative time helpers
- [ ] **Step 4:** Create `ConnectionStatusBanner` component
- [ ] **Step 5:** Add banner to Dashboard screen (or Settings)
- [ ] **Step 6:** Test all states:
  - [ ] No test run yet
  - [ ] Success status
  - [ ] Error status
  - [ ] Different time ranges (minutes, hours, days ago)

---

## 10. Testing Scenarios

### Test 1: No Test Run Yet
```typescript
// In Firestore, account has no lastConnectionTestAt
config = {
  accountId: '123',
  scriptUrl: '...',
  scriptSecret: '...',
  // No test fields
}

// Expected: No banner shown, or "No health check run yet"
```

### Test 2: Recent Success
```typescript
// In webapp admin, run "Test Connection" → Success
config = {
  lastConnectionTestAt: '2025-11-14T15:30:00Z', // 5 mins ago
  lastConnectionTestStatus: 'success',
  lastConnectionTestMessage: 'Test successful'
}

// Expected: Green banner "Backend OK · Last checked: 5 minutes ago"
```

### Test 3: Old Error
```typescript
// In webapp admin, test failed 2 days ago
config = {
  lastConnectionTestAt: '2025-11-12T10:00:00Z',
  lastConnectionTestStatus: 'error',
  lastConnectionTestMessage: 'Request timeout after 10 seconds'
}

// Expected: Red banner with error message "Last checked: 2 days ago"
```

### Test 4: Real-time Update
```
1. Mobile app shows "Backend OK" from yesterday
2. Admin runs test → Fails
3. Mobile app refreshes config (app restart or pull-to-refresh)
4. Banner updates to show error
```

---

## 11. UI/UX Guidelines

### ✅ DO:
- Keep banner **non-blocking** (informational only)
- Use **subtle colors** (don't alarm users unnecessarily)
- Show **relative time** for better UX ("5 mins ago" vs "Nov 14, 3:30 PM")
- Allow banner to be **dismissible** (optional enhancement)
- Update config on **app restart** or **pull-to-refresh**

### ❌ DON'T:
- Block app functionality based on test status
- Show technical error details (keep it user-friendly)
- Poll Firestore for updates (rely on app restart/refresh)
- Show banner if user isn't signed in yet

---

## 12. Optional Enhancements

### Enhancement 1: Pull-to-Refresh
```typescript
// In Dashboard screen
const onRefresh = async () => {
  setRefreshing(true);
  try {
    await refreshAccountConfig(); // Re-fetch from Firestore
  } catch (error) {
    console.error('Error refreshing config:', error);
  } finally {
    setRefreshing(false);
  }
};
```

### Enhancement 2: Dismissible Banner
```typescript
// Add state to hide banner
const [bannerDismissed, setBannerDismissed] = useState(false);

// Add close button to banner
<TouchableOpacity onPress={() => setBannerDismissed(true)}>
  <Text>✕</Text>
</TouchableOpacity>
```

### Enhancement 3: Tap to View Details
```typescript
// Make banner tappable
<TouchableOpacity onPress={() => navigation.navigate('ConnectionDetails')}>
  <ConnectionStatusBanner {...props} />
</TouchableOpacity>
```

---

## Summary

This implementation provides:

✅ **Read-only status** - Shows webapp admin test results  
✅ **Non-blocking UI** - Informational banner, app still works  
✅ **3 visual states** - No test, success, error  
✅ **Relative time** - User-friendly time formatting  
✅ **Minimal code** - ~150 lines total (banner + utils)  
✅ **Type-safe** - Full TypeScript support  
✅ **Flexible placement** - Works in dashboard or settings  

Users can now quickly see if their backend is healthy, based on the admin's test results! 🎉
