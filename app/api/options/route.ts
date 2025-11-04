import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/options
 * 
 * Returns all dropdown options and payment type data.
 * Data is fetched directly from Google Sheets Lists!R:T for payment types with monthly values.
 * Other categories are read from config/live-dropdowns.json.
 * 
 * Note: months are aligned using P&L E4:P4, not entire row 4.
 * 
 * Response format:
 * {
 *   "ok": true,
 *   "data": {
 *     "properties": [...],
 *     "typeOfOperations": [...],
 *     "typeOfPayments": [{ name, monthly, yearTotal }, ...]
 *   },
 *   "updatedAt": "2025-10-30T09:38:11.978Z"
 * }
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch payment types from Google Sheets (matching P&L formula structure)
    let typeOfPayments: any[] = [];
    
    try {
      // Setup Google Sheets API
      const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
      if (!fs.existsSync(credentialsPath)) {
        console.warn('[OPTIONS] google-credentials.json not found; falling back to config-only for payments');
      } else {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
          console.error('[OPTIONS] Missing GOOGLE_SHEET_ID env');
          throw new Error('Missing GOOGLE_SHEET_ID');
        }

        console.log('[OPTIONS] Fetching all data from Google Sheets...');
        
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
        
        typeOfOperations = normalizedOperations;
        console.log(`[OPTIONS] Found ${typeOfOperations.length} operations from Data!A2:A + Data!B2:B`);
        
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
        const normalizedPaymentTypeNames: string[] = [];
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
        // PARSE PAYMENT TYPES from Lists!R:S:T
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
        const maxRows = Math.max(paymentCatRows.length, paymentMonthRows.length, paymentValueRows.length);
        
        for (let i = 1; i < maxRows; i++) { // Skip header row
          const category = paymentCatRows[i]?.[0];
          const month = paymentMonthRows[i]?.[0];
          const valueStr = paymentValueRows[i]?.[0];
          
          if (!category || !month) continue;
          
          const value = typeof valueStr === 'number'
            ? valueStr
            : parseFloat(String(valueStr || '').replace(/[^\d.-]/g, '')) || 0;
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
        console.log(`[OPTIONS] Sample:`, typeOfPayments[0]);
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

    // Build response
    const response = {
      ok: true,
      data: {
        properties,
        typeOfOperations,
        typeOfPayments
      },
      updatedAt,
      cached: false,
      source: 'google_sheets_lists+data',
      metadata: {
        totalProperties: properties.length,
        totalOperations: typeOfOperations.length,
        totalPayments: typeOfPayments.length
      }
    };

    console.log('[OPTIONS] Successfully returned dropdown options');
    console.log(`[OPTIONS] Properties: ${properties.length}, Operations: ${typeOfOperations.length}, Payments: ${typeOfPayments.length}`);

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
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
