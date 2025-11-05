// Force Node.js runtime for Google Sheets API
export const runtime = 'nodejs';

/**
 * GET /api/balance?month=ALL|JAN|FEB|...|DEC
 * 
 * Unified balance endpoint with auto-detection.
 * 
 * Priority:
 * 1. If Balance Summary tab exists → read from it (filtered by month)
 * 2. Otherwise → compute from Ledger + Accounts
 * 
 * Month filter: Applies in-memory filtering, does NOT write back to sheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSheetMeta, colIndexToLetter } from '@/utils/sheetMetaDetector';
import { parseServiceAccountKey } from '@/utils/parseServiceAccountKey';

export const dynamic = 'force-dynamic';

interface BalanceAccount {
  accountName: string;
  openingBalance: number;
  netChange: number;
  currentBalance: number;
  lastTxnAt: string | null;
  inflow: number;
  outflow: number;
  note: string;
}

const VALID_MONTHS = ['ALL', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse month filter from query param
    const { searchParams } = new URL(request.url);
    const requestedMonth = (searchParams.get('month') || 'ALL').toUpperCase();
    
    if (!VALID_MONTHS.includes(requestedMonth)) {
      return NextResponse.json({
        ok: false,
        error: `Invalid month parameter. Must be one of: ${VALID_MONTHS.join(', ')}`
      }, { status: 400 });
    }

    console.log('[Balance API] Fetching balances for month:', requestedMonth);

    // Parse service account credentials
    const credentials = parseServiceAccountKey();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      return NextResponse.json({
        ok: false,
        error: 'Missing GOOGLE_SHEET_ID'
      }, { status: 500 });
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Detect sheet structure
    console.log('[Balance API] Detecting sheet structure...');
    const metadata = await getSheetMeta(spreadsheetId, auth);
    const sheets = google.sheets({ version: 'v4', auth });
    const cacheBust = Date.now();

    let balances: BalanceAccount[];
    let source: string;

    // STRATEGY 1: Read from Balance Summary if it exists
    if (metadata.detected.balanceSummary) {
      console.log('[Balance API] Using Balance Summary tab');
      balances = await readFromBalanceSummary(
        sheets,
        spreadsheetId,
        metadata.detected.balanceSummary,
        requestedMonth,
        cacheBust
      );
      source = 'BalanceSummary';
    }
    // STRATEGY 2: Compute from Ledger + Accounts
    else if (metadata.detected.ledger && metadata.detected.accounts) {
      console.log('[Balance API] Computing from Ledger + Accounts');
      balances = await computeFromLedger(
        sheets,
        spreadsheetId,
        metadata.detected.ledger,
        metadata.detected.accounts,
        requestedMonth,
        cacheBust
      );
      source = 'Computed';
    }
    // ERROR: Missing required tabs
    else {
      return NextResponse.json({
        ok: false,
        error: 'Cannot compute balances: missing required tabs (Balance Summary or Ledger+Accounts)',
        warnings: metadata.warnings
      }, { status: 500 });
    }

    // Calculate totals
    const totals = {
      openingBalance: balances.reduce((sum, acc) => sum + acc.openingBalance, 0),
      netChange: balances.reduce((sum, acc) => sum + acc.netChange, 0),
      currentBalance: balances.reduce((sum, acc) => sum + acc.currentBalance, 0),
      inflow: balances.reduce((sum, acc) => sum + acc.inflow, 0),
      outflow: balances.reduce((sum, acc) => sum + acc.outflow, 0)
    };

    const totalMs = Date.now() - startTime;

    console.log('[Balance API] Success:', {
      month: requestedMonth,
      accounts: balances.length,
      source,
      totalMs
    });

    return NextResponse.json({
      ok: true,
      month: requestedMonth,
      timestamp: new Date().toISOString(),
      data: balances,
      totals,
      source,
      performance: { totalMs }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('[Balance API] Error:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Read balances from Balance Summary tab
 */
