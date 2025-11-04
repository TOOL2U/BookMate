/**
 * Firestore Collections: Transactions
 * CRUD operations for transaction documents
 */

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { adminDb } from '../firebase/admin';

export interface Transaction {
  timestamp: Date | Timestamp;
  fromAccount: string;
  toAccount: string;
  transactionType: 'transfer' | 'income' | 'expense';
  amount: number;
  currency: string;
  note: string;
  referenceID: string;
  user: string;
  sheetRow?: number;
  syncedAt?: Date | Timestamp;
}

/**
 * Add transaction to Firestore (client-side)
 */
export async function addTransaction(transaction: Omit<Transaction, 'timestamp' | 'syncedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...transaction,
    timestamp: Timestamp.now(),
    syncedAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Get recent transactions (client-side)
 */
export async function getRecentTransactions(limitCount = 50): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
      syncedAt: data.syncedAt?.toDate(),
    } as Transaction;
  });
}

/**
 * Get transactions for specific account (client-side)
 */
export async function getTransactionsByAccount(accountName: string, limitCount = 100): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('fromAccount', '==', accountName),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  const fromTxns = snapshot.docs.map(doc => doc.data() as Transaction);
  
  const q2 = query(
    collection(db, 'transactions'),
    where('toAccount', '==', accountName),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const snapshot2 = await getDocs(q2);
  const toTxns = snapshot2.docs.map(doc => doc.data() as Transaction);
  
  // Combine and sort
  const allTxns = [...fromTxns, ...toTxns];
  allTxns.sort((a, b) => {
    const aTime = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
    return bTime - aTime;
  });
  
  return allTxns.slice(0, limitCount);
}

/**
 * Add transaction using Admin SDK (server-side)
 */
export async function addTransactionAdmin(transaction: Omit<Transaction, 'timestamp' | 'syncedAt'>): Promise<string> {
  const docRef = await adminDb.collection('transactions').add({
    ...transaction,
    timestamp: Timestamp.now(),
    syncedAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Sync transaction from Google Sheets (server-side)
 */
export async function syncTransactionFromSheets(
  transaction: Transaction,
  sheetRow: number
): Promise<string> {
  const docRef = await adminDb.collection('transactions').add({
    ...transaction,
    sheetRow,
    syncedAt: Timestamp.now(),
  });
  return docRef.id;
}
