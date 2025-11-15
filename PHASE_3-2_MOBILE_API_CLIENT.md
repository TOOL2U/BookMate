# Phase 3-2: Mobile Transaction API Client - Implementation Guide

## Overview

This document provides the implementation for a robust mobile client that sends webhook transactions to the user's Apps Script endpoint with retry logic, offline queuing, and error handling.

---

## 1. Type Definitions

**File:** `types/bookmate.ts` (or `src/types/bookmate.ts`)

```typescript
/**
 * BookMate Transaction Types
 * 
 * Matches the Apps Script V9.0 webhook payload structure
 */

/**
 * Transaction payload sent to Apps Script
 */
export interface BookmateTransactionPayload {
  /** Apps Script secret (injected automatically) */
  secret?: string; // Added by bookmateApi, not required from caller
  
  /** Day of month (1-31) */
  day: string;
  
  /** Month name (Jan, Feb, Mar, etc.) */
  month: string;
  
  /** Year (e.g., "2025") */
  year: string;
  
  /** Optional: Property/Person identifier */
  property?: string;
  
  /** Type of operation (e.g., "EXP - Construction - Materials") */
  typeOfOperation: string;
  
  /** Type of payment (e.g., "Cash", "Bank Transfer") */
  typeOfPayment: string;
  
  /** Transaction detail/description */
  detail: string;
  
  /** Optional: Reference number */
  ref?: string;
  
  /** Optional: Debit amount */
  debit?: number;
  
  /** Optional: Credit amount */
  credit?: number;
}

/**
 * Apps Script response
 */
export interface BookmateApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  rowNumber?: number;
}

/**
 * Queued transaction (for offline support)
 */
export interface QueuedTransaction {
  /** Unique ID for this queued item */
  id: string;
  
  /** Transaction payload */
  payload: BookmateTransactionPayload;
  
  /** When it was queued (ISO string) */
  createdAt: string;
  
  /** Number of send attempts */
  attempts?: number;
  
  /** Last error message (if any) */
  lastError?: string;
}
```

---

## 2. BookMate API Service

**File:** `services/bookmateApi.ts` (or `src/services/bookmateApi.ts`)

```typescript
/**
 * BookMate API Service
 * 
 * Handles communication with Apps Script endpoints
 * Includes retry logic and offline queue support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type {
  BookmateTransactionPayload,
  BookmateApiResponse,
  QueuedTransaction,
} from '../types/bookmate';
import type { MobileAccountConfig } from '../types/account';

const OFFLINE_QUEUE_KEY = '@bookmate:offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000]; // 1s, 3s

/**
 * Check if device is online
 */
async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID for queued transactions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send transaction to Apps Script with retry logic
 * 
 * @param config - Account configuration
 * @param payload - Transaction data
 * @throws Error if all retries fail
 */
async function sendToAppsScript(
  config: MobileAccountConfig,
  payload: BookmateTransactionPayload
): Promise<BookmateApiResponse> {
  const payloadWithSecret = {
    ...payload,
    secret: config.scriptSecret,
  };

  let lastError: Error | null = null;

  // Try up to MAX_RETRIES times
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[BookmateAPI] Attempt ${attempt + 1}/${MAX_RETRIES}`);

      const response = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadWithSecret),
        // 15 second timeout
        signal: AbortSignal.timeout(15000),
      });

      // Parse response
      const responseText = await response.text();
      let responseData: BookmateApiResponse;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        throw new Error(`Apps Script returned invalid JSON: ${responseText.substring(0, 100)}`);
      }

      // Check HTTP status
      if (!response.ok) {
        // 5xx errors are retryable
        if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): ${responseData.error || 'Unknown error'}`);
        }

        // 4xx errors are not retryable (client error)
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized. Your account may not be configured correctly.');
        }

        throw new Error(`HTTP ${response.status}: ${responseData.error || 'Unknown error'}`);
      }

      // Check Apps Script success field
      if (responseData.success === false) {
        // Script rejected the request (not retryable)
        throw new Error(responseData.error || 'Apps Script rejected the transaction');
      }

      // Success!
      console.log('[BookmateAPI] Transaction sent successfully');
      return responseData;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if it's a retryable error
      const isRetryable = 
        error instanceof Error &&
        (error.name === 'AbortError' || 
         error.name === 'TimeoutError' ||
         error.message.includes('Server error (5') ||
         error.message.includes('Network request failed') ||
         error.message.includes('Failed to fetch'));

      if (!isRetryable) {
        // Don't retry 4xx errors or script rejections
        console.error('[BookmateAPI] Non-retryable error:', error);
        throw lastError;
      }

      // If we have retries left, wait and try again
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.log(`[BookmateAPI] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  console.error('[BookmateAPI] All retries exhausted');
  throw new Error('Unable to send transaction. Please check your connection and try again.');
}

