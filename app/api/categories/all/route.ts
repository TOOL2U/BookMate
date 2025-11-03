/**
 * API Route: /api/categories/all
 * 
 * Fetches ALL dropdown options from Google Sheets Data columns:
 * - Column A (row 2+): Revenues
 * - Column B (row 2+): Expense Categories (Type of Operation)
 * - Column C (row 2+): Properties
 * - Column D (row 2+): Payment Types
 * 
 * This replaces the hardcoded config/options.json approach.
 * All dropdowns in the app should use this API for real-time sync with Google Sheets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const DATA_SHEET = 'Data';

// Helper to get Google Sheets credentials
function getCredentials() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  console.log('[ALL_CATEGORIES] Using credentials from GOOGLE_SERVICE_ACCOUNT_KEY');
  return JSON.parse(serviceAccountKey);
}

// GET HANDLER - Fetch all categories from Google Sheets
export async function GET(request: NextRequest) {
  try {
    console.log('[ALL_CATEGORIES] Fetching all categories from Google Sheets...');

    // Initialize Google Sheets API
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all four columns in a single batch request
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: GOOGLE_SHEET_ID,
      ranges: [
        `${DATA_SHEET}!A2:A`,  // Revenues
        `${DATA_SHEET}!B2:B`,  // Expenses (Type of Operation)
        `${DATA_SHEET}!C2:C`,  // Properties
        `${DATA_SHEET}!D2:D`,  // Payment Types
      ],
    });

    const valueRanges = response.data.valueRanges || [];

    // Extract and clean data from each column
    const revenues = (valueRanges[0]?.values || [])
      .map(row => row[0])
      .filter(val => val && val.trim() !== '');

    const typeOfOperation = (valueRanges[1]?.values || [])
      .map(row => row[0])
      .filter(val => val && val.trim() !== '');

    const properties = (valueRanges[2]?.values || [])
      .map(row => row[0])
      .filter(val => val && val.trim() !== '');

    const typeOfPayment = (valueRanges[3]?.values || [])
      .map(row => row[0])
      .filter(val => val && val.trim() !== '');

    console.log(`[ALL_CATEGORIES] Found:
  - ${revenues.length} revenues
  - ${typeOfOperation.length} expense categories
  - ${properties.length} properties
  - ${typeOfPayment.length} payment types`);

    return NextResponse.json(
      {
        ok: true,
        data: {
          revenues,
          typeOfOperation,
          properties,
          typeOfPayment,
          // Month names remain hardcoded as they don't change
          month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        meta: {
          source: 'Google Sheets Data',
          timestamp: new Date().toISOString(),
          counts: {
            revenues: revenues.length,
            typeOfOperation: typeOfOperation.length,
            properties: properties.length,
            typeOfPayment: typeOfPayment.length,
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[ALL_CATEGORIES] Error fetching categories:', error);
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
