/**
 * GET /api/debug/sheet-tabs
 * 
 * Shows ALL tabs in the spreadsheet with their headers
 */

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    
    // Get sheet metadata with headers
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: [] // Get all sheets
    });

    const allTabs = (response.data.sheets || []).map(sheet => {
      const title = sheet.properties?.title || 'Untitled';
      const sheetId = sheet.properties?.sheetId || 0;
      
      // Get first row (headers)
      const rowData = sheet.data?.[0]?.rowData || [];
      const firstRow = rowData[0]?.values || [];
      const headers = firstRow.map((cell: any) => 
        cell?.formattedValue || cell?.userEnteredValue?.stringValue || ''
      ).filter(h => h); // Remove empty headers
      
      return {
        title,
        sheetId,
        headerCount: headers.length,
        headers
      };
    });

    return NextResponse.json({
      ok: true,
      spreadsheetId,
      tabCount: allTabs.length,
      tabs: allTabs
    });

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
