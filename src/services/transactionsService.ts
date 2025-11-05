/**
 * Transactions Service - Phase 5
 * Manages transaction submission with automatic balance sync
 */

import { apiService } from './api';
import { balancesService } from './balancesService';
import type { Transaction, SheetsResponse } from '../types';

// Helper function to convert month number to abbreviation
const getMonthAbbreviation = (date: Date): string => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[date.getMonth()];
};

export type TransactionType = 'revenue' | 'expense' | 'transfer';

export interface TransactionFormData {
  type: TransactionType;
  date: Date;
  property?: string;
  operation: string;
  account: string;
  toAccount?: string; // For transfers
  amount: number;
  note: string;
}

export interface TransactionPayload {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  credit: number;
  debit: number;
}

class TransactionsService {
  /**
   * Submit a transaction (revenue or expense)
   */
  async submitTransaction(data: TransactionFormData): Promise<SheetsResponse> {
    const payload = this.buildPayload(data);

    // Submit to API
    const response = await apiService.submitTransaction(payload);

    if (!response.success) {
      throw new Error(response.error || 'Failed to submit transaction');
    }

    // Trigger balance sync
    try {
      await balancesService.syncBalances();
    } catch (error) {
      console.warn('Failed to sync balances after transaction:', error);
      // Don't fail the transaction if sync fails
    }

    return response;
  }

  /**
   * Submit a transfer (two transactions)
   * WORKAROUND: Until "Transfer" category is added to Google Sheets
   */
  async submitTransfer(data: TransactionFormData): Promise<void> {
    if (!data.toAccount) {
      throw new Error('Transfer requires toAccount');
    }

    if (data.account === data.toAccount) {
      throw new Error('FROM and TO accounts must be different');
    }

    // Transaction 1: Debit FROM account
    const debitPayload: Transaction = {
      day: data.date.getDate().toString(),
      month: getMonthAbbreviation(data.date),
      year: data.date.getFullYear().toString(),
      property: '',
      typeOfOperation: 'EXP - Other', // Workaround until Transfer category added
      typeOfPayment: data.account,
      detail: `Transfer: ${data.account} → ${data.toAccount}. ${data.note}`,
      ref: '',
      credit: 0,
      debit: data.amount,
    };

    // Transaction 2: Credit TO account
    const creditPayload: Transaction = {
      ...debitPayload,
      typeOfOperation: 'Revenue - Other', // Workaround
      typeOfPayment: data.toAccount,
      detail: `Transfer: ${data.account} → ${data.toAccount}. ${data.note}`,
      credit: data.amount,
      debit: 0,
    };

    // Submit both transactions
    await apiService.submitTransaction(debitPayload);
    await apiService.submitTransaction(creditPayload);

    // Trigger balance sync
    await balancesService.syncBalances();
  }

  /**
   * Build API payload from form data
   */
  private buildPayload(data: TransactionFormData): Transaction {
    const isRevenue = data.type === 'revenue';

    return {
      day: data.date.getDate().toString(),
      month: getMonthAbbreviation(data.date),
      year: data.date.getFullYear().toString(),
      property: data.property || '',
      typeOfOperation: data.operation,
      typeOfPayment: data.account,
      detail: data.note,
      ref: '',
      credit: isRevenue ? data.amount : 0,
      debit: isRevenue ? 0 : data.amount,
    };
  }

  /**
   * Validate transaction data
   */
  validate(data: TransactionFormData): string | null {
    if (!data.date) return 'Date is required';
    if (!data.operation && data.type !== 'transfer') return 'Operation is required';
    if (!data.account) return 'Account is required';
    if (data.amount <= 0) return 'Amount must be greater than 0';
    if (data.type === 'transfer' && !data.toAccount) {
      return 'TO account is required for transfers';
    }
    if (data.type === 'transfer' && data.account === data.toAccount) {
      return 'FROM and TO accounts must be different';
    }
    return null;
  }
}

export const transactionsService = new TransactionsService();