/**
 * Get offline queue from AsyncStorage
 */
async function getOfflineQueue(): Promise<QueuedTransaction[]> {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueJson) return [];
    return JSON.parse(queueJson);
  } catch (error) {
    console.error('[BookmateAPI] Error reading offline queue:', error);
    return [];
  }
}

/**
 * Save offline queue to AsyncStorage
 */
async function saveOfflineQueue(queue: QueuedTransaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[BookmateAPI] Error saving offline queue:', error);
  }
}

/**
 * Add transaction to offline queue
 */
async function addToOfflineQueue(payload: BookmateTransactionPayload): Promise<void> {
  const queue = await getOfflineQueue();
  
  const queuedItem: QueuedTransaction = {
    id: generateId(),
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  queue.push(queuedItem);
  await saveOfflineQueue(queue);
  
  console.log(`[BookmateAPI] Transaction queued offline: ${queuedItem.id}`);
}

/**
 * Process offline queue
 * Call this when app starts or network becomes available
 */
export async function processOfflineQueue(config: MobileAccountConfig): Promise<void> {
  console.log('[BookmateAPI] Processing offline queue...');
  
  const queue = await getOfflineQueue();
  
  if (queue.length === 0) {
    console.log('[BookmateAPI] Queue is empty');
    return;
  }

  console.log(`[BookmateAPI] Found ${queue.length} queued transactions`);

  const remainingQueue: QueuedTransaction[] = [];

  for (const item of queue) {
    try {
      console.log(`[BookmateAPI] Sending queued transaction: ${item.id}`);
      
      await sendToAppsScript(config, item.payload);
      
      // Success! Don't add back to queue
      console.log(`[BookmateAPI] Queued transaction sent: ${item.id}`);
      
    } catch (error) {
      console.error(`[BookmateAPI] Failed to send queued transaction: ${item.id}`, error);
      
      // Keep in queue with updated error info
      remainingQueue.push({
        ...item,
        attempts: (item.attempts || 0) + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Save remaining queue
  await saveOfflineQueue(remainingQueue);
  
  if (remainingQueue.length > 0) {
    console.log(`[BookmateAPI] ${remainingQueue.length} transactions still in queue`);
  } else {
    console.log('[BookmateAPI] All queued transactions sent successfully');
  }
}

/**
 * Get count of queued transactions
 */
export async function getQueuedTransactionCount(): Promise<number> {
  const queue = await getOfflineQueue();
  return queue.length;
}

/**
 * Clear offline queue (use with caution)
 */
export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  console.log('[BookmateAPI] Offline queue cleared');
}

/**
 * Send transaction to Apps Script
 * 
 * Main entry point for sending transactions from the mobile app.
 * Handles retry logic and offline queuing automatically.
 * 
 * @param config - Account configuration with scriptUrl and scriptSecret
 * @param payload - Transaction data
 * @throws Error with user-friendly message if fails
 */
export async function sendTransaction(
  config: MobileAccountConfig,
  payload: BookmateTransactionPayload
): Promise<void> {
  // Validate config
  if (!config) {
    throw new Error('Account configuration is not available');
  }

  if (!config.scriptUrl || !config.scriptSecret) {
    throw new Error('Account is not properly configured. Please contact support.');
  }

  // Validate payload
  if (!payload.day || !payload.month || !payload.year) {
    throw new Error('Transaction date is required');
  }

  if (!payload.typeOfOperation || !payload.detail) {
    throw new Error('Transaction type and detail are required');
  }

  // Check if online
  const online = await isOnline();

  if (!online) {
    console.log('[BookmateAPI] Device is offline, queuing transaction');
    
    // Add to offline queue
    await addToOfflineQueue(payload);
    
    // Throw a specific error that the UI can catch
    const error = new Error('You are offline. This transaction will be sent when you are back online.');
    (error as any).isOfflineQueued = true;
    throw error;
  }

  // Device is online, try to send
  try {
    await sendToAppsScript(config, payload);
  } catch (error) {
    console.error('[BookmateAPI] Error sending transaction:', error);
    
    // If it's a network error, queue it
    if (
      error instanceof Error &&
      (error.message.includes('Network request failed') ||
       error.message.includes('Failed to fetch'))
    ) {
      console.log('[BookmateAPI] Network error detected, queuing transaction');
      await addToOfflineQueue(payload);
      
      const offlineError = new Error('Connection lost. This transaction will be sent when you are back online.');
      (offlineError as any).isOfflineQueued = true;
      throw offlineError;
    }

    // Re-throw other errors as-is
    throw error;
  }
}

/**
 * Get P&L data from Apps Script
 * 
 * @param config - Account configuration
 * @returns P&L data
 */
export async function getPnL(config: MobileAccountConfig): Promise<any> {
  if (!config) {
    throw new Error('Account configuration is not available');
  }

  const response = await fetch(config.scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: config.scriptSecret,
      action: 'getPnL',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch P&L: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch P&L');
  }

  return data;
}
```

---

## 3. React Hook for Sending Transactions

**File:** `hooks/useSendTransaction.ts` (or `src/hooks/useSendTransaction.ts`)

```typescript
/**
 * useSendTransaction Hook
 * 
 * React hook for sending transactions with loading and error states
 */

import { useState } from 'react';
import { useAccountConfig } from '../contexts/AccountContext';
import { sendTransaction } from '../services/bookmateApi';
import type { BookmateTransactionPayload } from '../types/bookmate';

interface UseSendTransactionResult {
  /** Send a transaction */
  send: (payload: BookmateTransactionPayload) => Promise<void>;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message (null if no error) */
  error: string | null;
  
  /** Whether transaction was queued offline */
  isOfflineQueued: boolean;
  
  /** Clear error */
  clearError: () => void;
}

export function useSendTransaction(): UseSendTransactionResult {
  const { config } = useAccountConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  const send = async (payload: BookmateTransactionPayload): Promise<void> => {
    if (!config) {
      setError('Account configuration is not available');
      throw new Error('Account configuration is not available');
    }

    setLoading(true);
    setError(null);
    setIsOfflineQueued(false);

    try {
      await sendTransaction(config, payload);
      // Success!
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';
      const offlineQueued = (err as any)?.isOfflineQueued === true;
      
      setError(errorMessage);
      setIsOfflineQueued(offlineQueued);
      
      throw err; // Re-throw so caller can handle it
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setIsOfflineQueued(false);
  };

  return {
    send,
    loading,
    error,
    isOfflineQueued,
    clearError,
  };
}
```

---

## 4. Process Queue on App Start

**File:** `App.tsx` (or integrate into your existing app initialization)

```typescript
/**
 * App.tsx
 * 
 * Process offline queue when app starts and network becomes available
 */

import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAccountConfig } from './contexts/AccountContext';
import { processOfflineQueue, getQueuedTransactionCount } from './services/bookmateApi';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { config, loading: configLoading } = useAccountConfig();

  useEffect(() => {
    // Process queue when config is loaded
    if (config && !configLoading) {
      processOfflineQueue(config).catch(error => {
        console.error('[App] Error processing offline queue:', error);
      });
    }
  }, [config, configLoading]);

  useEffect(() => {
    // Listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable && config) {
        console.log('[App] Network available, processing queue...');
        
        // Check if there are queued items before processing
        getQueuedTransactionCount().then(count => {
          if (count > 0) {
            processOfflineQueue(config).catch(error => {
              console.error('[App] Error processing queue on network change:', error);
            });
          }
        });
      }
    });

    return () => unsubscribe();
  }, [config]);

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <AppInitializer>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppInitializer>
      </AccountProvider>
    </AuthProvider>
  );
}
```

---

## 5. Example Usage in Transaction Screen

**File:** `screens/AddTransactionScreen.tsx`

```typescript
/**
 * Add Transaction Screen
 * 
 * Example of using useSendTransaction hook
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSendTransaction } from '../hooks/useSendTransaction';
import type { BookmateTransactionPayload } from '../types/bookmate';

export function AddTransactionScreen() {
  const { send, loading, error, isOfflineQueued, clearError } = useSendTransaction();
  
  // Form state
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [typeOfOperation, setTypeOfOperation] = useState('EXP - Construction - Materials');
  const [typeOfPayment, setTypeOfPayment] = useState('Cash');

  const handleSubmit = async () => {
    // Validate
    if (!detail.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Build payload
    const today = new Date();
    const payload: BookmateTransactionPayload = {
      day: today.getDate().toString(),
      month: today.toLocaleString('en-US', { month: 'short' }), // "Jan", "Feb", etc.
      year: today.getFullYear().toString(),
      typeOfOperation,
      typeOfPayment,
      detail: detail.trim(),
      debit: numAmount, // Assuming expense
    };

    try {
      await send(payload);
      
      // Success!
      if (isOfflineQueued) {
        Alert.alert(
          'Queued for Later',
          'You are offline. This transaction will be sent automatically when you are back online.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Transaction sent to BookMate', [{ text: 'OK' }]);
      }
      
      // Clear form
      setDetail('');
      setAmount('');
      
    } catch (err) {
      // Error already set in hook state
      if (!isOfflineQueued) {
        // Show error alert for non-queued errors
        Alert.alert(
          'Error',
          error || 'Could not send transaction. Please try again.',
          [{ text: 'OK', onPress: clearError }]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={detail}
        onChangeText={setDetail}
        placeholder="Enter description"
        editable={!loading}
      />

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
        editable={!loading}
      />

      {/* Type of Operation */}
      <Text style={styles.label}>Type</Text>
      <TextInput
        style={styles.input}
        value={typeOfOperation}
        onChangeText={setTypeOfOperation}
        placeholder="Type of operation"
        editable={!loading}
      />

      {/* Type of Payment */}
      <Text style={styles.label}>Payment Method</Text>
      <TextInput
        style={styles.input}
        value={typeOfPayment}
        onChangeText={setTypeOfPayment}
        placeholder="Cash, Bank Transfer, etc."
        editable={!loading}
      />

      {/* Error message */}
      {error && !isOfflineQueued && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Offline queued message */}
      {isOfflineQueued && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ℹ️ Transaction queued. Will be sent when online.
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.buttonText}>Sending...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Send Transaction</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 6. Installation & Dependencies

