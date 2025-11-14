/**
 * API Route: /api/categories/properties
 * 
 * Manages property categories in Google Sheets Data!C2:C
 * 
 * GET: Fetch all properties from Data sheet
 * POST: Add, edit, or delete properties
 * 
 * IMPORTANT: This writes directly to Data sheet.
 * Apps Script onEdit trigger will auto-rebuild P&L when Data!C changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling, APIErrors } from '@/lib/api/errors';
import { withSecurityHeaders } from '@/lib/api/security';
import { getAccountFromSession, NoAccountError, NotAuthenticatedError } from '@/lib/api/account-helper';

// ============================================================================
// CONSTANTS
// ============================================================================

const DATA_SHEET = 'Data';
const DATA_PROPERTY_START_ROW = 2; // Properties start at C2 (C1 is header "PROPERTIES")
const DATA_PROPERTY_COL = 3; // Column C

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
    console.log('[PROPERTIES] Using credentials from GOOGLE_SERVICE_ACCOUNT_KEY');
    try {
      return JSON.parse(serviceAccountKey);
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON');
    }
  }

  // Try config file (for local development)
  try {
    const credentials = require('../../../../config/google-credentials.json');
    console.log('[PROPERTIES] Using credentials from config/google-credentials.json');
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
// GET HANDLER - Fetch all properties
// ============================================================================

async function getHandler(request: NextRequest) {
  try {
    console.log('[PROPERTIES] Fetching properties from Google Sheets...');

    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromSession();
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

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = account.sheetId; // Use account-specific sheet ID

    console.log(`[PROPERTIES] Using sheet ID from account: ${account.companyName}`);

    // Read properties from Data!C2:C
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!C${DATA_PROPERTY_START_ROW}:C`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const values = response.data.values || [];
    const properties = values
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    console.log(`[PROPERTIES] Found ${properties.length} properties`);

    return NextResponse.json({
      ok: true,
      data: {
        properties,
        count: properties.length,
        source: 'google_sheets',
        sheet: DATA_SHEET,
        range: `C${DATA_PROPERTY_START_ROW}:C`,
      },
    });

  } catch (error) {
    console.error('[PROPERTIES] Error fetching properties:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch properties',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER - Add, Edit, or Delete properties
// ============================================================================

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldValue, newValue, index } = body;

    console.log('[PROPERTIES] Action:', action, { oldValue, newValue, index });

    if (!action || !['add', 'edit', 'delete'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Must be add, edit, or delete.' },
        { status: 400 }
      );
    }

    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromSession();
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

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = account.sheetId; // Use account-specific sheet ID

    console.log(`[PROPERTIES] Updating properties for: ${account.companyName}`);

    // First, get current properties
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!C${DATA_PROPERTY_START_ROW}:C`,
    });

    const currentValues = response.data.values || [];
    let properties = currentValues
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    // Perform the requested action
    if (action === 'add') {
      if (!newValue || typeof newValue !== 'string' || !newValue.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Property name is required' },
          { status: 400 }
        );
      }

      const trimmedNew = newValue.trim();

      // Check for duplicates (case-insensitive)
      if (properties.some(cat => cat.toLowerCase() === trimmedNew.toLowerCase())) {
        return NextResponse.json(
          { ok: false, error: 'Property already exists' },
          { status: 400 }
        );
      }

      properties.push(trimmedNew);
      console.log(`[PROPERTIES] Added property: "${trimmedNew}"`);

    } else if (action === 'edit') {
      if (index === undefined || index < 0 || index >= properties.length) {
        return NextResponse.json(
          { ok: false, error: 'Invalid property index' },
          { status: 400 }
        );
      }

      if (!newValue || typeof newValue !== 'string' || !newValue.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Property name is required' },
          { status: 400 }
        );
      }

      const trimmedNew = newValue.trim();

      // Check for duplicates, excluding the current item
      if (properties.some((cat, i) => i !== index && cat.toLowerCase() === trimmedNew.toLowerCase())) {
        return NextResponse.json(
          { ok: false, error: 'Property already exists' },
          { status: 400 }
        );
      }

      properties[index] = trimmedNew;
      console.log(`[PROPERTIES] Edited property at index ${index}: "${oldValue}" → "${trimmedNew}"`);

    } else if (action === 'delete') {
      if (index === undefined || index < 0 || index >= properties.length) {
        return NextResponse.json(
          { ok: false, error: 'Invalid property index' },
          { status: 400 }
        );
      }

      const deleted = properties.splice(index, 1)[0];
      console.log(`[PROPERTIES] Deleted property: "${deleted}"`);
    }

    // Clear the range first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${DATA_SHEET}!C${DATA_PROPERTY_START_ROW}:C`,
    });

    // Write the updated properties back
    if (properties.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${DATA_SHEET}!C${DATA_PROPERTY_START_ROW}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: properties.map(cat => [cat]),
        },
      });
    }

    // Wait a moment for Apps Script to rebuild P&L
    console.log('[PROPERTIES] Waiting 1 second for Apps Script to rebuild P&L...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      ok: true,
      data: {
        properties,
        count: properties.length,
        action,
      },
    });

  } catch (error) {
    console.error('[PROPERTIES] Error updating properties:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to update properties',
      },
      { status: 500 }
    );
  }
}


// Apply middleware: security headers → rate limiting → error handling
export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(getHandler),
    RATE_LIMITS.read
  )
);

export const POST = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(postHandler),
    RATE_LIMITS.write
  )
);
