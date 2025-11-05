/**
 * Firestore Service
 * 
 * Real-time data operations for Firebase Firestore
 * Handles balances, transactions, activity logs, and AI checks
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db, FIREBASE_ENABLED } from '../config/firebase';

/**
 * Type Definitions
 */

export interface FirestoreBalance {
  accountName: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  netChange: number;
  currentBalance: number;
  lastTxnAt: Timestamp;
  currency?: string;
  // Legacy fields for backward compatibility
  lastUpdated?: Timestamp;
  transactions?: number;
  propertyId?: string;
  accountType?: string;
  metadata?: {
    createdBy: string;
    version: string;
  };
}

export interface FirestoreTransaction {
  accountName: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  processedBy: string;
  confidence: number;
  status: 'completed' | 'pending' | 'failed';
}

export interface FirestoreActivityLog {
  action: string;
  timestamp: Timestamp;
  details: any;
  userId: string;
  status: 'success' | 'error' | 'warning';
}

export interface FirestoreAICheck {
  checkType: string;
  timestamp: Timestamp;
  accountName: string;
  expectedBalance: number;
  actualBalance: number;
  drift: number;
  status: 'passed' | 'failed' | 'warning';
  confidence: number;
  metadata: any;
}

/**
 * Balances Collection
 */

export const BalancesService = {
  /**
   * Get all balances (one-time read)
   */
  async getAll(): Promise<FirestoreBalance[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const balancesRef = collection(db, 'balances');
      const snapshot = await getDocs(balancesRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreBalance[];
    } catch (error) {
      console.error('[Firestore] Error fetching balances:', error);
      throw error;
    }
  },

  /**
   * Get balances ordered by amount (highest first)
   */
  async getOrderedByBalance(): Promise<FirestoreBalance[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const balancesRef = collection(db, 'balances');
      const q = query(balancesRef, orderBy('currentBalance', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreBalance[];
    } catch (error) {
      console.error('[Firestore] Error fetching ordered balances:', error);
      throw error;
    }
  },

  /**
   * Get a specific balance by account name
   */
  async getByAccountName(accountName: string): Promise<FirestoreBalance | null> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning null');
      return null;
    }

    try {
      const balanceRef = doc(db, 'balances', accountName);
      const snapshot = await getDoc(balanceRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as FirestoreBalance;
      }
      
      return null;
    } catch (error) {
      console.error('[Firestore] Error fetching balance:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time balance updates for all accounts
   * Returns an unsubscribe function
   */
  subscribeToAll(callback: (balances: FirestoreBalance[]) => void): () => void {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, no subscription');
      return () => {};
    }

    const balancesRef = collection(db, 'balances');
    const q = query(balancesRef, orderBy('currentBalance', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const balances = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreBalance[];
        
        callback(balances);
      },
      (error) => {
        console.error('[Firestore] Error in balance subscription:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to real-time updates for a specific account
   */
  subscribeToAccount(accountName: string, callback: (balance: FirestoreBalance | null) => void): () => void {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, no subscription');
      return () => {};
    }

    const balanceRef = doc(db, 'balances', accountName);
    
    const unsubscribe = onSnapshot(balanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data()
          } as FirestoreBalance);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('[Firestore] Error in account subscription:', error);
      }
    );

    return unsubscribe;
  }
};

/**
 * Transactions Collection
 */

export const TransactionsService = {
  /**
   * Get transactions for a specific account
   */
  async getByAccount(accountName: string, maxResults: number = 50): Promise<FirestoreTransaction[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('accountName', '==', accountName),
        orderBy('date', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTransaction[];
    } catch (error) {
      console.error('[Firestore] Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Get recent transactions (all accounts)
   */
  async getRecent(maxResults: number = 50): Promise<FirestoreTransaction[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        orderBy('date', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTransaction[];
    } catch (error) {
      console.error('[Firestore] Error fetching recent transactions:', error);
      throw error;
    }
  },

  /**
   * Get transactions by type (income or expense)
   */
  async getByType(type: 'income' | 'expense', maxResults: number = 50): Promise<FirestoreTransaction[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('type', '==', type),
        orderBy('date', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTransaction[];
    } catch (error) {
      console.error('[Firestore] Error fetching transactions by type:', error);
      throw error;
    }
  },

  /**
   * Add a new transaction
   */
  async add(transaction: Omit<FirestoreTransaction, 'createdAt'>): Promise<string> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, cannot add transaction');
      throw new Error('Firebase is not enabled');
    }

    try {
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: serverTimestamp()
      });
      
      console.log('[Firestore] Transaction added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error adding transaction:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time transaction updates
   */
  subscribeToRecent(maxResults: number, callback: (transactions: FirestoreTransaction[]) => void): () => void {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, no subscription');
      return () => {};
    }

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      orderBy('date', 'desc'),
      limit(maxResults)
    );
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreTransaction[];
        
        callback(transactions);
      },
      (error) => {
        console.error('[Firestore] Error in transaction subscription:', error);
      }
    );

    return unsubscribe;
  }
};

