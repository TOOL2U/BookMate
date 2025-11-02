import { NextRequest, NextResponse } from 'next/server';
import { fetchInboxData } from '@/app/api/inbox/inbox-utils';
import { google } from 'googleapis';
import path from 'path';

/**
 * Running Balance Calculation
 *
 * This endpoint calculates the current balance for each bank/cash account by:
 * 1. Getting the last uploaded balance from "Bank & Cash Balance" sheet
 * 2. Fetching all transactions from the inbox
 * 3. Calculating: currentBalance = uploadedBalance + revenues - expenses
 *
 * This allows automatic balance tracking as transactions are added.
 */

interface Transaction {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  debit: number;
  credit: number;
  timestamp?: string;
}

interface UploadedBalance {
  bankName: string;
  balance: number;
  timestamp: string;
}

interface CalculatedBalance {
  bankName: string;
  uploadedBalance: number;
  uploadedDate: string;
  totalRevenues: number;
  totalExpenses: number;
  currentBalance: number;
  transactionCount: number;
}

/**
 * In-memory cache
 */
interface CachedPropertyBalances {
  data: any;
  timestamp: number;
}

let propertyBalanceCache: CachedPropertyBalances | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Clear the cache (called when balances are updated)
 * Note: Not exported to comply with Next.js API route requirements
 */
function clearPropertyBalanceCache() {
  propertyBalanceCache = null;
  console.log('🗑️ Property balance cache cleared');
}

/**
 * Fetch uploaded balances from "Bank & Cash Balance" sheet
 * Returns the most recent balance for each bank
 */
async function fetchUploadedBalances(): Promise<Map<string, UploadedBalance>> {
  try {
    // Use environment variable for credentials (works in both local and production)
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!credentialsJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
    }

    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';

    // Fetch all balance entries from "Bank & Cash Balance" sheet
    // Expected columns: timestamp, bankName, balance, note
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Bank & Cash Balance'!A2:D1000", // Skip header row
    });

    const rows = response.data.values || [];
    const balanceMap = new Map<string, UploadedBalance>();

    // Process rows to get the latest balance for each bank
    rows.forEach((row) => {
      const timestamp = row[0];
      const bankName = row[1];
      const balance = parseFloat(row[2]);

      if (bankName && !isNaN(balance)) {
        // Keep only the latest entry for each bank (last row wins)
        balanceMap.set(bankName, {
          bankName,
          balance,
          timestamp: timestamp || new Date().toISOString(),
        });
      }
    });

    return balanceMap;
  } catch (error) {
    console.error('Error fetching uploaded balances:', error);
    throw error;
  }
}

/**
 * Fetch all transactions from inbox
 */
async function fetchTransactions(): Promise<Transaction[]> {
  try {
    console.log('  → Fetching transactions directly from inbox module...');
    
    // Call the inbox function directly (avoids HTTP overhead and auth issues)
    const data = await fetchInboxData();
    
    console.log('  ✓ Fetched', data?.length || 0, 'transactions');
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error instanceof Error) {
      console.error('  → Error message:', error.message);
      console.error('  → Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Calculate running balances for each bank
 */
function calculateRunningBalances(
  uploadedBalances: Map<string, UploadedBalance>,
  transactions: Transaction[]
): CalculatedBalance[] {
  const balances: CalculatedBalance[] = [];

  // Get all unique bank names from uploaded balances
  const bankNames = Array.from(uploadedBalances.keys());

  bankNames.forEach((bankName) => {
    const uploaded = uploadedBalances.get(bankName)!;

    // Filter transactions for this bank
    const bankTransactions = transactions.filter(tx => tx.typeOfPayment === bankName);

    // Calculate totals
    let totalRevenues = 0;
    let totalExpenses = 0;

    bankTransactions.forEach(tx => {
      if (tx.credit > 0) {
        totalRevenues += tx.credit;
      }
      if (tx.debit > 0) {
        totalExpenses += tx.debit;
      }
    });

    // Calculate current balance
    const currentBalance = uploaded.balance + totalRevenues - totalExpenses;

    balances.push({
      bankName,
      uploadedBalance: uploaded.balance,
      uploadedDate: uploaded.timestamp,
      totalRevenues,
      totalExpenses,
      currentBalance,
      transactionCount: bankTransactions.length,
    });
  });

  // Sort by current balance (highest first)
  return balances.sort((a, b) => b.currentBalance - a.currentBalance);
}

/**
 * POST /api/balance/by-property
 * Get bank/cash balances from Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (propertyBalanceCache && (now - propertyBalanceCache.timestamp) < CACHE_TTL) {
      console.log('✅ Returning cached running balances');
      return NextResponse.json(propertyBalanceCache.data);
    }

    console.log('📊 Calculating running balances...');

    // Step 1: Fetch uploaded balances
    console.log('  → Fetching uploaded balances from Google Sheets...');
    const uploadedBalances = await fetchUploadedBalances();
    console.log(`  ✓ Found ${uploadedBalances.size} uploaded balances`);

    // Step 2: Fetch all transactions
    console.log('  → Fetching transactions from inbox...');
    const transactions = await fetchTransactions();
    console.log(`  ✓ Found ${transactions.length} transactions`);

    // Step 3: Calculate running balances
    console.log('  → Calculating running balances...');
    const calculatedBalances = calculateRunningBalances(uploadedBalances, transactions);

    // Calculate totals
    const totalCurrentBalance = calculatedBalances.reduce((sum, b) => sum + b.currentBalance, 0);
    const totalRevenues = calculatedBalances.reduce((sum, b) => sum + b.totalRevenues, 0);
    const totalExpenses = calculatedBalances.reduce((sum, b) => sum + b.totalExpenses, 0);
    const totalTransactions = calculatedBalances.reduce((sum, b) => sum + b.transactionCount, 0);

    // Format response
    const propertyBalances = calculatedBalances.map(b => ({
      property: b.bankName,
      balance: b.currentBalance,
      uploadedBalance: b.uploadedBalance,
      uploadedDate: b.uploadedDate,
      totalRevenue: b.totalRevenues,
      totalExpense: b.totalExpenses,
      transactionCount: b.transactionCount,
      variance: b.currentBalance - b.uploadedBalance, // How much changed since upload
    }));

    const response = {
      ok: true,
      success: true,
      propertyBalances,
      summary: {
        totalBalance: totalCurrentBalance,
        totalRevenue: totalRevenues,
        totalExpense: totalExpenses,
        propertyCount: calculatedBalances.length,
        transactionCount: totalTransactions,
      },
      timestamp: new Date().toISOString(),
    };

    // Cache the response
    propertyBalanceCache = {
      data: response,
      timestamp: now,
    };

    console.log(`✅ Successfully calculated ${calculatedBalances.length} running balances`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Running balance calculation error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to calculate running balances',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/balance/by-property
 * Get bank/cash balances from Google Sheets
 */
export async function GET(request: NextRequest) {
  // Reuse POST logic
  return POST(request);
}
