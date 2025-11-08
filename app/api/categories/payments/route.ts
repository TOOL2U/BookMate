/**
 * API Route: /api/categories/payments
 * 
 * Manages payment type categories in Google Sheets Data!D2:D
 * 
 * GET: Fetch all payment types from Data sheet
 * POST: Add, edit, or delete payment types
 * 
 * IMPORTANT: This writes directly to Data sheet.
 * Apps Script onEdit trigger will auto-rebuild P&L when Data!D changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// ============================================================================
// CONSTANTS
// ============================================================================

const DATA_SHEET = 'Data';
const DATA_PAYMENT_START_ROW = 2; // Payment types start at D2 (D1 is header "PAYMENT TYPES")
const DATA_PAYMENT_COL = 4; // Column D

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Google Sheets credentials from environment or config file
 */
function getCredentials() {
  // Try environment variable first (for Vercel production)
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    console.log('[PAYMENTS] Using credentials from GOOGLE_SERVICE_ACCOUNT_KEY');
    try {
      return JSON.parse(serviceAccountKey);
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON');
    }
  }

  // Try config file (for local development)
  try {
    const credentials = require('../../../../config/google-credentials.json');
    console.log('[PAYMENTS] Using credentials from config/google-credentials.json');
    return credentials;
  } catch (error) {
    // Config file doesn't exist
  }

  throw new Error(
    'Google credentials not found.\n' +
    'For production: Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable.\n' +
    'For local dev: Create config/google-credentials.json file.\n' +
    'See DEPLOYMENT_SETUP.md for setup instructions.'
  );
}

// ============================================================================
// GET HANDLER - Fetch all payment types
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('[PAYMENTS] Fetching payment types from Google Sheets...');

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable not set');
    }

    // Read payment types from Data!D2:D
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!D${DATA_PAYMENT_START_ROW}:D`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const values = response.data.values || [];
    const paymentTypes = values
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    console.log(`[PAYMENTS] Found ${paymentTypes.length} payment types`);

    return NextResponse.json({
      ok: true,
      data: {
        paymentTypes,
        count: paymentTypes.length,
        source: 'google_sheets',
        sheet: DATA_SHEET,
        range: `D${DATA_PAYMENT_START_ROW}:D`,
      },
    });

  } catch (error) {
    console.error('[PAYMENTS] Error fetching payment types:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment types',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Add, Edit, or Delete payment types
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldValue, newValue, index } = body;

    console.log('[PAYMENTS] Action:', action, { oldValue, newValue, index });

    if (!action || !['add', 'edit', 'delete'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Must be add, edit, or delete.' },
        { status: 400 }
      );
    }

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable not set');
    }

    // First, get current payment types
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!D${DATA_PAYMENT_START_ROW}:D`,
    });

    const currentValues = response.data.values || [];
    let paymentTypes = currentValues
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    // Perform the requested action
    if (action === 'add') {
      if (!newValue || typeof newValue !== 'string' || !newValue.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Payment type name is required' },
          { status: 400 }
        );
      }

      const trimmedNew = newValue.trim();

      // Check for duplicates (case-insensitive)
      if (paymentTypes.some(cat => cat.toLowerCase() === trimmedNew.toLowerCase())) {
        return NextResponse.json(
          { ok: false, error: 'Payment type already exists' },
          { status: 400 }
        );
      }

      paymentTypes.push(trimmedNew);
      console.log(`[PAYMENTS] Added payment type: "${trimmedNew}"`);

    } else if (action === 'edit') {
      if (index === undefined || index < 0 || index >= paymentTypes.length) {
        return NextResponse.json(
          { ok: false, error: 'Invalid payment type index' },
          { status: 400 }
        );
      }

      if (!newValue || typeof newValue !== 'string' || !newValue.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Payment type name is required' },
          { status: 400 }
        );
      }

      const trimmedNew = newValue.trim();

      // Check for duplicates, excluding the current item
      if (paymentTypes.some((cat, i) => i !== index && cat.toLowerCase() === trimmedNew.toLowerCase())) {
        return NextResponse.json(
          { ok: false, error: 'Payment type already exists' },
          { status: 400 }
        );
      }

      paymentTypes[index] = trimmedNew;
      console.log(`[PAYMENTS] Edited payment type at index ${index}: "${oldValue}" → "${trimmedNew}"`);

    } else if (action === 'delete') {
      if (index === undefined || index < 0 || index >= paymentTypes.length) {
        return NextResponse.json(
          { ok: false, error: 'Invalid payment type index' },
          { status: 400 }
        );
      }

      const deleted = paymentTypes.splice(index, 1)[0];
      console.log(`[PAYMENTS] Deleted payment type: "${deleted}"`);
    }

    // Clear the range first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${DATA_SHEET}!D${DATA_PAYMENT_START_ROW}:D`,
    });

    // Write the updated payment types back
    if (paymentTypes.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${DATA_SHEET}!D${DATA_PAYMENT_START_ROW}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: paymentTypes.map(cat => [cat]),
        },
      });
    }

    // Wait a moment for Apps Script to rebuild P&L
    console.log('[PAYMENTS] Waiting 1 second for Apps Script to rebuild P&L...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      ok: true,
      data: {
        paymentTypes,
        count: paymentTypes.length,
        action,
      },
    });

  } catch (error) {
    console.error('[PAYMENTS] Error updating payment types:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to update payment types',
      },
      { status: 500 }
    );
  }
}
