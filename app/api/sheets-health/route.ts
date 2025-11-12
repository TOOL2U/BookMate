// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';

import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSpreadsheetId } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    // Get user's spreadsheet ID from authenticated request
    const spreadsheetId = await getUserSpreadsheetId(request);
    
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });
    return NextResponse.json({ ok: true, title: res.data.properties?.title });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message }, { status: 500 });
  }
}