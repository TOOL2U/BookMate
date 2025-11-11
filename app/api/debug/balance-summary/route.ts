// Force Node.js runtime for Google Sheets API
export const runtime = 'nodejs';

/**
 * GET /api/debug/balance-summary
 * 
 * Shows first 5 rows of Balance Summary tab to understand structure
 * ⚠️ DISABLED IN PRODUCTION FOR SECURITY
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Disable debug endpoints in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production',
      code: 'FORBIDDEN',
    }, { status: 403 });
  }

  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsJson) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Missing sheet ID' }, { status: 500 });
    }

    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get first 10 rows of Balance Summary
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Balance Summary'!A1:Z10`
    });

    const rows = response.data.values || [];
    
    return NextResponse.json({
      ok: true,
      rowCount: rows.length,
      rows: rows.map((row, idx) => ({
        rowNumber: idx + 1,
        values: row
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