```bash
# Install required packages
expo install @react-native-async-storage/async-storage
expo install @react-native-community/netinfo
```

---

## 7. Security Checklist

### ✅ DO:
- Use `config.scriptSecret` from AccountContext
- Transmit over HTTPS only (Apps Script URLs are HTTPS)
- Clear error messages for users
- Log high-level errors ("timeout", "offline")

### ❌ DON'T:
- Log `scriptSecret` to console
- Log full payload with secret
- Expose secret in error messages
- Store secret in plain text (it's in AccountContext/AsyncStorage which is OS-encrypted)

---

## 8. Testing Checklist

- [ ] Send transaction while online → Success
- [ ] Send transaction while offline → Queued
- [ ] Turn on network → Queued transaction sends
- [ ] Server returns 500 → Retries 3 times
- [ ] Server returns 401 → Fails immediately (no retry)
- [ ] Invalid payload → Clear error message
- [ ] No account config → Clear error message
- [ ] Multiple queued transactions → All send in order
- [ ] App restart → Queue persists and processes

---

## Summary

This implementation provides:

✅ **Robust sending** - Up to 3 retries with exponential backoff  
✅ **Offline support** - Automatic queuing when offline  
✅ **Clear errors** - User-friendly error messages  
✅ **Type safety** - Full TypeScript support  
✅ **Security** - Secret never logged  
✅ **React hook** - Easy integration with `useSendTransaction()`  
✅ **Auto-sync** - Processes queue on app start and network change  

The mobile app can now reliably send transactions to Apps Script even with poor network conditions!
