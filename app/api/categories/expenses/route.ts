import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * NEW Expense Category Management API
 * 
 * Connects to the automated Google Sheets backend.
 * Writes ONLY to Data!B30:B (expense categories).
 * The Apps Script automatically updates P&L sheet.
 * 
 * Architecture:
 * - Data sheet: User-editable category list (Column B)
 * - P&L sheet: Auto-generated from Data!B via ARRAYFORMULA
 * - Apps Script: onEdit trigger rebuilds formulas when Data!B changes
 */

interface ExpenseCategoryAction {
  action: 'add' | 'edit' | 'delete' | 'list';
  oldValue?: string;
  newValue?: string;
  index?: number;
}

// Constants matching Apps Script
const DATA_SHEET = 'Data';
const DATA_CATEGORY_START_ROW = 30; // B30 is first expense category row
const DATA_CATEGORY_COL = 2; // Column B (0-indexed: A=1, B=2)

/**
 * GET /api/categories/expenses
 * List all expense categories from Data!B30:B
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[EXPENSES] Fetching expense categories from Google Sheets...');

    // Setup Google Sheets API
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Read all expense categories from Data!B30:B (open-ended range)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!B${DATA_CATEGORY_START_ROW}:B`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const values = response.data.values || [];
    const categories = values
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    console.log(`[EXPENSES] Found ${categories.length} expense categories`);

    return NextResponse.json({
      ok: true,
      data: {
        categories,
        count: categories.length,
        source: 'google_sheets',
        sheet: DATA_SHEET,
        range: `B${DATA_CATEGORY_START_ROW}:B`,
      },
    });

  } catch (error) {
    console.error('[EXPENSES] Error fetching categories:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch expense categories',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories/expenses
 * Add, edit, or delete an expense category
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExpenseCategoryAction = await request.json();
    const { action, oldValue, newValue, index } = body;

    console.log(`[EXPENSES] Action: ${action}`, { oldValue, newValue, index });

    // Validate request
    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    // Setup Google Sheets API
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Get current categories
    const currentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DATA_SHEET}!B${DATA_CATEGORY_START_ROW}:B`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const currentValues = currentResponse.data.values || [];
    let categories = currentValues
      .map(row => row[0])
      .filter(val => val && typeof val === 'string' && val.trim().length > 0)
      .map(val => val.trim());

    let message = '';
    let modified = false;

    // Perform the action
    switch (action) {
      case 'add': {
        if (!newValue || !newValue.trim()) {
          return NextResponse.json(
            { ok: false, error: 'New value is required for add action' },
            { status: 400 }
          );
        }

        const trimmedValue = newValue.trim();

        // Check for duplicates
        if (categories.includes(trimmedValue)) {
          return NextResponse.json(
            { ok: false, error: 'This expense category already exists' },
            { status: 400 }
          );
        }

        categories.push(trimmedValue);
        modified = true;
        message = `Added expense category: "${trimmedValue}"`;
        break;
      }

      case 'edit': {
        if (!oldValue || !newValue || !newValue.trim()) {
          return NextResponse.json(
            { ok: false, error: 'Both old and new values are required for edit action' },
            { status: 400 }
          );
        }

        const editIndex = categories.indexOf(oldValue);
        if (editIndex === -1) {
          return NextResponse.json(
            { ok: false, error: 'Original expense category not found' },
            { status: 404 }
          );
        }

        const trimmedValue = newValue.trim();

        // Check if new value already exists (but not the same as old value)
        if (trimmedValue !== oldValue && categories.includes(trimmedValue)) {
          return NextResponse.json(
            { ok: false, error: 'An expense category with this name already exists' },
            { status: 400 }
          );
        }

        categories[editIndex] = trimmedValue;
        modified = true;
        message = `Updated expense category: "${oldValue}" → "${trimmedValue}"`;
        break;
      }

      case 'delete': {
        if (index === undefined && !oldValue) {
          return NextResponse.json(
            { ok: false, error: 'Either index or oldValue is required for delete action' },
            { status: 400 }
          );
        }

        let deleteIndex = index;
        if (deleteIndex === undefined && oldValue) {
          deleteIndex = categories.indexOf(oldValue);
        }

        if (deleteIndex === undefined || deleteIndex === -1 || deleteIndex >= categories.length) {
          return NextResponse.json(
            { ok: false, error: 'Expense category not found' },
            { status: 404 }
          );
        }

        const deletedValue = categories[deleteIndex];
        categories.splice(deleteIndex, 1);
        modified = true;
        message = `Deleted expense category: "${deletedValue}"`;
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Invalid action. Must be add, edit, or delete' },
          { status: 400 }
        );
    }

    if (!modified) {
      return NextResponse.json(
        { ok: false, error: 'No changes were made' },
        { status: 400 }
      );
    }

    // Write updated categories back to Data!B30:B
    // Clear the entire range first, then write new values
    const maxRows = Math.max(categories.length, currentValues.length);
    const clearRange = `${DATA_SHEET}!B${DATA_CATEGORY_START_ROW}:B${DATA_CATEGORY_START_ROW + maxRows}`;
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: clearRange,
    });

    // Write new values
    if (categories.length > 0) {
      const writeRange = `${DATA_SHEET}!B${DATA_CATEGORY_START_ROW}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: writeRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: categories.map(cat => [cat]),
        },
      });
    }

    console.log(`[EXPENSES] ${message}`);
    console.log(`[EXPENSES] Waiting 1 second for Apps Script to rebuild P&L...`);

    // Wait 1 second for Apps Script onEdit trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      ok: true,
      message,
      data: {
        action,
        categories,
        count: categories.length,
        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[EXPENSES] Error updating categories:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to update expense categories',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get Google credentials from environment or file
 */
function getCredentials() {
  // Try parsing the service account key from environment (Vercel/Production format)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('[EXPENSES] Using credentials from GOOGLE_SERVICE_ACCOUNT_KEY');
      return credentials;
    } catch (error) {
      console.error('[EXPENSES] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Try alternative environment variable names
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } catch (error) {
      console.error('[EXPENSES] Failed to parse GOOGLE_CREDENTIALS_JSON');
    }
  }

  // Try building from individual fields
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    console.log('[EXPENSES] Using credentials from individual env vars');
    return {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || 'accounting-buddy-476114',
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      universe_domain: 'googleapis.com',
    };
  }

  // Fall back to file (for local development)
  const credPath = path.join(process.cwd(), 'config', 'google-credentials.json');
  if (fs.existsSync(credPath)) {
    console.log('[EXPENSES] Using credentials from config file');
    return JSON.parse(fs.readFileSync(credPath, 'utf8'));
  }

  throw new Error(
    'Google credentials not found.\n' +
    'Set one of:\n' +
    '  - GOOGLE_SERVICE_ACCOUNT_KEY (full JSON)\n' +
    '  - GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY\n' +
    '  - Create config/google-credentials.json\n' +
    'See EXPENSE_CATEGORY_MANAGEMENT.md for setup.'
  );
}