/**
 * Activity Logs Collection
 */

export const ActivityLogsService = {
  /**
   * Get recent activity logs
   */
  async getRecent(maxResults: number = 100): Promise<FirestoreActivityLog[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(
        logsRef,
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreActivityLog[];
    } catch (error) {
      console.error('[Firestore] Error fetching activity logs:', error);
      throw error;
    }
  },

  /**
   * Add an activity log entry
   */
  async add(log: Omit<FirestoreActivityLog, 'timestamp'>): Promise<string> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, cannot add log');
      throw new Error('Firebase is not enabled');
    }

    try {
      const logsRef = collection(db, 'activityLogs');
      const docRef = await addDoc(logsRef, {
        ...log,
        timestamp: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error adding activity log:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time activity log updates
   */
  subscribeToRecent(maxResults: number, callback: (logs: FirestoreActivityLog[]) => void): () => void {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, no subscription');
      return () => {};
    }

    const logsRef = collection(db, 'activityLogs');
    const q = query(
      logsRef,
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreActivityLog[];
        
        callback(logs);
      },
      (error) => {
        console.error('[Firestore] Error in activity log subscription:', error);
      }
    );

    return unsubscribe;
  }
};

/**
 * AI Checks Collection
 */

export const AIChecksService = {
  /**
   * Get recent AI checks
   */
  async getRecent(maxResults: number = 50): Promise<FirestoreAICheck[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const checksRef = collection(db, 'aiChecks');
      const q = query(
        checksRef,
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreAICheck[];
    } catch (error) {
      console.error('[Firestore] Error fetching AI checks:', error);
      throw error;
    }
  },

  /**
   * Get AI checks for a specific account
   */
  async getByAccount(accountName: string, maxResults: number = 20): Promise<FirestoreAICheck[]> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, returning empty array');
      return [];
    }

    try {
      const checksRef = collection(db, 'aiChecks');
      const q = query(
        checksRef,
        where('accountName', '==', accountName),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreAICheck[];
    } catch (error) {
      console.error('[Firestore] Error fetching AI checks for account:', error);
      throw error;
    }
  },

  /**
   * Add an AI check result
   */
  async add(check: Omit<FirestoreAICheck, 'timestamp'>): Promise<string> {
    if (!FIREBASE_ENABLED) {
      console.log('[Firestore] Firebase disabled, cannot add check');
      throw new Error('Firebase is not enabled');
    }

    try {
      const checksRef = collection(db, 'aiChecks');
      const docRef = await addDoc(checksRef, {
        ...check,
        timestamp: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('[Firestore] Error adding AI check:', error);
      throw error;
    }
  }
};

/**
 * Utility Functions
 */

export const FirestoreUtils = {
  /**
   * Check if Firebase is enabled and ready
   */
  isEnabled(): boolean {
    return FIREBASE_ENABLED;
  },

  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  },

  /**
   * Get current server timestamp
   */
  getServerTimestamp() {
    return serverTimestamp();
  }
};

export default {
  Balances: BalancesService,
  Transactions: TransactionsService,
  ActivityLogs: ActivityLogsService,
  AIChecks: AIChecksService,
  Utils: FirestoreUtils
};