async function readFromBalanceSummary(
  sheets: any,
  spreadsheetId: string,
  balanceSummary: any,
  month: string,
  cacheBust: number
): Promise<BalanceAccount[]> {
  const tabTitle = balanceSummary.title;
  const colMap = balanceSummary.colIndexByName;
  const headerRow = balanceSummary.headerRow || 0;

  // Build range to read all columns
  // Data starts on the row AFTER the header row
  const dataStartRow = headerRow + 2; // +1 for next row, +1 for 1-based indexing
  const lastCol = Math.max(...Object.values(colMap) as number[]);
  const lastColLetter = colIndexToLetter(lastCol);
  const range = `'${tabTitle}'!A${dataStartRow}:${lastColLetter}`;

  console.log('[Balance API] Reading from:', range, `(header on row ${headerRow + 1})`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Cache-Bust': cacheBust.toString()
    }
  });

  const rows = response.data.values || [];
  const balances: BalanceAccount[] = [];

  for (const row of rows) {
    const accountName = row[colMap['accountName']] || '';
    if (!accountName) continue; // Skip empty rows

    // Extract values from columns
    const openingBalance = parseFloat(row[colMap['openingBalance']] || '0');
    const netChange = parseFloat(row[colMap['netChange']] || '0');
    const currentBalance = parseFloat(row[colMap['currentBalance']] || '0');
    const lastTxnAt = row[colMap['lastTxnAt']] || null;
    const inflow = parseFloat(row[colMap['inflow(+)']] || '0');
    const outflow = parseFloat(row[colMap['outflow(-)']] || '0');
    const note = row[colMap['note']] || '';

    balances.push({
      accountName,
      openingBalance,
      netChange,
      currentBalance,
      lastTxnAt,
      inflow,
      outflow,
      note
    });
  }

  // Apply month filter in-memory if not ALL
  if (month !== 'ALL') {
    // For now, return all balances with a note
    // In production, you'd need to re-compute filtered values from Ledger
    console.warn('[Balance API] Month filtering on Balance Summary not yet implemented. Returning ALL.');
  }

  return balances;
}

/**
 * Compute balances from Ledger + Accounts
 */
async function computeFromLedger(
  sheets: any,
  spreadsheetId: string,
  ledger: any,
  accounts: any,
  month: string,
  cacheBust: number
): Promise<BalanceAccount[]> {
  // Read Accounts (opening balances)
  const accountsRange = `'${accounts.title}'!A2:${colIndexToLetter(Math.max(...Object.values(accounts.colIndexByName) as number[]))}`;
  
  console.log('[Balance API] Reading accounts from:', accountsRange);
  
  const accountsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: accountsRange
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'X-Cache-Bust': cacheBust.toString()
    }
  });

  const accountRows = accountsResponse.data.values || [];
  const accountMap = new Map<string, { openingBalance: number; note: string }>();

  for (const row of accountRows) {
    const name = row[accounts.colIndexByName['accountName']] || '';
    if (!name) continue;

    const openingBalance = parseFloat(row[accounts.colIndexByName['openingBalance']] || '0');
    const note = row[accounts.colIndexByName['note']] || '';

    accountMap.set(name, { openingBalance, note });
  }

  // Read Ledger (transactions)
  const ledgerRange = `'${ledger.title}'!A2:${colIndexToLetter(Math.max(...Object.values(ledger.colIndexByName) as number[]))}`;
  
  console.log('[Balance API] Reading ledger from:', ledgerRange);
  
  const ledgerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: ledgerRange
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'X-Cache-Bust': cacheBust.toString()
    }
  });

  const ledgerRows = ledgerResponse.data.values || [];

  // Aggregate by account
  interface AccountAggregation {
    inflow: number;
    outflow: number;
    lastTxnDate: Date | null;
  }

  const aggregations = new Map<string, AccountAggregation>();

  for (const row of ledgerRows) {
    const accountName = row[ledger.colIndexByName['accountName']] || '';
    const amount = parseFloat(row[ledger.colIndexByName['amount']] || '0');
    const dateStr = row[ledger.colIndexByName['date']] || '';
    const monthStr = (row[ledger.colIndexByName['month']] || '').toUpperCase();

    if (!accountName) continue;

    // Apply month filter
    if (month !== 'ALL' && monthStr !== month) continue;

    // Initialize aggregation if needed
    if (!aggregations.has(accountName)) {
      aggregations.set(accountName, {
        inflow: 0,
        outflow: 0,
        lastTxnDate: null
      });
    }

    const agg = aggregations.get(accountName)!;

    // Update inflow/outflow
    if (amount > 0) {
      agg.inflow += amount;
    } else {
      agg.outflow += Math.abs(amount);
    }

    // Update last transaction date
    if (dateStr) {
      const txnDate = new Date(dateStr);
      if (!agg.lastTxnDate || txnDate > agg.lastTxnDate) {
        agg.lastTxnDate = txnDate;
      }
    }
  }

  // Build final balances array
  const balances: BalanceAccount[] = [];

  for (const [accountName, { openingBalance, note }] of accountMap.entries()) {
    const agg = aggregations.get(accountName) || { inflow: 0, outflow: 0, lastTxnDate: null };
    
    const netChange = agg.inflow - agg.outflow;
    const currentBalance = openingBalance + netChange;

    balances.push({
      accountName,
      openingBalance,
      netChange,
      currentBalance,
      lastTxnAt: agg.lastTxnDate ? agg.lastTxnDate.toISOString() : null,
      inflow: agg.inflow,
      outflow: agg.outflow,
      note
    });
  }

  return balances;
}
