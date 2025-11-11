/**
 * Sheet Metadata Detector
 * 
 * Automatically detects tab structure by matching header signatures.
 * No hardcoded tab names - purely header-based detection.
 */

import { google } from 'googleapis';

// In-memory cache for sheet metadata (5 minute TTL)
const METADATA_CACHE = new Map<string, { data: SheetMetadata; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Header signatures for each tab type
// Multiple variations to handle different formatting (spaces, case, etc.)
const TAB_SIGNATURES = {
  accounts: {
    required: [
      ['accountName', 'accountname', 'account_name', 'account name'],
      ['openingBalance', 'openingbalance', 'opening_balance', 'opening balance']
    ],
    optional: [
      ['active?', 'active', 'isactive', 'is active'],
      ['note', 'notes', 'description']
    ]
  },
  transactions: {
    required: [
      ['timestamp', 'time', 'date', 'datetime', 'txndate', 'transaction date'],
      ['fromAccount', 'fromaccount', 'from_account', 'from account', 'from'],
      ['toAccount', 'toaccount', 'to_account', 'to account', 'to'],
      ['transactionType', 'transactiontype', 'transaction_type', 'transaction type', 'type', 'txntype'],
      ['amount', 'value', 'sum']
    ],
    optional: [
      ['currency', 'curr'],
      ['note', 'notes', 'description'],
      ['referenceID', 'referenceid', 'reference_id', 'reference id', 'ref', 'refid'],
      ['user', 'username', 'createdby', 'created by'],
      ['balanceAfter', 'balanceafter', 'balance_after', 'balance after', 'balance']
    ]
  },
  ledger: {
    required: [
      ['date', 'txndate', 'transaction date', 'timestamp'],
      ['accountName', 'accountname', 'account_name', 'account name', 'account'],
      ['amount', 'value', 'sum', 'debit/credit', 'debitcredit', 'delta', 'change'],
      ['month', 'monthname', 'month name', 'period']
    ],
    optional: []
  },
  balanceSummary: {
    required: [
      ['accountName', 'accountname', 'account_name', 'account name', 'account'],
      ['openingBalance', 'openingbalance', 'opening_balance', 'opening balance', 'opening'],
      ['netChange', 'netchange', 'net_change', 'net change', 'change'],
      ['currentBalance', 'currentbalance', 'current_balance', 'current balance', 'balance', 'closing balance', 'closingbalance']
    ],
    optional: [
      ['lastTxnAt', 'lasttxnat', 'last_txn_at', 'last txn at', 'last transaction', 'lasttransaction'],
      ['inflow(+)', 'inflow', 'in', 'credits', 'revenue'],
      ['outflow(-)', 'outflow', 'out', 'debits', 'expense'],
      ['note', 'notes', 'description', 'status']
    ]
  }
};

export interface ColumnMap {
  [headerName: string]: number; // header name -> 0-based column index
}

export interface DetectedTab {
  title: string;
  sheetId: number;
  index: number;
  headerRow?: number; // 0-based: which row contains the headers (0=row1, 1=row2, 2=row3)
  colIndexByName: ColumnMap;
  headers: string[];
  matchScore: number; // Higher = better match
  monthSelectorCellA1?: string; // Only for Balance Summary
}

export interface SheetMetadata {
  sheetId: string;
  detected: {
    accounts?: DetectedTab;
    transactions?: DetectedTab;
    ledger?: DetectedTab;
    balanceSummary?: DetectedTab;
  };
  allSheets: Array<{
    title: string;
    sheetId: number;
    index: number;
  }>;
  warnings: string[];
  detectedAt: string;
}

/**
 * Normalize header for comparison (lowercase, trim, no special chars)
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Score how well a header row matches a signature
 * Returns: { score, matches, colIndexByName }
 */
function scoreTabMatch(
  headers: string[],
  signature: { required: string[][] | string[]; optional: string[][] | string[] }
): { score: number; matches: string[]; colIndexByName: ColumnMap } {
  const normalizedHeaders = headers.map(h => normalizeHeader(h || ''));
  const colIndexByName: ColumnMap = {};
  const matches: string[] = [];
  let score = 0;

  // Normalize required headers to array of arrays
  const requiredHeaders = Array.isArray(signature.required[0]) 
    ? signature.required as string[][]
    : (signature.required as string[]).map(h => [h]);

  // Check required headers (must match at least one alternative)
  for (const reqHeaderAlternatives of requiredHeaders) {
    let found = false;
    let foundIndex = -1;
    let matchedVariant = '';

    for (const variant of reqHeaderAlternatives) {
      const normalized = normalizeHeader(variant);
      const index = normalizedHeaders.indexOf(normalized);
      
      if (index !== -1) {
        found = true;
        foundIndex = index;
        matchedVariant = reqHeaderAlternatives[0]; // Use first (canonical) name
        break;
      }
    }

    if (found) {
      colIndexByName[matchedVariant] = foundIndex;
      matches.push(matchedVariant);
      score += 10; // Required header found = 10 points
      
      // Bonus for leftmost position (prefer tabs with headers in expected order)
      score += (100 - foundIndex) * 0.1;
    } else {
      // Missing required header = disqualified (score = 0)
      return { score: 0, matches: [], colIndexByName: {} };
    }
  }

  // Normalize optional headers to array of arrays
  const optionalHeaders = Array.isArray(signature.optional[0])
    ? signature.optional as string[][]
    : (signature.optional as string[]).map(h => [h]);

  // Check optional headers (bonus points)
  for (const optHeaderAlternatives of optionalHeaders) {
    let found = false;
    let foundIndex = -1;
    let matchedVariant = '';

    for (const variant of optHeaderAlternatives) {
      const normalized = normalizeHeader(variant);
      const index = normalizedHeaders.indexOf(normalized);
      
      if (index !== -1) {
        found = true;
        foundIndex = index;
        matchedVariant = optHeaderAlternatives[0]; // Use first (canonical) name
        break;
      }
    }

    if (found) {
      colIndexByName[matchedVariant] = foundIndex;
      matches.push(matchedVariant);
      score += 2; // Optional header found = 2 points
    }
  }

  return { score, matches, colIndexByName };
}

/**
 * Find the Month Filter cell in Balance Summary tab
 * Looks for a cell containing "Month Filter" label and returns the adjacent cell
 */
function findMonthSelectorCell(
  rowData: string[][],
  sheetTitle: string
): string | undefined {
  // Search first 5 rows for "Month Filter" label
  for (let rowIdx = 0; rowIdx < Math.min(5, rowData.length); rowIdx++) {
    const row = rowData[rowIdx] || [];
    
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellValue = (row[colIdx] || '').toString().toLowerCase();
      
      if (cellValue.includes('month') && cellValue.includes('filter')) {
        // Found label - month value is typically in next column or same row
        const nextColValue = row[colIdx + 1] || '';
        
        if (nextColValue) {
          // Return A1 notation (e.g., "B1" if month is in column B, row 1)
          const colLetter = String.fromCharCode(65 + colIdx + 1); // Next column
          const a1Notation = `${colLetter}${rowIdx + 1}`;
          return a1Notation;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Main function: Detect all tabs in a Google Sheet by header signatures
 * Includes 5-minute in-memory cache to avoid repeated expensive API calls
 */
export async function getSheetMeta(
  spreadsheetId: string,
  auth: any
): Promise<SheetMetadata> {
  // Check cache first
  const cached = METADATA_CACHE.get(spreadsheetId);
  const now = Date.now();
  
  if (cached && cached.expiresAt > now) {
    console.log('[SheetMeta] Using cached metadata (expires in', Math.round((cached.expiresAt - now) / 1000), 'seconds)');
    return cached.data;
  }
  
  console.log('[SheetMeta] Cache miss or expired, fetching fresh metadata...');
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  const warnings: string[] = [];
  const detected: SheetMetadata['detected'] = {};

  try {
    // Fetch sheet metadata with first 2 rows of data for header detection
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: [] // Get all sheets, we'll check each one
    });

    const allSheets = (response.data.sheets || []).map((sheet, index) => ({
      title: sheet.properties?.title || `Sheet${index + 1}`,
      sheetId: sheet.properties?.sheetId || index,
      index
    }));

    // Track best matches for each tab type
    const candidates: {
      [key: string]: Array<{ sheet: any; score: number; match: ReturnType<typeof scoreTabMatch> }>
    } = {
      accounts: [],
      transactions: [],
      ledger: [],
      balanceSummary: []
    };

    // Analyze each sheet
    for (const sheet of response.data.sheets || []) {
      const sheetTitle = sheet.properties?.title || '';
      const sheetId = sheet.properties?.sheetId || 0;
      const sheetIndex = sheet.properties?.index || 0;
      
      // Get first 3 rows (in case headers are in row 2 or 3)
      const rowData = sheet.data?.[0]?.rowData || [];
      if (rowData.length === 0) continue;

      // Check first 3 rows for headers
      const rowsToCheck = Math.min(3, rowData.length);
      
      for (let rowIdx = 0; rowIdx < rowsToCheck; rowIdx++) {
        const row = rowData[rowIdx]?.values || [];
        const headers = row.map((cell: any) => 
          cell?.formattedValue || cell?.userEnteredValue?.stringValue || ''
        );

        if (headers.length === 0) continue;

        // Test against each signature
        for (const [tabType, signature] of Object.entries(TAB_SIGNATURES)) {
          const match = scoreTabMatch(headers, signature);
          
          if (match.score > 0) {
            candidates[tabType].push({
              sheet: { title: sheetTitle, sheetId, index: sheetIndex, headerRow: rowIdx },
              score: match.score,
              match
            });
          }
        }
      }
    }

    // Select best match for each tab type
    for (const [tabType, tabCandidates] of Object.entries(candidates)) {
      if (tabCandidates.length === 0) {
        warnings.push(`No tab found matching "${tabType}" signature`);
        continue;
      }

      // Sort by score (highest first)
      tabCandidates.sort((a, b) => b.score - a.score);
      const best = tabCandidates[0];

      const detectedTab: DetectedTab = {
        title: best.sheet.title,
        sheetId: best.sheet.sheetId,
        index: best.sheet.index,
        headerRow: best.sheet.headerRow,
        colIndexByName: best.match.colIndexByName,
        headers: best.match.matches,
        matchScore: best.score
      };

      // For Balance Summary, find month selector cell
      if (tabType === 'balanceSummary') {
        const sheetData = response.data.sheets?.[best.sheet.index];
        const rawRowData = sheetData?.data?.[0]?.rowData || [];
        // Convert Schema$RowData to simple arrays
        const rowData = rawRowData.map(row => 
          (row.values || []).map(cell => cell?.formattedValue || cell?.userEnteredValue?.stringValue || '')
        );
        const monthCell = findMonthSelectorCell(rowData, best.sheet.title);
        
        if (monthCell) {
          detectedTab.monthSelectorCellA1 = monthCell;
        }
      }

      detected[tabType as keyof typeof detected] = detectedTab;

      // Warn if multiple matches
      if (tabCandidates.length > 1) {
        const otherTitles = tabCandidates.slice(1).map(c => c.sheet.title).join(', ');
        warnings.push(
          `Multiple tabs match "${tabType}" signature. ` +
          `Using "${best.sheet.title}" (score: ${best.score}). ` +
          `Alternatives: ${otherTitles}`
        );
      }
    }

    const metadata: SheetMetadata = {
      sheetId: spreadsheetId,
      detected,
      allSheets,
      warnings,
      detectedAt: new Date().toISOString()
    };

    // Store in cache
    METADATA_CACHE.set(spreadsheetId, {
      data: metadata,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
    
    console.log('[SheetMeta] Cached metadata for 5 minutes');

    return metadata;

  } catch (error) {
    console.error('[SheetMetaDetector] Error:', error);
    throw new Error(
      `Failed to detect sheet structure: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Helper: Get column letter from index (0 = A, 1 = B, etc.)
 */
export function colIndexToLetter(index: number): string {
  let letter = '';
  let num = index;
  
  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }
  
  return letter;
}

/**
 * Helper: Build A1 range notation from tab name and column map
 */
export function buildRange(
  tabTitle: string,
  colName: string,
  colMap: ColumnMap,
  startRow: number = 2,
  endRow?: number
): string {
  const colIndex = colMap[colName];
  if (colIndex === undefined) {
    throw new Error(`Column "${colName}" not found in column map`);
  }
  
  const colLetter = colIndexToLetter(colIndex);
  const range = endRow 
    ? `'${tabTitle}'!${colLetter}${startRow}:${colLetter}${endRow}`
    : `'${tabTitle}'!${colLetter}${startRow}:${colLetter}`;
  
  return range;
}
