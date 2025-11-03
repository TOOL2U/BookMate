import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

/**
 * GET /api/options
 * 
 * Returns all dropdown options and payment type data.
 * Data is fetched directly from Google Sheets Lists!R:T for payment types with monthly values.
 * Other categories are read from config/live-dropdowns.json.
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
      return NextResponse.json(
        {
          ok: false,
          error: 'Dropdown options not available. Please run sync script first.',
          data: null
        },
        { status: 500 }
      );
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
      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (spreadsheetId) {
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
              "'P&L (DO NOT EDIT)'!4:4"  // Full row 4 (includes all month headers)
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
            monthHeadersRange         // P&L row 4
          ] = valueRanges;
          
          // ========================================
          // EXTRACT PROPERTIES (Data!C2:C)
          // ========================================
          const propertyRows = dataPropertiesRange?.values || [];
          const propertyNames: string[] = [];
          
          for (let i = 0; i < propertyRows.length; i++) {
            const name = propertyRows[i]?.[0]?.trim();
            if (name && !['PROPERTY', 'Property'].includes(name)) {
              propertyNames.push(name);
            }
          }
          
          properties = propertyNames;
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
            const name = revenueRows[i]?.[0]?.trim();
            if (name && !['REVENUES', 'Revenue'].includes(name)) {
              operationNames.push(name);
            }
          }
          
          // Add all overhead/expenses
          for (let i = 0; i < overheadRows.length; i++) {
            const name = overheadRows[i]?.[0]?.trim();
            if (name && !['OVERHEAD EXPENSES', 'EXPENSES', 'Expense'].includes(name)) {
              operationNames.push(name);
            }
          }
          
          typeOfOperations = operationNames;
          console.log(`[OPTIONS] Found ${typeOfOperations.length} operations (${revenueRows.length - 1} revenues + ${overheadRows.length - 1} expenses) from Data!A2:A + Data!B2:B`);
          
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
          
          console.log(`[OPTIONS] Found ${paymentTypeNames.length} payment type categories from Data!D2:D`);
          console.log(`[OPTIONS] Categories:`, paymentTypeNames);

          // Extract month headers from P&L sheet
          const monthHeaders = monthHeadersRange?.values?.[0] || [];
          const monthMap: Record<string, number> = {};
          monthHeaders.forEach((month, index) => {
            if (month) {
              monthMap[month.toString().toUpperCase()] = index;
            }
          });
          
          console.log(`[OPTIONS] Month headers:`, monthHeaders);

          // ========================================
          // PARSE PAYMENT TYPES from Lists!R:S:T
          // ========================================
          const paymentCatRows = listsPaymentCatRange?.values || [];
          const paymentMonthRows = listsPaymentMonthRange?.values || [];
          const paymentValueRows = listsPaymentValueRange?.values || [];
          
          const paymentMap = new Map<string, { name: string; monthly: number[]; yearTotal: number }>();
          
          // Initialize all payment type categories with zero values
          paymentTypeNames.forEach(name => {
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
            
            const value = parseFloat(valueStr) || 0;
            const payment = paymentMap.get(category);
            
            if (payment) {
              // Use month header mapping to get correct index
              const monthIndex = monthMap[month.toString().toUpperCase()];
              if (monthIndex !== undefined && monthIndex >= 0 && monthIndex < 12) {
                payment.monthly[monthIndex] = value;
                payment.yearTotal += value;
              }
            }
          }
          
          // Build final array maintaining order from Data!D2:D
          typeOfPayments = paymentTypeNames.map(name => paymentMap.get(name)!);
          
          console.log(`[OPTIONS] Built ${typeOfPayments.length} payment types with monthly data`);
          console.log(`[OPTIONS] Sample:`, typeOfPayments[0]);
        }
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
      source: 'google_sheets_lists',
      metadata: {
        totalProperties: properties.length,
        totalOperations: typeOfOperations.length,
        totalPayments: typeOfPayments.length
      }
    };

    console.log('[OPTIONS] Successfully returned dropdown options');
    console.log(`[OPTIONS] Properties: ${properties.length}, Operations: ${typeOfOperations.length}, Payments: ${typeOfPayments.length}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[OPTIONS] Error reading dropdown options:', error);
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load dropdown options',
        data: null
      },
      { status: 500 }
    );
  }
}

