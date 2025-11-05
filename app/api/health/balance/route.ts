// Force Node.js runtime for Google Sheets API
export const runtime = 'nodejs';

/**
 * GET /api/health/balance
 * 
 * Diagnostic endpoint showing:
 * - Which tabs were auto-detected
 * - Header rows found
 * - Basic counts (first 50 rows)
 * - Any warnings or missing tabs
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSheetMeta } from '@/utils/sheetMetaDetector';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[Health/Balance] Starting diagnostic check...');

    // Setup Google Sheets API
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsJson) {
      return NextResponse.json({
        ok: false,
        error: 'Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable'
      }, { status: 500 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({
        ok: false,
        error: 'Missing GOOGLE_SHEET_ID environment variable'
      }, { status: 500 });
    }

    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Detect sheet structure
    console.log('[Health/Balance] Detecting sheet structure...');
    const metadata = await getSheetMeta(spreadsheetId, auth);

    // Get basic counts from each detected tab
    const sheets = google.sheets({ version: 'v4', auth });
    const counts: {
      accounts?: number;
      transactions?: number;
      ledgerRows?: number;
      activeAccounts?: number;
    } = {};

    // Cache-busting timestamp
    const cacheBust = Date.now();

    // Count Accounts
    if (metadata.detected.accounts) {
      const range = `'${metadata.detected.accounts.title}'!A2:A51`; // First 50 rows
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
      counts.accounts = rows.filter(row => row[0]).length;

      // Count active accounts (if "active?" column exists)
      const activeColIndex = metadata.detected.accounts.colIndexByName['active?'];
      if (activeColIndex !== undefined) {
        const activeRange = `'${metadata.detected.accounts.title}'!A2:Z51`;
        const activeResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: activeRange
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'X-Cache-Bust': cacheBust.toString()
          }
        });
        
        const activeRows = activeResponse.data.values || [];
        counts.activeAccounts = activeRows.filter(row => {
          const activeValue = row[activeColIndex]?.toString().toLowerCase();
          return activeValue === 'yes' || activeValue === 'true' || activeValue === '1';
        }).length;
      }
    }

    // Count Transactions
    if (metadata.detected.transactions) {
      const range = `'${metadata.detected.transactions.title}'!A2:A51`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'X-Cache-Bust': cacheBust.toString()
        }
      });
      
      const rows = response.data.values || [];
      counts.transactions = rows.filter(row => row[0]).length;
    }

    // Count Ledger rows
    if (metadata.detected.ledger) {
      const range = `'${metadata.detected.ledger.title}'!A2:A51`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'X-Cache-Bust': cacheBust.toString()
        }
      });
      
      const rows = response.data.values || [];
      counts.ledgerRows = rows.filter(row => row[0]).length;
    }

    // Get month filter value if Balance Summary exists
    let currentMonthFilter = 'ALL';
    if (metadata.detected.balanceSummary?.monthSelectorCellA1) {
      const monthCell = metadata.detected.balanceSummary.monthSelectorCellA1;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${metadata.detected.balanceSummary.title}'!${monthCell}`
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'X-Cache-Bust': cacheBust.toString()
        }
      });
      
      const value = response.data.values?.[0]?.[0];
      if (value) {
        currentMonthFilter = value.toString().toUpperCase();
      }
    }

    const totalMs = Date.now() - startTime;

    // Build response
    const response = {
      ok: true,
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      
      sheet: {
        id: spreadsheetId,
        name: 'Unified Balance Sheet',
        accessible: true,
        lastRead: new Date().toISOString(),
        cacheBustUsed: cacheBust
      },

      detected: {
        accounts: metadata.detected.accounts ? {
          title: metadata.detected.accounts.title,
          headers: metadata.detected.accounts.headers,
          headerRow: metadata.detected.accounts.headerRow,
          matchScore: metadata.detected.accounts.matchScore,
          columnMap: metadata.detected.accounts.colIndexByName
        } : null,

        transactions: metadata.detected.transactions ? {
          title: metadata.detected.transactions.title,
          headers: metadata.detected.transactions.headers,
          headerRow: metadata.detected.transactions.headerRow,
          matchScore: metadata.detected.transactions.matchScore,
          columnMap: metadata.detected.transactions.colIndexByName
        } : null,

        ledger: metadata.detected.ledger ? {
          title: metadata.detected.ledger.title,
          headers: metadata.detected.ledger.headers,
          headerRow: metadata.detected.ledger.headerRow,
          matchScore: metadata.detected.ledger.matchScore,
          columnMap: metadata.detected.ledger.colIndexByName
        } : null,

        balanceSummary: metadata.detected.balanceSummary ? {
          title: metadata.detected.balanceSummary.title,
          headers: metadata.detected.balanceSummary.headers,
          headerRow: metadata.detected.balanceSummary.headerRow,
          matchScore: metadata.detected.balanceSummary.matchScore,
          columnMap: metadata.detected.balanceSummary.colIndexByName,
          monthSelectorCell: metadata.detected.balanceSummary.monthSelectorCellA1,
          currentMonthFilter
        } : null
      },

      allSheets: metadata.allSheets,

      counts: {
        accounts: counts.accounts || 0,
        transactions: counts.transactions || 0,
        ledgerRows: counts.ledgerRows || 0,
        activeAccounts: counts.activeAccounts || counts.accounts || 0
      },

      warnings: metadata.warnings,

      performance: {
        totalMs
      }
    };

    console.log('[Health/Balance] Diagnostic complete:', {
      detected: Object.keys(metadata.detected),
      warnings: metadata.warnings.length,
      totalMs
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('[Health/Balance] Error:', error);
    
    return NextResponse.json({
      ok: false,
      status: 'down' as const,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        totalMs: Date.now() - startTime
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
