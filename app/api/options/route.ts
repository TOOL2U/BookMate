import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { getAccountFromRequest, NoAccountError, NotAuthenticatedError } from '@/lib/api/auth-middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory cache for options data (5 minutes - options change infrequently)
// Cache is now account-specific
interface OptionsCacheEntry {
  data: any;
  timestamp: number;
  accountId: string;
}
const optionsCache = new Map<string, OptionsCacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getCachedOptions(accountId: string): any | null {
  const cached = optionsCache.get(accountId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedOptions(accountId: string, data: any): void {
  optionsCache.set(accountId, { data, timestamp: Date.now(), accountId });
}

/**
 * GET /api/options
 * 
 * Single source of truth for all dropdown options and analytics data.
 * Data is fetched directly from Google Sheets (master Data sheet + Lists rollups).
 * 
 * Returns DUAL format for backward compatibility and future analytics:
 * - Plain string arrays (properties, typeOfOperation, typeOfPayment, revenueCategories) for dropdowns
 * - Rich objects (propertiesRich, typeOfOperations, typeOfPayments, revenues) with monthly data
 * 
 * Month alignment uses P&L (DO NOT EDIT)!E4:P4.
 * THB values parsed from ฿ 50,000 → 50000.
 * 
 * Response format:
 * {
 *   "ok": true,
 *   "data": {
 *     // Plain arrays for dropdowns (backward compat)
 *     "properties": string[],
 *     "typeOfOperation": string[],
 *     "typeOfPayment": string[],
 *     "revenueCategories": string[],
 *     
 *     // Rich objects for analytics
 *     "propertiesRich": [{ name, monthly, yearTotal }, ...],
 *     "typeOfOperations": [{ name, monthly, yearTotal }, ...],
 *     "typeOfPayments": [{ name, monthly, yearTotal }, ...],
 *     "revenues": [{ name, monthly, yearTotal }, ...]
 *   },
 *   "updatedAt": "2025-11-04T...",
 *   "source": "google_sheets_lists+data"
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromRequest(request);
    } catch (error) {
      if (error instanceof NotAuthenticatedError) {
        return NextResponse.json(
          { ok: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }
      if (error instanceof NoAccountError) {
        return NextResponse.json(
          { ok: false, error: 'NO_ACCOUNT_FOUND', message: 'No account configured for your email' },
          { status: 403 }
        );
      }
      throw error;
    }

    // Check cache first (account-specific)
    const cached = getCachedOptions(account.accountId);
    if (cached) {
      console.log(`✅ [OPTIONS] Returning cached data for account ${account.accountId}`);
      const cacheEntry = optionsCache.get(account.accountId);
      return new NextResponse(JSON.stringify({
        ...cached,
        cached: true,
        cacheAge: cacheEntry ? Math.floor((Date.now() - cacheEntry.timestamp) / 1000) : 0
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
          'x-options-source': 'cache'
        }
      });
    }

    // Read the live dropdowns config file for properties and operations
    const configPath = path.join(process.cwd(), 'config', 'live-dropdowns.json');
    
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      console.error('[OPTIONS] Config file not found:', configPath);
      return new NextResponse(JSON.stringify(
        {
          ok: false,
          error: 'Dropdown options not available. Please run sync script first.',
          data: null
        }
      ), { 
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store, max-age=0'
        }
      });
    }

    // Read and parse the config file
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    // Extract dropdown options for properties and operations (will be overwritten by Google Sheets if available)
    let properties = config.property || [];
    let typeOfOperations = config.typeOfOperation || [];
    let normalizedPaymentTypeNames: string[] = [];
    let normalizedRevenues: string[] = [];

    // Fetch payment types from Google Sheets (matching P&L formula structure)
    let typeOfPayments: any[] = [];
    let propertiesRich: any[] = [];
    let typeOfOperationsRich: any[] = [];
    let revenuesRich: any[] = [];
    
    try {
      // Setup Google Sheets API using environment variable (works in both local and production)
      const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      if (!credentialsJson) {
        console.warn('[OPTIONS] GOOGLE_SERVICE_ACCOUNT_KEY not found; falling back to config-only for payments');
      } else {
        const credentials = JSON.parse(credentialsJson);
        // Fix escaped newlines in private_key (\\n -> \n)
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Use account-specific sheet ID
        const spreadsheetId = account.sheetId;
        if (!spreadsheetId) {
          console.error(`[OPTIONS] Account ${account.accountId} missing sheetId`);
          throw new Error('Account missing Google Sheet ID');
        }

        console.log(`[OPTIONS] Fetching all data from Google Sheets for account ${account.accountId}...`);
        
        // Add cache-busting timestamp to force fresh data from Google Sheets API
        // Google Sheets API caches responses for 5-10 minutes, this bypasses that cache
        const cacheBuster = Date.now();
        console.log(`[OPTIONS] Cache-bust timestamp: ${cacheBuster}`);
        
        // Fetch all required ranges in a single batch request
        // This matches the P&L sheet structure and Lists data blocks
        const batchResponse = await sheets.spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: [
            // Category columns from Data sheet
            // Column A = REVENUES, B = OVERHEAD EXPENSES, C = PROPERTY, D = TYPE OF PAYMENT
            "Data!A2:A",  // Revenues (will be combined with B for typeOfOperations)
            "Data!B2:B",  // Overhead Expenses (will be combined with A for typeOfOperations)
            "Data!C2:C",  // Properties
            "Data!D2:D",  // Payment Types
            
            // Lists: Overhead (Expenses) - Category, Month, Value
            "Lists!H:H",  // Overhead Category
            "Lists!I:I",  // Overhead Month
            "Lists!J:J",  // Overhead Value
            
            // Lists: Property - Category, Month, Value
            "Lists!M:M",  // Property Category
            "Lists!N:N",  // Property Month
            "Lists!O:O",  // Property Value
            
            // Lists: Payment - Category, Month, Value
            "Lists!R:R",  // Payment Category
            "Lists!S:S",  // Payment Month
            "Lists!T:T",  // Payment Value
            
            // Lists: Revenue - Category, Month, Value
            "Lists!W:W",  // Revenue Category
            "Lists!X:X",  // Revenue Month
            "Lists!Y:Y",  // Revenue Value
            
            // Month headers from P&L sheet
            "'P&L (DO NOT EDIT)'!E4:P4"  // Only columns E to P on row 4 (month headers)
          ]
        }, {
          // Add headers to bypass Google Sheets API cache
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Cache-Bust': cacheBuster.toString(),
          }
        });

        const valueRanges = batchResponse.data.valueRanges || [];
        
        // Destructure all ranges in order
        const [
          dataRevenuesRange,        // Data!A2:A - Revenue categories
          dataOverheadRange,        // Data!B2:B - Overhead/Expense categories
          dataPropertiesRange,      // Data!C2:C - Properties
          dataPaymentTypesRange,    // Data!D2:D - Payment types
          listsOverheadCatRange,    // Lists!H:H
          listsOverheadMonthRange,  // Lists!I:I
          listsOverheadValueRange,  // Lists!J:J
          listsPropertyCatRange,    // Lists!M:M
          listsPropertyMonthRange,  // Lists!N:N
          listsPropertyValueRange,  // Lists!O:O
          listsPaymentCatRange,     // Lists!R:R
          listsPaymentMonthRange,   // Lists!S:S
          listsPaymentValueRange,   // Lists!T:T
          listsRevenueCatRange,     // Lists!W:W
          listsRevenueMonthRange,   // Lists!X:X
          listsRevenueValueRange,   // Lists!Y:Y
          monthHeadersRange         // P&L E4:P4
        ] = valueRanges;
        
        // ========================================
        // EXTRACT PROPERTIES (Data!C2:C)
        // ========================================
        const propertyRows = dataPropertiesRange?.values || [];
        const propertyNames: string[] = [];
        
        for (let i = 0; i < propertyRows.length; i++) {
          const rawValue = propertyRows[i]?.[0];
          const name = String(rawValue || '').trim();
          if (name && !['PROPERTY', 'Property'].includes(name)) {
            propertyNames.push(name);
          }
        }
        
        // Normalize, dedupe, preserve order (same logic as Payments)
        const seenProperties = new Set<string>();
        const normalizedProperties: string[] = [];
        propertyNames.forEach(n => {
          const name = String(n || '').trim();
          if (name && !seenProperties.has(name)) {
            seenProperties.add(name);
            normalizedProperties.push(name);
          }
        });
        
        properties = normalizedProperties;
        console.log(`[OPTIONS] Found ${properties.length} properties from Data!C2:C`);
        
        // ========================================
        // EXTRACT OPERATIONS (Data!A2:A + Data!B2:B)
        // Combine Revenues (A) and Overhead Expenses (B)
        // ALWAYS add "Transfer" as a valid operation type
        // ========================================
        const revenueRows = dataRevenuesRange?.values || [];
        const overheadRows = dataOverheadRange?.values || [];
        const operationNames: string[] = [];
        
        // Add all revenues
        for (let i = 0; i < revenueRows.length; i++) {
          const rawValue = revenueRows[i]?.[0];
          const name = String(rawValue || '').trim();
          if (name && !['REVENUES', 'Revenue'].includes(name)) {
            operationNames.push(name);
          }
        }
        
        // Add all overhead/expenses
        for (let i = 0; i < overheadRows.length; i++) {
          const rawValue = overheadRows[i]?.[0];
          const name = String(rawValue || '').trim();
          if (name && !['OVERHEAD EXPENSES', 'EXPENSES', 'Expense'].includes(name)) {
            operationNames.push(name);
          }
        }
        
        // Normalize, dedupe, preserve order (same logic as Payments)
        const seenOperations = new Set<string>();
        const normalizedOperations: string[] = [];
        operationNames.forEach(n => {
          const name = String(n || '').trim();
          if (name && !seenOperations.has(name)) {
            seenOperations.add(name);
            normalizedOperations.push(name);
          }
        });
        
        // ALWAYS add "Transfer" to the list if not already present
        if (!normalizedOperations.includes('Transfer')) {
          normalizedOperations.push('Transfer');
        }
        
        // REMOVE old transfer formats to prevent confusion
        // Only "Transfer" should be used for transfers (not "EXP - Transfer" or "Revenue - Transfer")
        typeOfOperations = normalizedOperations.filter(op => 
          op !== 'EXP - Transfer' && op !== 'Revenue - Transfer'
        );
        
        console.log(`[OPTIONS] Found ${typeOfOperations.length} operations from Data!A2:A + Data!B2:B + Transfer`);
        console.log(`[OPTIONS] Transfer included: ${typeOfOperations.includes('Transfer')}`);
        console.log(`[OPTIONS] Old transfer formats removed: EXP - Transfer, Revenue - Transfer`);

        
        // ========================================
        // EXTRACT PAYMENT TYPES (Data!D2:D)
        // ========================================
        const categoryRows = dataPaymentTypesRange?.values || [];
        const paymentTypeNames: string[] = [];
        
        for (let i = 0; i < categoryRows.length; i++) {
          const name = categoryRows[i]?.[0]?.trim();
          // Skip empty rows and header-like values
          if (name && !['PAYMENT TYPE', 'Type of Payment', 'TYPE OF PAYMENT'].includes(name)) {
            paymentTypeNames.push(name);
          }
        }

        // Normalize, dedupe, preserve order
        const seen = new Set<string>();
        normalizedPaymentTypeNames = [];
        paymentTypeNames.forEach(n => {
          const name = n.trim();
          if (name && !seen.has(name)) {
            seen.add(name);
            normalizedPaymentTypeNames.push(name);
          }
        });
        
        console.log(`[OPTIONS] Found ${normalizedPaymentTypeNames.length} payment type categories from Data!D2:D`);
        console.log(`[OPTIONS] Categories:`, normalizedPaymentTypeNames);

        // Extract month headers from P&L sheet (E4:P4 only)
        const monthHeaders = (monthHeadersRange?.values?.[0] || []).map(m => (m || '').toString().toUpperCase()).filter(Boolean);
        // Map MONTH name -> 0..11 index based on position within E..P
        const monthIndexOf = (label: string): number => {
          const idx = monthHeaders.indexOf((label || '').toString().toUpperCase());
          return idx; // returns -1 if not found
        };
        
        console.log(`[OPTIONS] Month headers:`, monthHeaders);

        // ========================================
        // HELPER: Parse THB value (฿ 50,000 → 50000)
        // ========================================
        const parseTHB = (valueStr: any): number => {
          if (typeof valueStr === 'number') return valueStr;
          return parseFloat(String(valueStr || '').replace(/[^\d.-]/g, '')) || 0;
        };

        // ========================================
        // BUILD RICH OBJECTS: Payments (Lists!R:S:T)
        // ========================================
        const paymentCatRows = listsPaymentCatRange?.values || [];
        const paymentMonthRows = listsPaymentMonthRange?.values || [];
        const paymentValueRows = listsPaymentValueRange?.values || [];
        
        const paymentMap = new Map<string, { name: string; monthly: number[]; yearTotal: number }>();
        
        // Initialize all payment type categories with zero values
        normalizedPaymentTypeNames.forEach(name => {
          paymentMap.set(name, {
            name,
            monthly: new Array(12).fill(0),
            yearTotal: 0
          });
        });
        
        // Populate values from Lists columns (R=Category, S=Month, T=Value)
        let maxRows = Math.max(paymentCatRows.length, paymentMonthRows.length, paymentValueRows.length);
        
        for (let i = 1; i < maxRows; i++) { // Skip header row
          const category = paymentCatRows[i]?.[0];
          const month = paymentMonthRows[i]?.[0];
          const valueStr = paymentValueRows[i]?.[0];
          
          if (!category || !month) continue;
          
          const value = parseTHB(valueStr);
          const payment = paymentMap.get(category);
          
          if (payment) {
            const idx = monthIndexOf(month);
            if (idx >= 0 && idx < 12) {
              payment.monthly[idx] = value;
              payment.yearTotal += value;
            }
          }
        }
        
        // Build final array maintaining order from Data!D2:D
        typeOfPayments = normalizedPaymentTypeNames.map(name => paymentMap.get(name)!);

        // Safety: ensure we return an entry for each declared name
        if (typeOfPayments.length !== normalizedPaymentTypeNames.length) {
          typeOfPayments = normalizedPaymentTypeNames.map(n => paymentMap.get(n) || ({ name: n, monthly: new Array(12).fill(0), yearTotal: 0 }));
        }
        
        console.log(`[OPTIONS] Built ${typeOfPayments.length} payment types with monthly data`);

        // ========================================
        // BUILD RICH OBJECTS: Properties (Lists!M:N:O)
        // ========================================
        const propertyCatRows = listsPropertyCatRange?.values || [];
        const propertyMonthRows = listsPropertyMonthRange?.values || [];
        const propertyValueRows = listsPropertyValueRange?.values || [];
        
        const propertyRichMap = new Map<string, { name: string; monthly: number[]; yearTotal: number }>();
        
        // Initialize all properties with zero values
        normalizedProperties.forEach(name => {
          propertyRichMap.set(name, {
            name,
            monthly: new Array(12).fill(0),
            yearTotal: 0
          });
        });
        
        maxRows = Math.max(propertyCatRows.length, propertyMonthRows.length, propertyValueRows.length);
        
        for (let i = 1; i < maxRows; i++) { // Skip header row
          const category = propertyCatRows[i]?.[0];
          const month = propertyMonthRows[i]?.[0];
          const valueStr = propertyValueRows[i]?.[0];
          
          if (!category || !month) continue;
          
          const value = parseTHB(valueStr);
          const property = propertyRichMap.get(category);
          
          if (property) {
            const idx = monthIndexOf(month);
            if (idx >= 0 && idx < 12) {
              property.monthly[idx] = value;
              property.yearTotal += value;
            }
          }
        }
        
        propertiesRich = normalizedProperties.map(name => propertyRichMap.get(name)!);
        console.log(`[OPTIONS] Built ${propertiesRich.length} properties with monthly data`);

        // ========================================
        // BUILD RICH OBJECTS: Operations (Lists!H:I:J for overhead)
        // Note: This currently only includes overhead expenses from Lists!H:I:J
        // Revenue operations would come from Lists!W:X:Y (handled separately below)
        // ========================================
        const overheadCatRows = listsOverheadCatRange?.values || [];
        const overheadMonthRows = listsOverheadMonthRange?.values || [];
        const overheadValueRows = listsOverheadValueRange?.values || [];
        
        const operationRichMap = new Map<string, { name: string; monthly: number[]; yearTotal: number }>();
        
        // Initialize all operations with zero values
        normalizedOperations.forEach(name => {
          operationRichMap.set(name, {
            name,
            monthly: new Array(12).fill(0),
            yearTotal: 0
          });
        });
        
        maxRows = Math.max(overheadCatRows.length, overheadMonthRows.length, overheadValueRows.length);
        
        for (let i = 1; i < maxRows; i++) { // Skip header row
          const category = overheadCatRows[i]?.[0];
          const month = overheadMonthRows[i]?.[0];
          const valueStr = overheadValueRows[i]?.[0];
          
          if (!category || !month) continue;
          
          const value = parseTHB(valueStr);
          const operation = operationRichMap.get(category);
          
          if (operation) {
            const idx = monthIndexOf(month);
            if (idx >= 0 && idx < 12) {
              operation.monthly[idx] = value;
              operation.yearTotal += value;
            }
          }
        }
        
        typeOfOperationsRich = normalizedOperations.map(name => operationRichMap.get(name)!);
        console.log(`[OPTIONS] Built ${typeOfOperationsRich.length} operations with monthly data`);

        // ========================================
        // BUILD RICH OBJECTS: Revenues (Lists!W:X:Y)
        // ========================================
        const revenueCatRows = listsRevenueCatRange?.values || [];
        const revenueMonthRows = listsRevenueMonthRange?.values || [];
        const revenueValueRows = listsRevenueValueRange?.values || [];
        
        // Extract revenue category names from Data!A2:A
        const revenueCategoryNames: string[] = [];
        for (let i = 0; i < revenueRows.length; i++) {
          const rawValue = revenueRows[i]?.[0];
          const name = String(rawValue || '').trim();
          if (name && !['REVENUES', 'Revenue'].includes(name)) {
            revenueCategoryNames.push(name);
          }
        }
        
        // Normalize revenue categories
        const seenRevenues = new Set<string>();
        normalizedRevenues = [];
        revenueCategoryNames.forEach(n => {
          const name = String(n || '').trim();
          if (name && !seenRevenues.has(name)) {
            seenRevenues.add(name);
            normalizedRevenues.push(name);
          }
        });
        
        const revenueRichMap = new Map<string, { name: string; monthly: number[]; yearTotal: number }>();
        
        // Initialize all revenues with zero values
        normalizedRevenues.forEach(name => {
          revenueRichMap.set(name, {
            name,
            monthly: new Array(12).fill(0),
            yearTotal: 0
          });
        });
        
        maxRows = Math.max(revenueCatRows.length, revenueMonthRows.length, revenueValueRows.length);
        
        for (let i = 1; i < maxRows; i++) { // Skip header row
          const category = revenueCatRows[i]?.[0];
          const month = revenueMonthRows[i]?.[0];
          const valueStr = revenueValueRows[i]?.[0];
          
          if (!category || !month) continue;
          
          const value = parseTHB(valueStr);
          const revenue = revenueRichMap.get(category);
          
          if (revenue) {
            const idx = monthIndexOf(month);
            if (idx >= 0 && idx < 12) {
              revenue.monthly[idx] = value;
              revenue.yearTotal += value;
            }
          }
        }
        
        revenuesRich = normalizedRevenues.map(name => revenueRichMap.get(name)!);
        console.log(`[OPTIONS] Built ${revenuesRich.length} revenues with monthly data`);
      }
    } catch (error) {
      console.error('[OPTIONS] Error fetching payment types from Google Sheets:', error);
      // Fallback to config file payment types (simple list)
      typeOfPayments = (config.typeOfPayment || []).map((name: string) => ({
        name,
        monthly: new Array(12).fill(0),
        yearTotal: 0
      }));
    }
    
    // If no payment types from Sheets, use config fallback
    if (typeOfPayments.length === 0) {
      typeOfPayments = (config.typeOfPayment || []).map((name: string) => ({
        name,
        monthly: new Array(12).fill(0),
        yearTotal: 0
      }));
    }

    // Get the last updated timestamp
    const updatedAt = new Date().toISOString();

    // Build dual-format response
    // Plain string arrays for backward compatibility + Rich objects for analytics
    const response = {
      ok: true,
      data: {
        // Plain string arrays for dropdowns (backward compatibility)
        properties,
        typeOfOperation: typeOfOperations,
        typeOfPayment: normalizedPaymentTypeNames || typeOfPayments.map(p => p.name),
        revenueCategories: normalizedRevenues || [],
        
        // Rich objects for analytics (P&L, Balance)
        propertiesRich,
        typeOfOperations: typeOfOperationsRich,
        typeOfPayments,
        revenues: revenuesRich
      },
      updatedAt,
      cached: false,
      source: 'google_sheets_lists+data',
      metadata: {
        totalProperties: properties.length,
        totalOperations: typeOfOperations.length,
        totalPayments: typeOfPayments.length,
        totalRevenues: (normalizedRevenues || []).length
      }
    };

    console.log('[OPTIONS] Successfully returned dropdown options (dual format)');
    console.log(`[OPTIONS] Plain: Properties=${properties.length}, Operations=${typeOfOperations.length}, Payments=${typeOfPayments.length}, Revenues=${(normalizedRevenues || []).length}`);
    console.log(`[OPTIONS] Rich: Properties=${propertiesRich.length}, Operations=${typeOfOperationsRich.length}, Payments=${typeOfPayments.length}, Revenues=${revenuesRich.length}`);

    // Cache the response (account-specific)
    setCachedOptions(account.accountId, response);

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 mins
        'x-options-source': 'google_sheets_lists+data'
      }
    });

  } catch (error) {
    console.error('[OPTIONS] Error reading dropdown options:', error);
    
    return new NextResponse(JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load dropdown options',
        data: null
      }
    ), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0'
      }
    });
  }
}
